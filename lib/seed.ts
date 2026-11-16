import type {Workspace} from './types';
import {baseProfile} from './scanner';
export function seedWorkspace():Workspace {
 return {version:0,organization:'Sentidiño · entorno de prueba',tracking:false,
 products:[
 {id:'p1',name:'Arroz redondo · 1 kg',sku:'ARR-001',code:'8412345678905',unit:'ud',tracking:'lot',packCode:'CAJA-ARROZ',packQuantity:'12'},
 {id:'p2',name:'Aceite de oliva · 1 l',sku:'ACE-001',code:'8423456789015',unit:'ud',tracking:'none'},
 {id:'p3',name:'Balanza de sobremesa',sku:'BAL-001',code:'BALANZA-001',unit:'ud',tracking:'serial'}],
 receipts:[
 {id:'r1',supplier:'Distribuciones Atlántico',reference:'ALB-2026-0148',date:'2026-11-15',status:'open',tracking:false,createdAt:'2026-11-15T08:00:00Z',fileIds:[],lines:[{id:'l1',productId:'p1',expected:'12',received:'0',lot:'L261115'},{id:'l2',productId:'p2',expected:'6',received:'0'}]},
 {id:'r2',supplier:'Distribuciones Atlántico',reference:'ALB-2026-0147',date:'2026-11-14',status:'confirmed',tracking:false,createdAt:'2026-11-14T08:00:00Z',closedAt:'2026-11-14T10:00:00Z',fileIds:[],lines:[{id:'l3',productId:'p1',expected:'8',received:'8'}]},
 {id:'r3',supplier:'Equipamiento Norte',reference:'ALB-2026-0082',date:'2026-11-15',status:'open',tracking:false,createdAt:'2026-11-15T09:00:00Z',fileIds:[],lines:[{id:'l4',productId:'p3',expected:'2',received:'0'}]}
 ], invoices:[{id:'f1',supplier:'Distribuciones Atlántico',reference:'F-2026-0312',date:'2026-11-15',receiptRefs:['ALB-2026-0147','ALB-2026-0148'],lines:[{id:'fl1',productId:'p1',quantity:'20',price:'1.25'},{id:'fl2',productId:'p2',quantity:'6',price:'5.90'}]}],
 scans:[],profiles:[structuredClone(baseProfile)],allocations:[],audit:[],issues:[],processed:[]};
}
export function emptyWorkspace():Workspace{const s=seedWorkspace();s.organization='Recepciones-IA';s.receipts=[];s.invoices=[];s.products=[];return s;}
