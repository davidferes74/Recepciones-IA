# Correo — primer incremento IMAP

## Implementado
Configuración → Correo de facturas. Alta/edición de cuenta Dinahosting/IMAP: nombre, dirección, usuario, contraseña, host seguro, carpeta, fecha inicial y filtros opcionales de remitente/asunto (contiene, no lista de remitentes verificados). TLS 993 obligatorio. Prueba de autenticación y carpeta, lista de carpetas, muestra de 10 correos sin consumir IA. Guardar vuelve a probar y deja la cuenta pausada.

Habilitar captura y Comprobar ahora: hasta 10 correos pendientes por ejecución. Originales admitidos privados en PostgreSQL; exclusiones visibles, no sigue enlaces ni renderiza HTML. PDF/JPG/PNG/WebP hasta 3 MB; correo hasta 6 MB. Inline excluido con aviso. No todas las piezas capturadas son facturas: usuario revisa. Captura no consume IA.

UID + UIDVALIDITY + carpeta + índice para idempotencia, SHA256 por organización para archivos reenviados. Cursor y adjuntos se guardan por correo en una transacción. Lease de 2 minutos, token de propietario, cursor incremental y transacciones para recuperar interrupciones sin pérdida. Apertura IMAP readOnly; no marca leído, mueve ni borra mensajes. Contraseñas AES-256-GCM con AAD de organización, sin logs del cliente IMAP. DNS IPv4 público fijado, allowlist de hosts, validación TLS, límites de respuesta y plazo de conexión.

Bandeja últimos 100 registros, descarga autenticada, Leer y revisar factura abre formulario existente con el adjunto. Leer con Claude mantiene límites actuales (10 intentos/día); revisión/asignación humana antes de guardar. El comando de factura dispara la conciliación existente. Registro de factura se comprueba en servidor junto al original. No nueva confirmación física ni autoaceptación de coincidencias.

## Configuración necesaria
- TOKEN_ENCRYPTION_KEY: 32 bytes aleatorios codificados en 64 caracteres hexadecimales. Generar con `openssl rand -hex 32` o `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` en un terminal privado. Guardar únicamente en Vercel Production; redeploy. Mantener estable y respaldar: cambiarla sin migrar secretos obliga a reintroducir credenciales.
- Hosts Dinahosting terminados en .dinaserver.com permitidos; otros requieren MAIL_IMAP_ALLOWED_HOSTS (lista separada por comas de hosts exactos). No URLs, IPs privadas ni TLS sin verificar. Solo IPv4 en esta fase.
- Migración 003 automática al desplegar; conserva workspace/documentos existentes.
- JOB_TRIGGER_SECRET opcional, mínimo 32 caracteres aleatorios: protege POST /api/mail/jobs mediante Authorization Bearer. Ejecuta una cuenta habilitada por llamada; no instala un programador. Necesita configurar servicio externo/frecuencia. UI indica automático pendiente. No modificar vercel.json con un cron incompatible con Hobby.

## Límites y próximos pasos
Gmail OAuth, notificaciones Google, programador automático, extracción IA automática/cola durable, abonos como entidad propia, descarte con motivo, archivado Drive, retención, paginación avanzada y permisos multiusuario pendientes. Piloto administrador único. Cambiar credenciales/config requiere contraseña nuevamente y prueba; edición durante captura se rechaza. Pausar no elimina documentos ni secretos. Desconexión/borrado de credenciales por usuario pendiente.
No prometer operación real sin test del buzón. No se utilizó la conexión Gmail de ChatGPT para configurar la app. No envíos de correo.

## Verificación
43 tests (incluye autenticación de cifrado, aislamiento por organización, clave ausente, host spoofing/red privada y esquema). Build y TypeScript completos. Prueba real IMAP, concurrencia en PostgreSQL y navegador/PDA pendientes; no hay credenciales de buzón disponibles. Chromium del entorno no permite ejecutar pruebas de UI.
Referencias: https://imapflow.com/docs/api/imapflow-client/ y https://nodemailer.com/extras/mailparser. Versiones fijadas en lockfile.
