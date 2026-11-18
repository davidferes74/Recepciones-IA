# 15 · Archivo en Google Drive

## Para el usuario
1. Configuración → Conexiones → **Google Drive** → Conectar.
2. Escribe el nombre de la carpeta, pulsa «Continuar con Google», elige la cuenta y pulsa Permitir.
3. La app crea la carpeta y, desde ese momento, guarda ahí cada documento que se registra.

La tarjeta muestra **Abrir carpeta**, que lleva a la carpeta en Drive. El mismo enlace aparece en «Documentos originales» de cada recepción.

## Qué se guarda y cómo se llama
Decidido por el propietario (18/11/2026): la app crea la carpeta; subcarpetas por año y mes; se guarda todo lo escaneado; nombre con la fecha primero.

```
Recepciones-IA/
  2026/
    11 noviembre/
      2026-11-17 · Distribuciones Atlántico · Albarán ALB-2026-0148 · Pedido P00412.pdf
      2026-11-17 · Distribuciones Atlántico · Factura F-2026-0312.pdf
      2026-11-17 · Distribuciones Atlántico · Etiqueta lote L261115 · ALB-2026-0148.jpg
```
- La fecha es la del albarán o la factura. Varias hojas del mismo documento llevan «hoja 1», «hoja 2».
- Se quitan los caracteres que no valen en nombres de archivo. Reglas en lib/drive-names.ts (función pura, con pruebas).
- Se archiva un documento cuando ya pertenece a un albarán, una factura o una lectura con etiqueta: de ahí sale su nombre. Un adjunto de correo aún sin registrar no se sube.

## Cuándo se sube
- Al registrar un albarán o una factura, o una lectura con foto de etiqueta: después de responder al usuario (`after`), para no frenar el escaneo.
- En la revisión diaria programada, como reintento de lo que hubiera fallado.
- Con «Guardar ahora lo pendiente» en la ventana de Google Drive.
Cada documento se reserva antes de subirlo para no duplicarlo; si falla queda marcado y se reintenta. El original sigue además en la base de datos de la app.

## Permisos y seguridad
- Permiso `drive.file`: la app solo ve y modifica la carpeta y los archivos que ella misma crea. No accede al resto del Drive.
- La autorización se guarda cifrada (`ria_integrations`, `TOKEN_ENCRYPTION_KEY`). Desconectar borra la autorización; la carpeta y sus archivos se quedan en Drive.
- Si se borra la subcarpeta de un mes, se vuelve a crear. Si se borra la carpeta principal, la tarjeta avisa y hay que conectar de nuevo para crear otra.

## Preparación única (quien administra la app, no el usuario)
En el proyecto de Google Cloud que ya se usa para Gmail:
1. Activar **Google Drive API**.
2. En la pantalla de consentimiento de OAuth, añadir el permiso `.../auth/drive.file`.
3. Si la pantalla de consentimiento está en modo «Pruebas», añadir como usuario de prueba la cuenta de Google que se vaya a conectar.
No hace falta registrar otra dirección de retorno: se reutiliza la de Gmail (`/api/mail/google/callback`).

## Límites
- Sin probar con una cuenta real de Google.
- No se puede elegir una carpeta ya existente ni una unidad compartida: la crea la app en «Mi unidad» de la cuenta que autoriza.
- Renombrar un albarán o una factura después de guardarlo no cambia el nombre del archivo en Drive.
- Migración aditiva 008.
