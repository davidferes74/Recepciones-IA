# Estado · 16/11/2026

## Implementado: prototipo H1, pendiente de validación visual y despliegue

- Next.js/React/TypeScript, interfaz española móvil/tablet/escritorio.
- Recepciones manuales, catálogo, cantidades físicas, incidencias, cierre motivado e histórico.
- Perfiles de lector con pruebas aisladas, activación y versionado; parsers simple, delimitado y subconjunto GS1 (01/10/17/21).
- Lotes y series opcionales; conversión de caja/unidad; deshacer y auditoría.
- Conciliación decimal por referencia explícita/proveedor/producto, varias recepciones por factura, parcial y sin doble consumo.
- Demo sintética persistida en IndexedDB. Fotos/PDF de demo quedan exclusivamente en este navegador, no en Drive ni Neon.
- API privada PostgreSQL, bloqueo transaccional de espacio, versión e idempotencia. Migración incluida.
- Sesión de administrador único para piloto; no equivale a roles multiusuario ni producto terminado.

## Verificación

- 29 pruebas de dominio aprobadas al retomar; añadida prueba de sesión malformada y firma manipulada.
- Build previamente aprobado; nueva ejecución registrada durante entrega.
- E2E visual no ejecutado: Chromium aborta porque el entorno rechaza socket() (Operation not permitted). No se ha certificado PDA, cámara ni navegador físico.
- Vercel: proyecto y Neon aportados por capturas del usuario. El conector sigue devolviendo 404 al consultar recepciones-ia en sentidino. No afirmar conexión real Neon hasta prueba autenticada.

## Decisiones provisionales

PostgreSQL guarda el agregado de trabajo en JSONB y un registro de comandos, con bloqueo por organización. Adecuado para validar el flujo inicial; pendiente normalización, outbox y pruebas concurrentes reales antes de producción.
Acceso mediante contraseña de piloto y cookie firmada de 8 horas; pendiente proveedor de identidad, roles, limitación distribuida de intentos y recuperación. Usar solo con datos sintéticos hasta completar seguridad y pruebas.
Sin DATABASE_URL o credenciales de acceso completas se muestra demo explícita. No hay fallback silencioso de datos privados a demo.

## Pendiente

OCR/IA, aprendizaje de plantillas, fotografía de etiquetas con extracción, Gmail/Dinahosting, Drive, cola durable, permisos multiusuario, devoluciones/correcciones, adjuntos de servidor y compatibilidad de cámara ampliada. No se realizan movimientos en ERP ni pagos.
La cámara inicial usa BarcodeDetector si existe y requiere confirmación; otros navegadores necesitan lector físico o entrada manual.
No se comparan precios: siempre revisión de Administración. La conciliación H1 compara cantidades; no verifica lotes/series contra facturas sin evidencia.

## Siguiente paso

Publicar y verificar build Vercel; configurar acceso privado en variables de servidor sin compartir secretos por chat. Probar flujo completo con navegador habilitado y Neon; después conectar OCR y archivo con muestras y credenciales autorizadas.

## Despliegue comprobado · 16/11/2026

Commit de aplicación 32eb5bbb4be148ced06a8dede09185f0e9481547 publicado en main. GitHub registra Vercel success. https://recepciones-ia.vercel.app devuelve HTTP 200; /api/health devuelve status ok, version 0.1.0; /api/workspace sin sesión devuelve 401. La página declara databaseConfigured=true y serverConfigured=false: DATABASE_URL está presente, pero falta completar APP_ACCESS_PASSWORD y/o SESSION_SECRET válido. No se ha probado aún lectura/escritura autenticada en Neon. La demo puede usarse con datos sintéticos. Bloqueo siguiente: configuración segura de acceso del piloto y habilitar acceso del conector al proyecto Vercel.
