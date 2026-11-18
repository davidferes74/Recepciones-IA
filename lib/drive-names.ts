import type {Workspace} from './types';
// Qué documentos se archivan en Drive y con qué nombre. Función pura: solo mira el estado de la app.
// Un documento se archiva cuando ya pertenece a algo (albarán, factura o lectura con etiqueta), porque
// de ahí sale su nombre. Formato elegido por el propietario: fecha primero.
//   2026-11-17 · Distribuciones Atlántico · Albarán ALB-2026-0148 · Pedido P00412.pdf
//   2026-11-17 · Distribuciones Atlántico · Factura F-2026-0312.pdf
//   2026-11-17 · Distribuciones Atlántico · Etiqueta lote L261115 · ALB-2026-0148.jpg
export type ArchiveEntry={documentId:string;kind:'receipt'|'invoice'|'label';date:string;name:string};
const SEP=' · ';
/** Texto apto para nombre de archivo en Drive, Windows y macOS: sin barras ni caracteres reservados. */
export function safePart(text:string){return text.normalize('NFC').replace(/[\u0000-\u001f\u007f<>:"/\\|?*]+/g,' ').replace(/\s+/g,' ').replace(/^[ .]+|[ .]+$/g,'').slice(0,80).trim();}
export const fileName=(parts:(string|undefined|false)[])=>parts.map(p=>p?safePart(p):'').filter(Boolean).join(SEP).slice(0,200);
export const extensionFor=(mime:string)=>({'application/pdf':'pdf','image/jpeg':'jpg','image/png':'png','image/webp':'webp'} as Record<string,string>)[mime]||'bin';
const MONTHS=['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
/** Carpetas de año y mes para una fecha YYYY-MM-DD: «2026» y «11 noviembre». */
export function monthFolders(date:string){const m=/^(\d{4})-(\d{2})/.exec(date);const month=m?Number(m[2]):0;if(!m||month<1||month>12)return {year:'Sin fecha',month:'Sin fecha',key:'sin-fecha'};return {year:m[1],month:m[2]+' '+MONTHS[month-1],key:m[1]+'-'+m[2]};}
const isId=(v:unknown):v is string=>typeof v==='string'&&/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
export function archivePlan(state:Pick<Workspace,'receipts'|'invoices'|'scans'>):ArchiveEntry[]{
 const seen=new Set<string>(),out:ArchiveEntry[]=[];
 const add=(documentId:string|undefined,kind:ArchiveEntry['kind'],date:string,parts:(string|undefined|false)[])=>{if(!isId(documentId)||seen.has(documentId))return;seen.add(documentId);out.push({documentId,kind,date,name:fileName(parts)});};
 for(const r of state.receipts)r.fileIds.forEach((id,i)=>add(id,'receipt',r.date,[r.date,r.supplier,'Albarán '+r.reference,r.order&&'Pedido '+r.order.name,r.fileIds.length>1&&'hoja '+(i+1)]));
 for(const f of state.invoices)(f.fileIds||[]).forEach((id,i)=>add(id,'invoice',f.date,[f.date,f.supplier,'Factura '+f.reference,(f.fileIds||[]).length>1&&'hoja '+(i+1)]));
 for(const s of state.scans){if(!s.evidenceId||s.reversed)continue;const r=state.receipts.find(x=>x.id===s.receiptId);if(!r)continue;
  add(s.evidenceId,'label',r.date,[r.date,r.supplier,'Etiqueta '+(s.lot?'lote '+s.lot:s.serial?'serie '+s.serial:'sin código'),r.reference]);}
 return out;
}
