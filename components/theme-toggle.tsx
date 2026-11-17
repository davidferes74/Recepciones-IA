'use client';
import {useEffect,useState} from 'react';
import {Moon,Sun} from 'lucide-react';
// Alterna claro/oscuro. Claro por defecto; la elección se guarda en este navegador («ria-theme»).
export function ThemeToggle(){
 const [theme,setTheme]=useState<'light'|'dark'|null>(null);
 useEffect(()=>{setTheme(document.documentElement.getAttribute('data-theme')==='dark'?'dark':'light');},[]);
 function toggle(){
  const next=theme==='dark'?'light':'dark',root=document.documentElement;
  root.setAttribute('data-theme-transition','');root.setAttribute('data-theme',next);
  try{localStorage.setItem('ria-theme',next);}catch{/* sin almacenamiento */}
  setTheme(next);setTimeout(()=>root.removeAttribute('data-theme-transition'),300);
 }
 return <button type="button" className="icon-button" onClick={toggle} aria-label={theme==='dark'?'Cambiar a tema claro':'Cambiar a tema oscuro'} title={theme==='dark'?'Tema claro':'Tema oscuro'}>{theme==='dark'?<Sun size={17}/>:<Moon size={17}/>}</button>;
}
