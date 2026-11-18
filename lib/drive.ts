import {z} from 'zod';
import {getPool,org} from './server-store';
import {seal,unseal} from './mail-config';
import {archivePlan,extensionFor,monthFolders,safePart} from './drive-names';
import type {Workspace} from './types';
// Archivo de originales en Google Drive. Permiso mínimo «drive.file»: la app solo ve y toca la carpeta y los
// archivos que ella misma crea, nunca el resto del Drive del usuario. La carpeta la crea la app al conectar.
export const driveScope='https://www.googleapis.com/auth/drive.file';
export const folderUrl=(id:string)=>'https://drive.google.com/drive/folders/'+encodeURIComponent(id);
export const folderNameSchema=z.string().transform(v=>safePart(v)).pipe(z.string().min(1).max(80));
type Tokens={access_token:string;refresh_token:string;expires_at:number};
type Config={email?:string;folderId?:string;folderName?:string;folders?:Record<string,string>;lastError?:string|null;lastArchive?:string};
export class DriveError extends Error{constructor(message:string,public kind:'auth'|'folder'|'api'|'denied'|'other'='other'){super(message);}}
/** Motivo de un 403 de Google: API de Drive sin activar en el proyecto, o permiso insuficiente. */
export function forbiddenKind(body:unknown):'api'|'denied'{const e=(body as {error?:{message?:string;status?:string;errors?:{reason?:string}[];details?:{reason?:string}[]}}|null)?.error;const reasons=[...(e?.errors||[]),...(e?.details||[])].map(x=>String(x.reason||'')).join(' ')+' '+String(e?.message||'');return /accessNotConfigured|SERVICE_DISABLED|has not been used|is disabled|it is disabled/i.test(reasons)?'api':'denied';}
async function row(){const r=await getPool().query("SELECT config,secret FROM ria_integrations WHERE organization_id=$1 AND kind='drive'",[org()]);return r.rows[0] as {config:Config;secret:string|null}|undefined;}
const saveConfig=(config:Config)=>getPool().query("UPDATE ria_integrations SET config=$2,updated_at=now() WHERE organization_id=$1 AND kind='drive'",[org(),JSON.stringify(config)]);
export async function driveStatus(){
 const r=await row(),connected=Boolean(r?.secret&&r.config.folderId);
 const counts=await getPool().query("SELECT count(*) FILTER (WHERE drive_state='done')::int AS archived,count(*) FILTER (WHERE drive_state='error')::int AS failed FROM ria_documents WHERE organization_id=$1",[org()]);
 return {connected,email:connected?r!.config.email||null:null,folderName:connected?r!.config.folderName||null:null,folderUrl:connected?folderUrl(r!.config.folderId!):null,archived:counts.rows[0].archived as number,failed:counts.rows[0].failed as number,lastError:r?.config.lastError||null,lastArchive:r?.config.lastArchive||null};
}
export async function forgetDrive(){await getPool().query("UPDATE ria_integrations SET secret=NULL,updated_at=now() WHERE organization_id=$1 AND kind='drive'",[org()]);}
// ---- Llamadas a la API de Drive ----
async function call(token:string,url:string,init:RequestInit={}){
 let res:Response;try{res=await fetch(url,{...init,headers:{Authorization:'Bearer '+token,...(init.headers||{})},signal:AbortSignal.timeout(25000),cache:'no-store',redirect:'error'});}catch{throw new DriveError('No se pudo conectar con Google Drive.');}
 if(res.status===401)throw new DriveError('Google ha retirado el permiso. Vuelve a conectar Google Drive.','auth');
 if(res.status===404)throw new DriveError('La carpeta ya no existe en Drive.','folder');
 if(res.status===403){const kind=forbiddenKind(await res.json().catch(()=>null));throw new DriveError(kind==='api'?'La API de Google Drive no está activada en el proyecto de Google Cloud de la app.':'Google no permite a la app usar Drive con esta cuenta.',kind);}
 if(!res.ok)throw new DriveError('Google Drive no pudo completar la operación (HTTP '+res.status+').');
 return res.json() as Promise<Record<string,any>>;
}
export async function createFolder(token:string,name:string,parent?:string){const f=await call(token,'https://www.googleapis.com/drive/v3/files?fields=id',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name,mimeType:'application/vnd.google-apps.folder',...(parent?{parents:[parent]}:{})})});return String(f.id);}
export async function driveEmail(token:string){const a=await call(token,'https://www.googleapis.com/drive/v3/about?fields=user(emailAddress)');return String(a.user?.emailAddress||'');}
async function upload(token:string,parent:string,name:string,mime:string,bytes:Buffer){
 const boundary='ria-'+Math.random().toString(36).slice(2);
 const body=Buffer.concat([Buffer.from(`--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify({name,parents:[parent]})}\r\n--${boundary}\r\nContent-Type: ${mime}\r\n\r\n`),bytes,Buffer.from(`\r\n--${boundary}--`)]);
 const f=await call(token,'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id',{method:'POST',headers:{'Content-Type':'multipart/related; boundary='+boundary},body});return String(f.id);
}
async function accessToken(secret:string){
 const tokens=JSON.parse(unseal(secret,org())) as Tokens;if(tokens.expires_at>Date.now()+60000)return tokens.access_token;
 const res=await fetch('https://oauth2.googleapis.com/token',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({client_id:process.env.GOOGLE_CLIENT_ID||'',client_secret:process.env.GOOGLE_CLIENT_SECRET||'',refresh_token:tokens.refresh_token,grant_type:'refresh_token'}),signal:AbortSignal.timeout(12000),cache:'no-store'}).catch(()=>null);
 if(!res)throw new DriveError('No se pudo conectar con Google.');if(!res.ok)throw new DriveError('Google ha retirado el permiso. Vuelve a conectar Google Drive.','auth');
 const fresh=z.object({access_token:z.string().min(1),expires_in:z.number().positive()}).parse(await res.json());
 const next=seal(JSON.stringify({...tokens,access_token:fresh.access_token,expires_at:Date.now()+fresh.expires_in*1000}),org());
 await getPool().query("UPDATE ria_integrations SET secret=$2 WHERE organization_id=$1 AND kind='drive' AND secret=$3",[org(),next,secret]);return fresh.access_token;
}
/** Guarda la conexión recién autorizada y crea la carpeta raíz con el nombre elegido por el usuario. */
export async function connectDrive(tokens:{access_token:string;refresh_token:string;expires_in:number},folderName:string){
 const email=await driveEmail(tokens.access_token),folderId=await createFolder(tokens.access_token,folderName);
 const config:Config={email,folderId,folderName,folders:{},lastError:null},secret=seal(JSON.stringify({access_token:tokens.access_token,refresh_token:tokens.refresh_token,expires_at:Date.now()+tokens.expires_in*1000}),org());
 await getPool().query("INSERT INTO ria_integrations(organization_id,kind,config,secret) VALUES($1,'drive',$2,$3) ON CONFLICT(organization_id,kind) DO UPDATE SET config=EXCLUDED.config,secret=EXCLUDED.secret,updated_at=now()",[org(),JSON.stringify(config),secret]);
 // Los documentos archivados en una carpeta anterior no se vuelven a subir; los que fallaron, sí.
 await getPool().query("UPDATE ria_documents SET drive_state=NULL WHERE organization_id=$1 AND drive_state IN ('error','uploading')",[org()]);
}
/**
 * Sube a Drive los originales que ya pertenecen a un albarán, una factura o una etiqueta y aún no están archivados.
 * Cada documento se reserva antes de subirlo para que dos ejecuciones simultáneas no lo dupliquen; si falla,
 * queda marcado y se reintenta en la siguiente pasada. Nunca lanza: devuelve lo hecho y lo pendiente.
 */
export async function archivePending(state:Pick<Workspace,'receipts'|'invoices'|'scans'>,budgetMs=40000){
 const out={uploaded:0,pending:0,error:null as string|null},pool=getPool(),end=Date.now()+budgetMs;
 try{
  const r=await row();if(!r?.secret||!r.config.folderId)return out;
  const plan=archivePlan(state);if(!plan.length)return out;
  const todo=await pool.query("SELECT id FROM ria_documents WHERE organization_id=$1 AND id=ANY($2::uuid[]) AND (drive_state IS NULL OR drive_state='error' OR (drive_state='uploading' AND drive_at<now()-interval '5 minutes'))",[org(),plan.map(p=>p.documentId)]);
  const waiting=new Set(todo.rows.map(x=>x.id as string)),entries=plan.filter(p=>waiting.has(p.documentId));out.pending=entries.length;if(!entries.length)return out;
  const token=await accessToken(r.secret),config=r.config,folders={...(config.folders||{})};let recreated=false;
  const folderFor=async(date:string)=>{const m=monthFolders(date);if(folders[m.key])return folders[m.key];const yearKey='y:'+m.year;if(!folders[yearKey])folders[yearKey]=await createFolder(token,m.year,config.folderId);
   folders[m.key]=m.year===m.month?folders[yearKey]:await createFolder(token,m.month,folders[yearKey]);await saveConfig({...config,folders});return folders[m.key];};
  for(const e of entries){if(Date.now()>end)break;
   const claim=await pool.query("UPDATE ria_documents SET drive_state='uploading',drive_at=now() WHERE id=$1 AND organization_id=$2 AND (drive_state IS NULL OR drive_state='error' OR (drive_state='uploading' AND drive_at<now()-interval '5 minutes')) RETURNING mime,original",[e.documentId,org()]);
   if(!claim.rowCount)continue;const doc=claim.rows[0],name=e.name+'.'+extensionFor(doc.mime);
   try{let parent=await folderFor(e.date),id:string;
    try{id=await upload(token,parent,name,doc.mime,doc.original);}
    catch(err){ // La subcarpeta del mes pudo borrarse en Drive: se vuelve a crear una vez.
     if(!(err instanceof DriveError)||err.kind!=='folder'||recreated)throw err;recreated=true;for(const k of Object.keys(folders))delete folders[k];parent=await folderFor(e.date);id=await upload(token,parent,name,doc.mime,doc.original);}
    await pool.query("UPDATE ria_documents SET drive_state='done',drive_file_id=$3,drive_name=$4,drive_at=now() WHERE id=$1 AND organization_id=$2",[e.documentId,org(),id,name]);out.uploaded++;out.pending--;
   }catch(err){await pool.query("UPDATE ria_documents SET drive_state='error',drive_at=now() WHERE id=$1 AND organization_id=$2",[e.documentId,org()]);throw err;}
  }
  await saveConfig({...config,folders,lastError:null,lastArchive:new Date().toISOString()});
 }catch(err){
  out.error=err instanceof DriveError?(err.kind==='folder'?'La carpeta de Drive ya no existe o está en la papelera. Vuelve a conectar para crear una nueva.':err.message):'No se pudo guardar en Google Drive.';
  await row().then(r=>r&&saveConfig({...r.config,lastError:out.error})).catch(()=>{});
 }
 return out;
}
