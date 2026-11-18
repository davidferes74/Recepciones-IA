'use client';
import {useEffect,useState} from 'react';
import {HardDrive,FolderOpen,ExternalLink,CheckCircle2,AlertTriangle,UploadCloud,ShieldCheck} from 'lucide-react';
import {Badge,Modal} from './ui';
export type DriveStatus={connected:boolean;email:string|null;folderName:string|null;folderUrl:string|null;archived:number;failed:number;lastError:string|null;lastArchive:string|null;googleReady:boolean;encryptionReady:boolean};
// Tarjeta de Google Drive pensada para alguien sin conocimientos técnicos: escribe el nombre de la carpeta,
// elige su cuenta de Google y la app crea la carpeta y guarda ahí cada documento escaneado con un nombre
// que se puede buscar. La app solo ve lo que ella misma crea en Drive.
export default function DriveConnection({demo,status,onStatus}:{demo:boolean;status:DriveStatus|null;onStatus:(s:DriveStatus)=>void}){
 const [open,setOpen]=useState(false),[name,setName]=useState('Recepciones-IA'),[busy,setBusy]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState(''),[again,setAgain]=useState(false);
 async function refresh(){const r=await fetch('/api/drive');const b=await r.json();if(r.ok)onStatus(b);}
 useEffect(()=>{if(!demo)void refresh().catch(()=>{});// eslint-disable-next-line react-hooks/exhaustive-deps
 },[demo]);
 async function post(body:unknown){const r=await fetch('/api/drive',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});const b=await r.json();if(!r.ok&&!b.status)throw Error(b.error);return b;}
 async function work(fn:()=>Promise<void>){if(busy)return;setBusy(true);setError('');setNotice('');try{await fn();}catch(e){setError(e instanceof Error?e.message:'No se completó la operación.');}finally{setBusy(false);}}
 const start=()=>work(async()=>{const b=await post({action:'start',folderName:name});window.location.assign(b.url);});
 const sync=()=>work(async()=>{const b=await post({action:'sync'});if(b.status)onStatus({...status!,...b.status});if(b.error)setError(b.error);else setNotice(b.uploaded?`${b.uploaded} ${b.uploaded===1?'documento guardado':'documentos guardados'} en Drive.`+(b.pending?` Quedan ${b.pending} para la siguiente pasada.`:''):'Todo estaba ya guardado en Drive.');});
 const ready=Boolean(status?.googleReady&&status?.encryptionReady),connected=Boolean(status?.connected);
 const form=<form className="form-stack" onSubmit={e=>{e.preventDefault();void start();}}>
  <ol className="wizard-help drive-steps"><li>Escribe cómo quieres que se llame la carpeta.</li><li>Elige tu cuenta de Google y pulsa <strong>Permitir</strong>.</li><li>La app crea la carpeta y empieza a guardar ahí lo escaneado.</li></ol>
  <label>Nombre de la carpeta en Drive<input required autoFocus maxLength={80} value={name} onChange={e=>setName(e.target.value)} placeholder="Recepciones-IA"/></label>
  <div className="drive-tree" aria-label="Cómo quedará organizada"><span><FolderOpen size={16}/>{name.trim()||'Recepciones-IA'}</span><span className="l1"><FolderOpen size={16}/>2026</span><span className="l2"><FolderOpen size={16}/>11 noviembre</span><span className="l3">2026-11-17 · Proveedor · Albarán ALB-2026-0148 · Pedido P00412.pdf</span><span className="l3">2026-11-17 · Proveedor · Factura F-2026-0312.pdf</span></div>
  <p className="helper"><ShieldCheck size={15}/> La app solo puede ver y modificar esta carpeta y lo que guarde en ella. No tiene acceso al resto de tu Drive.</p>
  {!ready&&<p className="notice">Falta una preparación única en el servidor (credenciales de Google y clave de cifrado). Avisa a quien administra la app.</p>}
  <button className="button primary" disabled={busy||!ready||!name.trim()}>{busy?'Abriendo Google…':'Continuar con Google'}</button>
 </form>;
 return <><div className="panel connection-card"><HardDrive size={23}/><h3>Google Drive</h3>
  <p>{demo?'Guarda cada documento escaneado en una carpeta de tu Drive. Disponible en el espacio privado.':connected?<>Carpeta <strong>{status!.folderName}</strong> · {status!.archived} {status!.archived===1?'documento guardado':'documentos guardados'}.</>:'Guarda cada albarán, factura y etiqueta en una carpeta de tu Drive, con un nombre fácil de buscar.'}</p>
  <Badge kind={connected?(status!.lastError?'danger':'success'):'neutral'}>{connected?(status!.lastError?'Requiere atención':'Conectado'):'Sin conectar'}</Badge>
  {!demo&&<div className="drive-card-actions">{connected&&<a className="button primary small" href={status!.folderUrl!} target="_blank" rel="noreferrer"><ExternalLink size={15}/>Abrir carpeta</a>}<button className="button secondary small" onClick={()=>{setOpen(true);setError('');setNotice('');setAgain(false);}}>{connected?'Gestionar':'Conectar'}</button></div>}</div>
  {open&&<Modal title="Google Drive" onClose={()=>{if(!busy)setOpen(false);}}><div className="form-stack">
   {connected&&!again?<>
    <div className={'wizard-card '+(status!.lastError?'warn':'ok')}>{status!.lastError?<AlertTriangle size={20}/>:<CheckCircle2 size={20}/>}<div><strong>{status!.lastError?'Hay un problema con el archivo':'Guardando en tu Drive'}</strong><p className="helper">Cuenta {status!.email} · carpeta «{status!.folderName}»</p>{status!.lastError&&<p>{status!.lastError}</p>}</div></div>
    <a className="button primary" href={status!.folderUrl!} target="_blank" rel="noreferrer"><FolderOpen size={17}/>Abrir la carpeta en Drive</a>
    <div className="sync-summary drive-summary"><div><strong>{status!.archived}</strong><span>guardados</span></div><div><strong>{status!.failed}</strong><span>con error</span></div><div><strong>{status!.lastArchive?new Date(status!.lastArchive).toLocaleDateString('es-ES',{day:'2-digit',month:'short',timeZone:'Europe/Madrid'}):'—'}</strong><span>último guardado</span></div></div>
    <p className="helper">Cada albarán, factura y foto de etiqueta se guarda solo al registrarlo, dentro de la carpeta del año y del mes. Para encontrar uno, escribe en el buscador de Drive el proveedor, el número de albarán o el pedido.</p>
    <button className="button secondary" disabled={busy} onClick={sync}><UploadCloud size={17}/>{busy?'Guardando…':'Guardar ahora lo pendiente'}</button>
    <div className="wizard-nav"><button className="text-button" disabled={busy} onClick={()=>{setAgain(true);setError('');setNotice('');}}>Usar otra carpeta u otra cuenta</button><button className="text-button" disabled={busy} onClick={()=>work(async()=>{await post({action:'disconnect'});await refresh();setNotice('Drive desconectado. La carpeta y sus documentos siguen en tu Drive.');})}>Desconectar</button></div>
   </>:<>{again&&<p className="notice">Se creará una carpeta nueva. Los documentos ya guardados se quedan en la carpeta anterior; los nuevos irán a esta.</p>}{form}</>}
   {notice&&<p className="notice" role="status">{notice}</p>}{error&&<p className="notice error" role="alert">{error}</p>}
  </div></Modal>}</>;
}
