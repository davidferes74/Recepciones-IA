import {NextRequest,NextResponse} from 'next/server';
import {createHash,timingSafeEqual} from 'node:crypto';
import {captureGmail} from '@/lib/mail-gmail';
import {captureMailbox} from '@/lib/mail-imap';
import {getPool,org} from '@/lib/server-store';
export const runtime='nodejs';export const maxDuration=60;
export async function POST(req:NextRequest){const expected=process.env.JOB_TRIGGER_SECRET;const supplied=req.headers.get('authorization')||'';if(!expected||expected.length<32||!timingSafeEqual(createHash('sha256').update(supplied).digest(),createHash('sha256').update('Bearer '+expected).digest()))return NextResponse.json({error:'No autorizado.'},{status:401});const r=await getPool().query('SELECT id,provider FROM ria_mail_accounts WHERE organization_id=$1 AND paused=false AND (lease_until IS NULL OR lease_until<now()) ORDER BY last_sync ASC NULLS FIRST LIMIT 1',[org()]);if(!r.rowCount)return NextResponse.json({processed:0});try{return NextResponse.json(await (r.rows[0].provider==='gmail'?captureGmail(r.rows[0].id):captureMailbox(r.rows[0].id)));}catch{return NextResponse.json({error:'Captura incompleta; revisar cuenta.'},{status:502});}}
