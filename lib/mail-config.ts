import {z} from 'zod';
import {createCipheriv,createDecipheriv,randomBytes} from 'node:crypto';
import {isIP,BlockList} from 'node:net';
export const mailConfigSchema=z.object({name:z.string().trim().min(1).max(100),email:z.email().max(254),host:z.string().trim().toLowerCase().max(253).regex(/^[a-z0-9](?:[a-z0-9.-]*[a-z0-9])?$/),username:z.string().trim().min(1).max(254),password:z.string().min(1).max(1024),folder:z.string().min(1).max(200).default('INBOX'),since:z.iso.date(),sender:z.string().trim().max(254).default(''),subject:z.string().trim().max(150).default('')});
export type MailConfig=z.infer<typeof mailConfigSchema>;
export function encryptionReady(){return /^[a-f0-9]{64}$/i.test(process.env.TOKEN_ENCRYPTION_KEY||'');}
function key(){if(!encryptionReady())throw Error('Configura TOKEN_ENCRYPTION_KEY: 64 caracteres hexadecimales aleatorios.');return Buffer.from(process.env.TOKEN_ENCRYPTION_KEY!,'hex');}
export function seal(value:string,organization:string){const iv=randomBytes(12);const cipher=createCipheriv('aes-256-gcm',key(),iv);cipher.setAAD(Buffer.from(organization));const bytes=Buffer.concat([cipher.update(value,'utf8'),cipher.final()]);return [iv,cipher.getAuthTag(),bytes].map(b=>b.toString('base64')).join('.');}
export function unseal(value:string,organization:string){const [iv,tag,bytes]=value.split('.').map(s=>Buffer.from(s,'base64'));const cipher=createDecipheriv('aes-256-gcm',key(),iv);cipher.setAAD(Buffer.from(organization));cipher.setAuthTag(tag);return Buffer.concat([cipher.update(bytes),cipher.final()]).toString('utf8');}
export function allowedHost(host:string){const extra=(process.env.MAIL_IMAP_ALLOWED_HOSTS||'').split(',').map(s=>s.trim().toLowerCase()).filter(Boolean);return !isIP(host)&&(host.endsWith('.dinaserver.com')||extra.includes(host));}
const blocked=new BlockList();for(const [ip,mask] of [['0.0.0.0',8],['10.0.0.0',8],['100.64.0.0',10],['127.0.0.0',8],['169.254.0.0',16],['172.16.0.0',12],['192.0.0.0',24],['192.0.2.0',24],['192.168.0.0',16],['198.18.0.0',15],['198.51.100.0',24],['203.0.113.0',24],['224.0.0.0',4],['240.0.0.0',4]] as const)blocked.addSubnet(ip,mask,'ipv4');
export function publicIPv4(ip:string){return isIP(ip)===4&&!blocked.check(ip,'ipv4');}
