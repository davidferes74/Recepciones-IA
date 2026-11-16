import Decimal from 'decimal.js';
import {z} from 'zod';
import {parseScan} from './scanner';
import type {Workspace,Profile,Allocation,Invoice} from './types';
const text=z.string().trim().min(1).max(160), id=z.string().min(1).max(100);
const qty=z.string().regex(/^\d{1,9}(\.\d{1,3})?$/).refine(v=>new Decimal(v).gt(0),'La cantidad debe ser positiva.');
const profileSchema=z.object({id,name:text,version:z.number().int().positive(),prefix:z.string().max(30),suffix:z.string().max(30),terminator:z.enum(['Enter','Tab']),parser:z.enum(['plain','gs1','delimited']),delimiter:z.string().max(4),codePosition:z.number().int().min(0).max(10),lotPosition:z.number().int().min(-1).max(10),serialPosition:z.number().int().min(-1).max(10),quantity:qty,state:z.enum(['draft','validated'])});
export const commandSchema=z.discriminatedUnion('type',[
 z.object({type:z.literal('createProduct'),name:text,sku:text,code:z.string().min(1).max(100),unit:z.enum(['ud']),tracking:z.enum(['none','lot','serial']),packCode:z.string().max(100).optional(),packQuantity:qty.optional()}),
 z.object({type:z.literal('scan'),receiptId:id,raw:z.string().min(1).max(512),profileId:id,lot:z.string().max(40).optional(),serial:z.string().max(40).optional(),allowExcess:z.boolean().optional(),reason:z.string().max(400).optional()}),
 z.object({type:z.literal('undo'),receiptId:id}),
 z.object({type:z.literal('confirm'),receiptId:id,reason:z.string().max(400).optional()}),
 z.object({type:z.literal('tracking'),enabled:z.boolean()}),
 z.object({type:z.literal('profile'),profile:profileSchema}),
 z.object({type:z.literal('testProfile'),profileId:id,raw:z.string().min(1).max(512),expected:text}),
 z.object({type:z.literal('activateProfile'),profileId:id,device:text}),
 z.object({type:z.literal('createReceipt'),supplier:text,reference:text,date:z.string().regex(/^\d{4}-\d{2}-\d{2}$/),lines:z.array(z.object({productId:id,expected:qty,lot:z.string().max(40).optional()})).min(1).max(100),fileIds:z.array(id).max(20).default([])}),
 z.object({type:z.literal('createInvoice'),supplier:text,reference:text,date:z.string().regex(/^\d{4}-\d{2}-\d{2}$/),receiptRefs:z.array(text).max(100),lines:z.array(z.object({productId:id,quantity:qty,price:z.string().regex(/^\d{1,9}(\.\d{1,4})?$/).optional()})).min(1).max(100)}),
 z.object({type:z.literal('issue'),receiptId:id,message:text}),
 z.object({type:z.literal('resolveIssue'),issueId:id,resolution:text})
]);
export type Command=z.infer<typeof commandSchema>;
export type Envelope={id:string;version:number;command:Command};
export const envelopeSchema=z.object({id:z.string().uuid(),version:z.number().int().nonnegative(),command:commandSchema});
export class DomainError extends Error{constructor(message:string,public code=422){super(message);}}
export const sum=(xs:string[])=>xs.reduce((a,v)=>a.plus(v),new Decimal(0)).toString();
export function reconcile(state:Workspace):Allocation[]{
 const used=new Map<string,Decimal>();const allocations:Allocation[]=[];
 // Stable invoice order prevents new documents stealing allocations from earlier invoices.
 for(const invoice of state.invoices){for(const line of invoice.lines){let remaining=new Decimal(line.quantity);
  // Explicit references only. Missing references remain for review, not a fuzzy automatic assignment.
  for(const ref of invoice.receiptRefs){const matches=state.receipts.filter(r=>r.reference===ref&&r.supplier===invoice.supplier&&r.status!=='open');
   if(matches.length!==1)continue;const receipt=matches[0];
   for(const rl of receipt.lines.filter(l=>l.productId===line.productId)){
    const key=receipt.id+':'+rl.id;const available=Decimal.max(0,new Decimal(rl.received).minus(used.get(key)||0));const q=Decimal.min(available,remaining);
    if(q.gt(0)){allocations.push({invoiceId:invoice.id,invoiceLineId:line.id,receiptId:receipt.id,lineId:rl.id,quantity:q.toString()});used.set(key,(used.get(key)||new Decimal(0)).plus(q));remaining=remaining.minus(q);}
   }
  }
 }}return allocations;
}
export function invoiceSummary(s:Workspace,invoice:Invoice){const total=sum(invoice.lines.map(l=>l.quantity)),matched=sum(s.allocations.filter(a=>a.invoiceId===invoice.id).map(a=>a.quantity));return {total,matched,pending:new Decimal(total).minus(matched).toString(),complete:new Decimal(total).eq(matched)};}
export function applyCommand(original:Workspace,envelope:Envelope,now=new Date().toISOString()):Workspace{
 const {id:commandId,version,command:c}=envelopeSchema.parse(envelope);
 if(original.processed.includes(commandId))return original;
 if(version!==original.version)throw new DomainError('Hay cambios más recientes. Actualiza antes de continuar.',409);
 const s=structuredClone(original);
 const receipt=(rid:string)=>{const r=s.receipts.find(x=>x.id===rid);if(!r)throw new DomainError('Recepción no encontrada.',404);return r;};
 const openReceipt=(rid:string)=>{const r=receipt(rid);if(r.status!=='open')throw new DomainError('Esta recepción ya está cerrada.',409);return r;};
 let message='';
 switch(c.type){
 case 'createProduct':{if(s.products.some(p=>p.sku===c.sku||p.code===c.code||p.packCode===c.code||(c.packCode&&(p.code===c.packCode||p.packCode===c.packCode))))throw new DomainError('Referencia o código ya registrado.');if(c.packCode&&!c.packQuantity)throw new DomainError('Indica las unidades del embalaje.');s.products.push({id:commandId,name:c.name,sku:c.sku,code:c.code,unit:c.unit,tracking:c.tracking,packCode:c.packCode,packQuantity:c.packQuantity});message='Producto registrado · '+c.name;break;}
 case 'scan':{
  const r=openReceipt(c.receiptId),p=s.profiles.find(x=>x.id===c.profileId);if(!p)throw new DomainError('Selecciona un perfil de lector.');
  if(p.state!=='validated')throw new DomainError('Prueba y activa el perfil del lector antes de recibir.');
  const parsed=parseScan(c.raw,p);const found=s.products.filter(x=>x.code===parsed.code||x.code.padStart(14,'0')===parsed.code||x.packCode===parsed.code);
  if(found.length!==1)throw new DomainError('Código desconocido o ambiguo. No se ha sumado mercancía.');
  const product=found[0],lines=r.lines.filter(l=>l.productId===product.id);
  if(lines.length!==1)throw new DomainError('Producto ausente o repetido en el albarán. Revisión necesaria.');const line=lines[0];
  let lot=parsed.lot||c.lot?.trim(),serial=parsed.serial||c.serial?.trim();
  const quantity=product.packCode===parsed.code?(product.packQuantity||'0'):p.quantity;
  if(new Decimal(quantity).lte(0))throw new DomainError('Embalaje sin conversión configurada.');
  if(r.tracking&&product.tracking==='lot'&&!lot)throw new DomainError('Este producto requiere lote. Escanea la etiqueta o introdúcelo.');
  if(r.tracking&&line.lot&&lot!==line.lot)throw new DomainError('Lote distinto: esperado '+line.lot+'. No se ha sumado.');
  if(r.tracking&&product.tracking==='serial'){
   if(!serial)throw new DomainError('Este producto requiere número de serie.');if(!new Decimal(quantity).eq(1))throw new DomainError('Una serie solo puede identificar una unidad.');
   if(s.scans.some(x=>x.receiptId===r.id&&!x.reversed&&x.serial===serial&&r.lines.find(l=>l.id===x.lineId)?.productId===product.id))throw new DomainError('Número de serie ya recibido. No se suma de nuevo.');
  }
  const next=new Decimal(line.received).plus(quantity);
  if(next.gt(line.expected)&&(!c.allowExcess||!c.reason?.trim()))throw new DomainError('Se supera la cantidad esperada. Revisa la lectura o registra el exceso con motivo.');
  if(!r.tracking){lot=undefined;serial=undefined;}
  line.received=next.toString();s.scans.push({id:commandId,receiptId:r.id,lineId:line.id,raw:c.raw,quantity,lot,serial,profileId:p.id,profileVersion:p.version,reversed:false,at:now});
  message=product.name+' · +'+quantity+' '+product.unit+(c.reason?' · '+c.reason:'');break;}
 case 'undo':{const r=openReceipt(c.receiptId);const scan=s.scans.findLast(x=>x.receiptId===r.id&&!x.reversed);if(!scan)throw new DomainError('No hay lecturas para deshacer.');const l=r.lines.find(x=>x.id===scan.lineId)!;l.received=new Decimal(l.received).minus(scan.quantity).toString();scan.reversed=true;message='Última lectura deshecha · '+r.reference;break;}
 case 'confirm':{const r=openReceipt(c.receiptId);const discrepancy=r.lines.some(l=>!new Decimal(l.expected).eq(l.received))||s.issues.some(i=>i.receiptId===r.id&&!i.resolved);if(discrepancy&&!c.reason?.trim())throw new DomainError('Indica el motivo para cerrar con diferencias.');r.status=discrepancy?'exceptions':'confirmed';r.closedAt=now;r.closeReason=c.reason;message=r.reference+' · recepción '+(discrepancy?'cerrada con diferencias':'confirmada');break;}
 case 'tracking':s.tracking=c.enabled;message='Seguimiento de lotes y series '+(c.enabled?'activado':'desactivado')+' para nuevas recepciones';break;
 case 'profile':{const current=s.profiles.find(p=>p.id===c.profile.id);const p:Profile={...c.profile,version:current?current.version+1:1,state:'draft'};s.profiles=s.profiles.filter(x=>x.id!==p.id);s.profiles.push(p);message='Perfil guardado. Pendiente de prueba · '+p.name;break;}
 case 'testProfile':{const p=s.profiles.find(x=>x.id===c.profileId);if(!p)throw new DomainError('Perfil inexistente.');const parsed=parseScan(c.raw,p);if(parsed.code!==c.expected)throw new DomainError('El código interpretado no coincide con el esperado.');p.testedVersion=p.version;p.testedCode=parsed.code;message='Prueba aislada correcta · '+p.name;break;}
 case 'activateProfile':{const p=s.profiles.find(x=>x.id===c.profileId);if(!p||p.testedVersion!==p.version)throw new DomainError('Realiza una prueba correcta de esta versión antes de activar.');p.state='validated';p.validatedDevice=c.device;message='Perfil validado por el usuario · '+p.name;break;}
 case 'createReceipt':{if(s.receipts.some(r=>r.supplier===c.supplier&&r.reference===c.reference))throw new DomainError('Ya existe este albarán para el proveedor.');if(c.lines.some(l=>!s.products.some(p=>p.id===l.productId)))throw new DomainError('Producto desconocido.');if(new Set(c.lines.map(l=>l.productId)).size!==c.lines.length)throw new DomainError('En este prototipo, agrupa cada producto en una sola línea.');s.receipts.unshift({id:commandId,supplier:c.supplier,reference:c.reference,date:c.date,status:'open',tracking:s.tracking,createdAt:now,fileIds:c.fileIds,lines:c.lines.map((l,i)=>({...l,id:commandId+'-'+i,received:'0'}))});message='Albarán registrado manualmente · '+c.reference;break;}
 case 'createInvoice':if(s.invoices.some(f=>f.reference===c.reference&&f.supplier===c.supplier))throw new DomainError('Factura ya registrada.');if(c.lines.some(l=>!s.products.some(p=>p.id===l.productId)))throw new DomainError('Producto desconocido.');s.invoices.push({...c,id:commandId,lines:c.lines.map((l,i)=>({...l,id:commandId+'-'+i}))});message='Factura registrada manualmente · '+c.reference;break;
 case 'issue':receipt(c.receiptId);s.issues.push({id:commandId,receiptId:c.receiptId,message:c.message,at:now,resolved:false});message='Incidencia registrada · '+c.message;break;
 case 'resolveIssue':{const i=s.issues.find(i=>i.id===c.issueId);if(!i)throw new DomainError('Incidencia no encontrada.');i.resolved=true;i.resolution=c.resolution;message='Incidencia resuelta · '+c.resolution;break;}
 }
 s.allocations=reconcile(s);s.audit.unshift({id:commandId,at:now,action:c.type,message});s.processed.push(commandId);s.version++;return s;
}
