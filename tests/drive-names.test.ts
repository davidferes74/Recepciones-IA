import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {archivePlan,fileName,safePart,extensionFor,monthFolders} from '../lib/drive-names';
import {seedWorkspace} from '../lib/seed';
const A=randomUUID(),B=randomUUID(),C=randomUUID(),D=randomUUID(),E=randomUUID();
function state(){const s=seedWorkspace();
 s.receipts[0].fileIds=[A];s.receipts[0].order={id:1,name:'P00412'};        // ALB-2026-0148, 2026-11-15
 s.receipts[1].fileIds=[B,C];                                               // ALB-2026-0147, dos hojas
 s.invoices[0].fileIds=[D];                                                 // F-2026-0312
 s.scans=[{id:'s1',receiptId:'r1',lineId:'l1',raw:'x',quantity:'1',lot:'L261115',reversed:false,evidenceId:E,at:'2026-11-15T09:00:00Z'}];return s;}
test('files are named date first, with supplier, document and order, as chosen by the owner',()=>{
 const plan=archivePlan(state());
 assert.deepEqual(plan.map(p=>p.name),[
  '2026-11-15 · Distribuciones Atlántico · Albarán ALB-2026-0148 · Pedido P00412',
  '2026-11-14 · Distribuciones Atlántico · Albarán ALB-2026-0147 · hoja 1',
  '2026-11-14 · Distribuciones Atlántico · Albarán ALB-2026-0147 · hoja 2',
  '2026-11-15 · Distribuciones Atlántico · Factura F-2026-0312',
  '2026-11-15 · Distribuciones Atlántico · Etiqueta lote L261115 · ALB-2026-0148']);
 assert.deepEqual(plan.map(p=>p.kind),['receipt','receipt','receipt','invoice','label']);assert.deepEqual(plan.map(p=>p.documentId),[A,B,C,D,E]);});
test('each document is archived once, reversed readings and local demo files are left out',()=>{
 const s=state();s.invoices[0].fileIds=[A,D];                                // el mismo archivo ya está en el albarán
 s.scans.push({...s.scans[0],id:'s2',evidenceId:randomUUID(),reversed:true});s.scans.push({...s.scans[0],id:'s3',evidenceId:E});
 s.receipts[2].fileIds=['archivo-local-demo',''];
 const ids=archivePlan(s).map(p=>p.documentId);assert.deepEqual(ids,[A,B,C,D,E]);assert.equal(new Set(ids).size,ids.length);});
test('serial labels and labels without a code get a clear name',()=>{
 const s=state();s.scans=[{...s.scans[0],lot:undefined,serial:'SN-0042'},{...s.scans[0],id:'s9',lot:undefined,serial:undefined,evidenceId:randomUUID()}];
 assert.deepEqual(archivePlan(s).filter(p=>p.kind==='label').map(p=>p.name.split(' · ')[2]),['Etiqueta serie SN-0042','Etiqueta sin código']);});
test('names are safe for Drive, Windows and macOS and never too long',()=>{
 assert.equal(safePart('  A/B\\C: "D" <E>|F?*  '),'A B C D E F');assert.equal(safePart('..oculto. '),'oculto');assert.equal(safePart('Línea\nnueva\ty tab'),'Línea nueva y tab');
 assert.equal(fileName(['2026-11-17','Proveedor / Raro','Factura F:1',undefined,false,'']),'2026-11-17 · Proveedor Raro · Factura F 1');
 assert.ok(fileName(['2026-11-17','x'.repeat(300),'y'.repeat(300),'z'.repeat(300)]).length<=200);
 const s=state();s.receipts[0].supplier='Ac/me: "Sur" S.L.';assert.equal(archivePlan(s)[0].name,'2026-11-15 · Ac me Sur S.L · Albarán ALB-2026-0148 · Pedido P00412');});
test('extension comes from the real file type; folders are year and month in Spanish',()=>{
 assert.deepEqual(['application/pdf','image/jpeg','image/png','image/webp','text/html'].map(extensionFor),['pdf','jpg','png','webp','bin']);
 assert.deepEqual(monthFolders('2026-11-17'),{year:'2026',month:'11 noviembre',key:'2026-11'});assert.deepEqual(monthFolders('2027-01-02'),{year:'2027',month:'01 enero',key:'2027-01'});
 assert.equal(monthFolders('fecha rara').key,'sin-fecha');assert.equal(monthFolders('2026-13-01').key,'sin-fecha');});
