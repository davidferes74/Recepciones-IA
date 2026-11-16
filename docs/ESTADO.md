# Estado · 16/11/2026

## Implementado y desplegado

Prototipo H1: interfaz móvil en español, catálogo, recepciones manuales, perfiles de lector y banco de pruebas, lotes/series opcionales, incidencias, histórico y conciliación decimal por referencias explícitas. Demo IndexedDB separada del espacio privado PostgreSQL.

Acceso privado con usuario y contraseña de piloto. Se ha verificado login, lectura autenticada de Neon y cierre de sesión en producción.

Lectura asistida Claude añadida: fotos JPG/PNG/WebP y PDF, salida validada, revisión y selección manual de productos, originales privados en Neon. Ver [09-claude.md](09-claude.md) para límites y decisiones. No crea ni confirma recepciones automáticamente.

## Pruebas y evidencia

- 32 pruebas automatizadas aprobadas y build de producción correcto.
- Despliegue de integración 8685c756918ad43735f3f6b6c9094c81a060d0e2 servido por Vercel.
- API autenticada confirma ANTHROPIC_API_KEY configurada, modelo claude-haiku-5-5.
- Prueba real con PDF sintético TEST-CLAUDE-001: proveedor, referencia, fecha, producto, cantidad 12 y lote extraídos; precio ausente conservado como null. HTTP 200.
- Escritura/lectura del original en Neon comprobada: bytes descargados idénticos al PDF enviado.
- Repetición del mismo documento: HTTP 200, cached=true; no nueva llamada al modelo.
- La prueba creó un registro documental sintético, no producto, albarán comercial ni recepción física.
- No se han probado documentos reales, cámara/PDA física, exactitud por campo a escala ni flujo visual completo. Chromium local no arranca por restricción de sockets del entorno.

## Decisiones provisionales y limitaciones

PostgreSQL guarda el agregado de trabajo en JSONB con versión y bloqueo por organización. Documentos de piloto en tabla separada; Drive pendiente. Sesión de un administrador, pendiente roles multiusuario, protección distribuida de login, retención, restauración y pruebas de concurrencia reales.

Límite de piloto IA: 10 intentos diarios, 3 MB, 10 páginas PDF, 6000 tokens de salida; sin escalado automático caro. Cachear documento idéntico no equivale a aprender diseños.

## Pendiente

Aprendizaje de plantillas, extracción de etiquetas de lotes/series, correo Gmail/Dinahosting, Drive, procesamiento durable, devoluciones/correcciones y compatibilidad de cámara ampliada. No se realizan movimientos ERP ni pagos. Precios siguen pendientes de Administración; la conciliación automática de H1 respalda cantidades y no certifica lotes de factura.

## Siguiente paso

Validar fotos y PDFs representativos, corregir UI con navegador habilitado, verificar recepción completa con catálogo real y PDA, conectar archivo Drive y buzón autorizado. Mantener revisión humana hasta disponer de benchmark.
