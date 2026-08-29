# Laboratorio HV México — sitio web

Sitio público + panel de administración para Laboratorio HV México, un
laboratorio independiente de certificación de coleccionismo (Hot Wheels
Vintage, CIPSA, Bólidos Lilí Ledy y Aurimat) en CDMX. Este documento es para
quien mantenga el código después — incluye arquitectura, dónde están los
placeholders pendientes de llenar, y cómo desplegarlo.

Este README es solo para desarrolladores/mantenedores — no hace falta
subirlo a Hostinger junto con el sitio (no rompe nada si lo subes, pero no
sirve de nada ahí; el sitio no lo referencia).

## Qué es esto, técnicamente

Es una PWA (Progressive Web App) de una sola página, sin build step ni
framework: HTML, CSS y JavaScript "vanilla" en un solo archivo
(`index.html`, ~10 000 líneas), más un service worker (`sw.js`) para que
funcione instalada como app y cachee lo básico para cargar rápido offline.

No hay backend propio. Toda la persistencia de datos es directa contra
**Firebase** (Firestore como base de datos, Firebase Auth solo para el
login de administradores con Google) desde el navegador del cliente. No hay
servidor Node/Python corriendo en ningún lado — por eso el sitio se puede
hostear en cualquier hosting de archivos estáticos, como Hostinger.

## Estructura de carpetas

```
index.html              → todo el sitio: HTML + CSS + JS en un solo archivo
manifest.json           → metadata de instalación como PWA
sw.js                   → service worker (cache offline)
robots.txt              → indexación para buscadores
sitemap.xml             → sitemap (solo la portada — ver nota abajo)
assets/
  icons/                → favicons e íconos de instalación (PWA)
  img/                  → logo, fotos, sellos, láminas de la presentación, og-image
  docs/                 → PDF descargable de la presentación institucional
```

Al subir a Hostinger (o cualquier hosting), `index.html`, `manifest.json`,
`sw.js`, `robots.txt` y `sitemap.xml` deben quedar en la raíz del dominio —
la carpeta `assets/` debe quedar al mismo nivel, no un nivel más adentro.

**Nota sobre `sitemap.xml`:** el sitio es una sola página — secciones como
"Quiénes somos" o "Metodología" son vistas que se muestran/ocultan con
JavaScript dentro del mismo `index.html`, no URLs distintas que Google
pueda indexar por separado. Por eso el sitemap solo lista la portada.

## Antes de publicar: placeholders pendientes de llenar

Busca estas constantes dentro del `<script>` principal de `index.html` y
actualízalas antes de operar con clientes reales:

| Constante | Qué es | Estado |
|---|---|---|
| `SITE_DOMAIN` | Dominio real del sitio, usado para armar los links de los QR de verificación y compartir | Placeholder (`https://labhvmexico.com`) — actualízalo en cuanto compres el dominio, **y también** las etiquetas `og:image`/`og:url`/`twitter:image` en el `<head>`, que están hardcodeadas por separado |
| `BANK_TRANSFER_INFO` | Banco/titular/cuenta/CLABE para cobrar envíos por transferencia | Vacío a propósito — mientras esté vacío, el sitio no le muestra datos bancarios a nadie |
| `ADMIN_ALLOWED_EMAILS` | Lista de correos de Google autorizados a entrar al panel admin | Ya tiene 3 correos reales — agrega o quita aquí a los administradores |
| `RECAPTCHA_SITE_KEY` | Site Key de reCAPTCHA v2 para el formulario público | Usa la clave de **prueba** oficial de Google — deja pasar a cualquiera y muestra una advertencia roja fija en inglés. Reemplázala por una clave real desde https://www.google.com/recaptcha/admin antes de publicar |
| `FIREBASE_CONFIG` | Config del proyecto de Firebase | Ya apunta a un proyecto real (`laboratorio-hv`) |

## Arquitectura del código (dónde buscar qué)

Todo vive en un solo `<script>` dentro de `index.html`. Los módulos más
grandes, en orden aproximado en que aparecen:

- **`HVStorage` / `HV_COLLECTION_MAP`** — capa de acceso a Firestore. Todo el
  sitio lee/escribe a través de `HVStorage.get/set/delete/list(key)`, nunca
  llamando a Firestore directo. Una `key` tipo `"folio:HV-MX-2026-001"` se
  traduce a la colección `folios`, documento `HV-MX-2026-001`. Si agregas un
  nuevo tipo de dato, agrega su prefijo aquí.
- **Wizard de solicitud** (`view-solicitar`) — formulario de 6 pasos que
  arma una `solicitud:` nueva.
- **Panel de administración** (`view-admin`) — protegido por Firebase Auth +
  `ADMIN_ALLOWED_EMAILS` (chequeado del lado del cliente, sin backend — ver
  la hoja de ruta a producción sobre reglas de Firestore). Incluye
  Dashboard, Solicitudes, Ingresos (emisión de folios), Salón Privado,
  Referidos, Reseñas, y configuración del sitio.
- **Programa de referidos** (`referido:*`) — créditos automáticos por
  recomendar clientes.
- **Salón Privado HV** (`salon:*`) — membresía de socios preferentes por
  piezas certificadas acumuladas (5/10/20+), con activación y plan de pagos
  manejados por el admin, galería exclusiva y calendario VIP propios.
- **"Librero"/Book** — el visor de galería pública de piezas certificadas
  (y su versión paralela para el Salón).
- **Calendario** — agendado de citas (y su versión paralela VIP).
- **Sistema de i18n** — `SITE_LANG`, `data-i18n`/`data-i18n-placeholder`/
  `data-i18n-aria`, `I18N_EN` (diccionario a inglés), `t()`/`tt()`,
  `applyI18n()`. El contenido público es bilingüe (ES/EN); el panel admin y
  las plantillas de WhatsApp son **siempre en español**, sin importar el
  idioma del sitio — es una decisión de producto, no un olvido.

## Cómo desplegar una actualización

1. Edita `index.html` (y `sw.js`/`manifest.json`/assets si aplica).
2. **Sube la versión de `CACHE_NAME` en `sw.js`** (ej. `labhv-cache-v50` →
   `v51`). Si no lo haces, los visitantes que ya instalaron el sitio como
   app pueden seguir viendo la versión vieja cacheada por un rato.
3. Sube los archivos a Hostinger respetando la estructura de carpetas de
   arriba (reemplaza todo, no solo `index.html`).

## Pruebas

Durante el desarrollo se usaron pruebas con Playwright (carga de la
página, navegación entre vistas, formularios, i18n, cero errores de
consola) para verificar cada cambio importante — pero fueron scripts de
trabajo puntuales, no quedaron como una suite formal que corra
automáticamente. Si el proyecto sigue creciendo, vale la pena formalizar
esto como una carpeta `tests/` con Playwright Test y correrla en cada
cambio.

## Qué falta para producción

Hay una hoja de ruta priorizada (crítico/alto/medio/bajo) con todo lo que
falta antes de operar con clientes reales a escala — seguridad de
Firestore, pasarela de pago, respaldos automáticos, etc. Pregúntale a quien
haya trabajado el sitio contigo por el link, o revisa el historial de la
conversación donde se generó.
