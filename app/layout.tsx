import type {Metadata,Viewport} from 'next';
import './sentidino-fonts.css';
import './sentidino-foundation.css';
import './globals.css';
export const metadata:Metadata={title:'Recepciones-IA · Control de entradas',description:'Recepción de mercancía y conciliación documental',robots:{index:false,follow:false}};
export const viewport:Viewport={width:'device-width',initialScale:1,viewportFit:'cover',themeColor:[{media:'(prefers-color-scheme: light)',color:'#f4f6f9'},{media:'(prefers-color-scheme: dark)',color:'#101317'}]};
// Tema inicial antes del primer pintado (sin parpadeo): preferencia guardada o la del sistema. Misma clave que Sentidiño BI.
const themeInit=`(function(){try{var t=localStorage.getItem("sbi-theme")||(matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light");document.documentElement.setAttribute("data-theme",t);}catch(e){document.documentElement.setAttribute("data-theme","light");}})();`;
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="es" suppressHydrationWarning><head><script dangerouslySetInnerHTML={{__html:themeInit}}/></head><body>{children}</body></html>;}
