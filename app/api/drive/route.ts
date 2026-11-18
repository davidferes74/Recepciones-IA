import {NextRequest,NextResponse} from 'next/server';
import {authorized,sameOrigin} from '@/lib/auth';
import {getPool,org,readWorkspace} from '@/lib/server-store';
import {encryptionReady} from '@/lib/mail-config';
import {authorizationUrl,googleReady,googleRedirect,hashState,newState} from '@/lib/google-oauth';
import {archivePending,driveScope,driveStatus,folderNameSchema,forgetDrive} from '@/lib/drive';
export const runtime='nodejs';export const maxDuration=60;export const dynamic='force-dynamic';
const json=(body:unknown,status=200)=>NextResponse.json(body,{status,headers:{'Cache-Control':'no-store'}});
export async function GET(req:NextRequest){if(!authorized(req))return json({error:'Inicia sesión.'},401);try{return json({...(await driveStatus()),googleReady:googleReady(),encryptionReady:encryptionReady()});}catch{return json({error:'No se pudo consultar Google Drive. Comprueba la migración de base de datos.'},503);}}
export async function POST(req:NextRequest){if(!authorized(req))return json({error:'Inicia sesión.'},401);if(!sameOrigin(req))return json({error:'Origen no permitido.'},403);try{
 const text=await req.text();if(text.length>2000)return json({error:'Solicitud demasiado grande.'},413);const body=JSON.parse(text);
 if(body.action==='start'){
  if(new URL(req.url).origin!==new URL(googleRedirect).origin)return json({error:'Conecta Google Drive desde la dirección de producción de la app.'},403);
  if(!googleReady()||!encryptionReady())return json({error:'Falta preparar Google en el servidor (GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET y TOKEN_ENCRYPTION_KEY).'},503);
  const parsed=folderNameSchema.safeParse(body.folderName);if(!parsed.success)return json({error:'Escribe un nombre para la carpeta.'},422);
  const state=newState(),session=hashState(req.cookies.get('ria_session')!.value);
  await getPool().query("DELETE FROM ria_oauth_states WHERE expires_at<now() OR (organization_id=$1 AND session_hash=$2 AND purpose='drive')",[org(),session]);
  await getPool().query("INSERT INTO ria_oauth_states(state_hash,organization_id,session_hash,expires_at,purpose,data) VALUES($1,$2,$3,now()+interval '10 minutes','drive',$4)",[hashState(state),org(),session,JSON.stringify({folderName:parsed.data})]);
  return json({url:authorizationUrl(state,driveScope)});
 }
 if(body.action==='sync'){const result=await archivePending(await readWorkspace(),45000);return json({...result,status:await driveStatus()},result.error?502:200);}
 if(body.action==='disconnect'){await forgetDrive();return json({saved:true});}
 return json({error:'Acción no válida.'},400);
 }catch{return json({error:'No se completó la operación con Google Drive.'},502);}}
