# Recepciones-IA

Paquete de traspaso a Codex · Especificación v1.0 · 15 de noviembre de 2026

**Estado: diseño funcional y técnico documentado; aplicación todavía no implementada ni desplegada.**
Este repositorio es la fuente de contexto para construir la app. No presupongas que dispones de la conversación original.

## Objetivo

App independiente de cualquier ERP para comprobar lo que llega físicamente al almacén frente al albarán del proveedor y conciliar posteriormente albaranes/recepciones con facturas de compra recibidas por correo. Prioridad móvil, tablet y PDA; manejo sencillo; trazabilidad y coste de IA controlado. Volumen inicial comunicado: unos 100 documentos al mes, sin asumir 100 páginas ni 100 escaneos.

## Lectura obligatoria

1. [AGENTS.md](AGENTS.md): instrucciones para el agente de desarrollo.
2. [Especificación funcional](docs/01-producto.md): alcance, requisitos y límites.
3. [Pantallas y experiencia móvil](docs/02-diseno.md).
4. [Lectores y configuración de PDA](docs/03-lectores.md).
5. [Lectura documental y conciliación](docs/04-lectura-conciliacion.md).
6. [Arquitectura y datos](docs/05-arquitectura-datos.md).
7. [Integraciones, seguridad y operaciones](docs/06-integraciones.md).
8. [Pruebas y aceptación](docs/07-pruebas.md).
9. [Plan de implementación y pendientes](docs/08-plan.md).
10. [Prompt para comenzar en Codex](CODEX_START.md).

Los requisitos explícitos del usuario prevalecen. Las propuestas técnicas se identifican como tales; documentar alternativas justificadas sin eliminar funcionalidad acordada.

## Destinos

- Nombre comercial: **Recepciones-IA**.
- Repositorio: **davidferes74/Recepciones-IA**, privado.
- Proyecto Vercel propuesto: **recepciones-ia**, equipo Sentidiño.
- Sin dependencia de Odoo. No crear módulos Odoo ni exigir conexión a ERP.
- UI en español; fechas dd/mm/aaaa; zona de presentación Europe/Madrid; instantes persistidos en UTC.

## Inicio

Abrir este repositorio en Codex y pegar el contenido de CODEX_START.md.
No hay aún package.json, servidor, pruebas ejecutables ni conexiones productivas. Codex debe implementarlos.
No hay credenciales, fotos reales, facturas reales ni datos de proveedores en este paquete.
