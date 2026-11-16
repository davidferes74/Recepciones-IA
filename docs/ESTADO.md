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

## Comprobación adicional de acceso · 16/11/2026

10 comprobaciones HTTP reales aprobadas: workspace, extracción y original bloqueados sin sesión (401); login, lectura Neon y original autenticados (200); escritura de workspace y extracción rechazadas desde origen ajeno (403); logout correcto y consulta posterior sin sesión bloqueada. No se enviaron documentos nuevos a IA ni se modificó mercancía.

Añadido scripts/smoke-private.mjs para repetir las comprobaciones básicas con SMOKE_USERNAME y SMOKE_PASSWORD en entorno, sin guardar ni imprimir credenciales. Ejecutar: node scripts/smoke-private.mjs. Sintaxis comprobada; la ejecución documentada anterior se hizo con cliente HTTP Python equivalente y añadió la prueba de original.

Bloqueos para validación real: muestras representativas de albaranes/facturas y etiquetas, acceso a navegador de pruebas/PDA física, buzón inicial y autorización de carpeta Drive. La repetición automática se pausa mientras falten estos elementos; el prototipo no se declara producto terminado.


## 2026-11-16 — Importación masiva Excel
- Añadir producto: alta manual o Importar Excel. Plantilla XLSX vacía con instrucciones, códigos como texto y listas de unidad/seguimiento.
- Hasta 1000 productos / 2 MB, vista previa y confirmación. Solo crea; no sobrescribe existentes.
- Valida obligatorios, duplicados, embalajes, fórmulas y códigos numéricos. Errores con fila de Excel.
- Comando atómico e idempotente, con control de versión y transacción PostgreSQL existente; también disponible en demo.
- 38 tests y build correctos; plantilla renderizada y leída por el parser de la app. No se añadieron productos ficticios en producción.
- Normalizados prefijos OOXML del exportador para compatibilidad con ExcelJS.
- Pendiente prueba visual interactiva/PDA real: Chromium no arranca en este entorno. Despliegue a verificar tras publicación.

## 2026-11-16 — Primer incremento de correo IMAP
- Pantalla privada de correo con alta/edición, prueba, carpetas, filtros, fecha inicial y vista previa; cifrado obligatorio.
- Captura manual incremental y transaccional de adjuntos; deduplicación, exclusiones y bandeja con original descargable.
- Adjuntos abren lectura Claude/revisión existente y guardado de factura con conciliación.
- Migración 003; endpoint autenticado para futuro programador. No se ha activado captura automática ni Gmail OAuth.
- 43 tests y build correctos. No prueba real de buzón: requiere TOKEN_ENCRYPTION_KEY y credenciales introducidas en la app. Navegador/PDA y concurrencia DB pendientes.
- Procedimiento, límites y configuración: docs/10-correo.md.
