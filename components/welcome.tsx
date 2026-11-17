'use client';
import {useEffect,useRef,useState} from 'react';
import {LogIn} from 'lucide-react';
// Pantalla de entrada: vídeo de fondo a pantalla completa y botón «Entrar» en el centro.
// Si el vídeo no carga, o el usuario pide reducir movimiento o ahorrar datos, queda el fondo de marca.
const VIDEO='https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260702_051048_5ef213b5-26db-4da8-b604-7ef823760b6b.mp4';
export const introKey='ria-intro-vista';
export default function Welcome({showButton,onEnter}:{showButton:boolean;onEnter:()=>void}){
 const [play,setPlay]=useState(false),[failed,setFailed]=useState(false),button=useRef<HTMLButtonElement>(null);
 useEffect(()=>{const reduce=window.matchMedia('(prefers-reduced-motion: reduce)').matches,saveData=(navigator as unknown as {connection?:{saveData?:boolean}}).connection?.saveData;setPlay(!reduce&&!saveData);},[]);
 useEffect(()=>{if(showButton)button.current?.focus();},[showButton]);
 return <section className={'welcome'+(showButton?'':' needs-login')} aria-label="Bienvenida a Recepciones-IA">
  {play&&!failed&&<video className="welcome-video" src={VIDEO} autoPlay muted loop playsInline preload="auto" aria-hidden="true" onError={()=>setFailed(true)}/>}
  <div className="welcome-shade"/>
  {showButton&&<div className="welcome-content">
   <div className="welcome-brand"><svg viewBox="0 0 28 28" width="34" height="34" aria-hidden="true"><path d="M2 18c4-6 8-6 12 0s8 6 12 0" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"/><path d="M2 11c4-6 8-6 12 0s8 6 12 0" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" opacity="0.45"/></svg><span>Recepciones<b>IA</b></span></div>
   <button ref={button} type="button" className="button primary welcome-enter" onClick={onEnter}><LogIn size={19}/>Entrar</button>
   <small>por Sentidiño</small>
  </div>}
 </section>;
}
