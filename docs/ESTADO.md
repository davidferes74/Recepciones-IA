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

- 30 pruebas aprobadas: 29 de dominio y una de sesión malformada/firma manipulada.
- Compilación de producción aprobada el 16/11/2026.
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
