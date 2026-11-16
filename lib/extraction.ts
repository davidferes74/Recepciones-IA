import {z} from 'zod';
const text=z.string().max(500);
const number=z.string().regex(/^\d+(\.\d+)?$/).nullable();
export const extractionSchema=z.object({supplier:text.nullable(),reference:text.nullable(),date:z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable(),receiptRefs:z.array(text).max(100),warnings:z.array(text).max(30),lines:z.array(z.object({description:text,code:text.nullable(),quantity:number,unit:text.nullable(),lot:text.nullable(),price:number,page:z.number().int().min(1).max(10),evidence:text})).min(1).max(100)});
export type Extraction=z.infer<typeof extractionSchema>;
// Simple JSON schema for constrained decoding; stricter bounds enforced by Zod after completion.
const nullable={type:['string','null']};
export const outputSchema={type:'object',additionalProperties:false,properties:{supplier:nullable,reference:nullable,date:nullable,receiptRefs:{type:'array',items:{type:'string'}},warnings:{type:'array',items:{type:'string'}},lines:{type:'array',items:{type:'object',additionalProperties:false,properties:{description:{type:'string'},code:nullable,quantity:nullable,unit:nullable,lot:nullable,price:nullable,page:{type:'integer'},evidence:{type:'string'}},required:['description','code','quantity','unit','lot','price','page','evidence']}}},required:['supplier','reference','date','receiptRefs','warnings','lines']};
export function detectType(b:Buffer){if(b.subarray(0,5).toString()==='%PDF-')return 'application/pdf';if(b[0]===255&&b[1]===216&&b[2]===255)return 'image/jpeg';if(b.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])))return 'image/png';if(b.subarray(0,4).toString()==='RIFF'&&b.subarray(8,12).toString()==='WEBP')return 'image/webp';throw new Error('Formato no admitido. Usa JPG, PNG, WebP o PDF.');}
