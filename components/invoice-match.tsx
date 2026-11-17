'use client';
import Decimal from 'decimal.js';
import {FileText,CheckCircle2,AlertTriangle,Clock3,HelpCircle,Package,ArrowRight} from 'lucide-react';
import type {Invoice,Workspace} from '@/lib/types';
import {invoiceSummary} from '@/lib/domain';
import {Badge,date,quantity} from './ui';
// Vista de emparejamiento factura ↔ recepciones. Solo presenta las asignaciones ya calculadas por
// reconcile(); no recalcula ni decide nada.
const percent=(part:string|Decimal,total:string|Decimal)=>{const t=new Decimal(total);return t.lte(0)?0:Decimal.min(100,new Decimal(part).div(t).times(100)).toNumber();};
// Colores por albarán: se evita el ámbar, reservado para «sin respaldo».
const TONES=[1,5,7,2,6,4];const tone=(i:number)=>`var(--series-${TONES[i%TONES.length]})`;
type RefState={ref:string;kind:'confirmed'|'open'|'missing'|'ambiguous';receiptId?:string;tone:number};
export function referenceStates(state:Workspace,f:Invoice):RefState[]{
 return [...new Set(f.receiptRefs)].map((ref,i)=>{const matches=state.receipts.filter(r=>r.reference===ref&&r.supplier===f.supplier);
  if(matches.length>1)return {ref,kind:'ambiguous' as const,tone:i};if(!matches.length)return {ref,kind:'missing' as const,tone:i};
  return {ref,kind:matches[0].status==='open'?'open' as const:'confirmed' as const,receiptId:matches[0].id,tone:i};});
}
const refLabel={confirmed:'Recepción confirmada',open:'Pendiente de confirmar llegada',missing:'Albarán no registrado',ambiguous:'Referencia ambigua'};
export function CoverageBar({matched,total,compact}:{matched:string;total:string;compact?:boolean}){
 const p=percent(matched,total),complete=new Decimal(matched).gte(total)&&new Decimal(total).gt(0);
 return <div className={'coverage'+(compact?' compact':'')}><div className="coverage-track" role="img" aria-label={`${quantity(matched)} de ${quantity(total)} unidades respaldadas`}><div className={'coverage-fill '+(complete?'ok':'partial')} style={{width:p+'%'}}/></div><span className={'coverage-value '+(complete?'ok':'partial')}>{Math.floor(p)}%</span></div>;
}
export function InvoiceDetail({invoice:f,state,onBack}:{invoice:Invoice;state:Workspace;onBack:()=>void}){
 const summary=invoiceSummary(state,f),refs=referenceStates(state,f),toneOf=(receiptId:string)=>refs.find(r=>r.receiptId===receiptId)?.tone??0;
 return <><button className="back-link" onClick={onBack}>← Todas las facturas</button>
 <section className="panel"><div className="panel-heading"><FileText size={20}/><h2>{f.reference}</h2><Badge kind={summary.complete?'success':'warning'}>{summary.complete?'Cantidades respaldadas':'Conciliación parcial'}</Badge></div>
 <div className="match-body">
  <p className="muted">{f.supplier} · {date(f.date)}</p>
  <div className="match-summary">
   <div className="match-tile"><span>Facturado</span><strong>{quantity(summary.total)}</strong><small>unidades</small></div>
   <div className="match-tile ok"><span>Respaldado</span><strong>{quantity(summary.matched)}</strong><small>por recepciones confirmadas</small></div>
   <div className={'match-tile '+(summary.complete?'':'warn')}><span>Sin respaldo</span><strong>{quantity(summary.pending)}</strong><small>{summary.complete?'nada pendiente':'pendiente de recepción o revisión'}</small></div>
  </div>
  <CoverageBar matched={summary.matched} total={summary.total}/>
  <h3 className="match-heading">Albaranes indicados en la factura</h3>
  <div className="match-refs">{refs.map(r=><span className={'match-ref '+r.kind} key={r.ref}><i className="match-dot" style={{background:tone(r.tone)}}/><span><strong>{r.ref}</strong><small>{refLabel[r.kind]}</small></span>{r.kind==='confirmed'?<CheckCircle2 size={16}/>:r.kind==='open'?<Clock3 size={16}/>:<HelpCircle size={16}/>}</span>)}{!refs.length&&<p className="muted">Ninguna referencia: requiere revisión manual.</p>}</div>
  <h3 className="match-heading">Emparejamiento por línea</h3>
  {f.lines.map(l=>{const p=state.products.find(p=>p.id===l.productId);const assignments=state.allocations.filter(a=>a.invoiceId===f.id&&a.invoiceLineId===l.id);const matched=assignments.reduce((a,x)=>a.plus(x.quantity),new Decimal(0));const rest=Decimal.max(0,new Decimal(l.quantity).minus(matched));const ok=rest.eq(0);
   return <div className={'match-line '+(ok?'ok':'warn')} key={l.id}>
    <div className="match-line-head"><span className="match-line-icon">{ok?<CheckCircle2 size={18}/>:<AlertTriangle size={18}/>}</span><div><strong>{p?.name||'Producto no encontrado'}</strong><small>{p?.sku}</small></div><span className="match-line-qty"><strong>{quantity(matched.toString())}</strong> / {quantity(l.quantity)} ud</span></div>
    <div className="match-bar" role="img" aria-label={`${quantity(matched.toString())} de ${quantity(l.quantity)} unidades respaldadas`}>{assignments.map(a=><div key={a.receiptId+a.lineId} className="match-seg" style={{width:percent(a.quantity,l.quantity)+'%',background:tone(toneOf(a.receiptId))}}/>)}{!ok&&<div className="match-seg rest" style={{width:percent(rest,l.quantity)+'%'}}/>}</div>
    <div className="match-chips">{assignments.map(a=><span className="match-chip" key={a.receiptId+a.lineId}><i className="match-dot" style={{background:tone(toneOf(a.receiptId))}}/><Package size={13}/>{state.receipts.find(r=>r.id===a.receiptId)?.reference}<b>{quantity(a.quantity)} ud</b></span>)}{!ok&&<span className="match-chip rest"><AlertTriangle size={13}/>Sin respaldo<b>{quantity(rest.toString())} ud</b></span>}</div>
   </div>;})}
  <div className="match-controls"><span className={'match-control'+(summary.complete?'':' pending')}>{summary.complete?<CheckCircle2 size={16}/>:<AlertTriangle size={16}/>}<span><strong>Cantidades</strong><small>{summary.complete?'Respaldadas por recepciones confirmadas':'Parcialmente respaldadas'}</small></span></span><span className="match-control pending"><HelpCircle size={16}/><span><strong>Precio no comprobado</strong><small>Revisión de Administración</small></span></span></div>
 </div></section></>;
}
export function InvoiceCard({invoice:f,state,onOpen}:{invoice:Invoice;state:Workspace;onOpen:()=>void}){
 const summary=invoiceSummary(state,f),refs=referenceStates(state,f);
 return <button className="panel invoice-card" onClick={onOpen}><div className="spread"><span className="quick-icon blue"><FileText size={23}/></span><Badge kind={summary.complete?'success':'warning'}>{summary.complete?'Cantidades respaldadas':'Conciliación parcial'}</Badge></div><h2>{f.reference}</h2><p>{f.supplier}</p>
  <div className="invoice-match"><div className="spread"><span>Unidades respaldadas</span><strong>{quantity(summary.matched)} <small>/ {quantity(summary.total)}</small></strong></div><CoverageBar matched={summary.matched} total={summary.total} compact/></div>
  <div className="match-refs mini">{refs.map(r=><span className={'match-ref '+r.kind} key={r.ref} title={refLabel[r.kind]}><i className="match-dot" style={{background:tone(r.tone)}}/><strong>{r.ref}</strong>{r.kind==='confirmed'?<CheckCircle2 size={14}/>:r.kind==='open'?<Clock3 size={14}/>:<HelpCircle size={14}/>}</span>)}{!refs.length&&<span className="muted">Sin albaranes indicados</span>}</div>
  <div className="invoice-footer"><span>Precio no comprobado</span><span>Ver emparejamiento <ArrowRight size={16}/></span></div></button>;
}
