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
- **Salón Privado HV** (`salon:*`) — membresía de socios preferentes,
  reposicionada como una vitrina curada de colección: los niveles (5/10/20+
  piezas certificadas) siguen existiendo como **reconocimiento** dentro del
  salón, pero el ingreso ya no depende de acumular piezas ni de un plan de
  abonos — es una **membresía anual fija de $1,000 MXN** (`SALON_ANNUAL_FEE`),
  pensada como un espacio exclusivo donde solo se publican las piezas más
  raras/extraordinarias de la colección de socios, vistas y reconocidas por
  otros coleccionistas. El admin (vía `ADMIN_ALLOWED_EMAILS`) siempre tiene
  acceso ilimitado sin pagar (`salonAdminPreviewMember()`/
  `goToSalonLobbyAdmin()`, sin cambios respecto a antes). El alta de un socio
  nuevo la hace el admin desde el panel — ya sea presencial (cuando trae sus
  piezas) o registrando el pago de un cliente de confianza por el método que
  el admin decida (transferencia, efectivo, etc. — el sitio no cobra en
  línea, es un registro manual del admin, igual que el resto de los cobros
  del sitio). `computeMembershipStatus()` ahora deriva también un estado
  **"vencida"** cuando pasó la fecha de renovación (`fechaRenovacion`) sin
  registrar el siguiente pago. Galería exclusiva y calendario VIP propios,
  sin cambios en su mecánica.
  - **Vitrina pública (`renderSalonTiersTeaser`)**: se corrigió que los 3
    niveles (Plata/Oro/Platino) se veían como si fueran 3 membresías con
    precio propio (los 3 repetían "$1,000 MXN al año"). Cada tarjeta de
    nivel ya no repite el precio — muestra "Nivel N de 3" y, a partir del
    nivel 2, una línea "Incluye todo lo de [nivel anterior], más:" antes de
    sus beneficios propios (los beneficios ya no repiten en texto los del
    nivel anterior, como sí pasaba antes). Los beneficios semilla
    (`SALON_TIERS_DEFAULT`, editables desde el admin en Niveles) ahora
    mencionan explícitamente descuentos, promociones y regalos crecientes
    por nivel, como reconocimiento a la lealtad. También se reemplazó "el
    laboratorio cura y publica" por "el laboratorio selecciona y publica"
    en el texto introductorio en español — "cura" ahí generaba confusión
    (se lee como el sustantivo "cura", no como el verbo curar/curaduría).
  - **"Hero" del Salón, en 2 columnas**: la primera versión de este ajuste
    mostraba el precio como una simple píldora de texto sobre un panel
    oscuro — el cliente lo describió como que "se ve muy simple... parece
    un pago, no una membresía". Se rediseñó como una vista previa TANGIBLE
    de la membresía: a la derecha de la copy del hero (`.salon-hero-grid`,
    2 columnas — se apila en móvil) se muestra una tarjeta con el mismo
    componente visual de la tarjeta real de un socio (`.salon-member-card`,
    reutilizada vía `.salon-preview-card`), con su efecto de inclinación
    3D al mover el mouse y su brillo de "foil" — mismo `initSalonCardTilt()`
    generalizado para aceptar cualquier id de tarjeta. La tarjeta de vista
    previa muestra "Comunidad de coleccionistas premium", el precio, un
    código enmascarado (`HVS-●●●●●●`) y los 3 niveles como una mini-ruta
    dorada, para que la promesa se sienta concreta antes de entrar. Debajo,
    un texto puente ("Así se ven tus niveles de reconocimiento...") lleva a
    las 3 tarjetas de nivel con el detalle de beneficios.
  - **"Verificar folio" y "Mi historial" — tarjetas de consulta**: ambas
    vistas tenían solo un `<input>` y un botón sueltos sobre la página, sin
    ninguna jerarquía visual. Se les dio el mismo tratamiento "premium" que
    ya tenía la tarjeta de la portada (`.lookup-card`, reutilizable): ícono
    en placa con degradado (escudo rojo/dorado para Verificar folio, reloj
    verde para Mi historial — para diferenciarlas), etiqueta + subtítulo,
    campo con esquinas redondeadas y anillo de enfoque, y una fila de
    "confianza" debajo (p.ej. "🔒 Público y gratuito" / "⏱ Estatus
    actualizado en tiempo real"). La vista de resultados de "Mi historial"
    (la línea de tiempo con etapas) no cambió — ya tenía su propio diseño
    animado; el ajuste fue solo en la tarjeta de búsqueda inicial.
- **Folio/QR — público vs. Salón**: verificar un folio (`verifyFolio()`,
  incluyendo el que viene de escanear un QR) sigue siendo público para
  cualquier pieza de la **biblioteca pública** — así un comprador de segunda
  mano puede validar autenticidad sin restricciones, y desde ahí hay un
  botón directo a la Galería pública. Pero si el folio pertenece a una
  **pieza del Salón**, el resultado ya no se muestra directo: se pide
  teléfono + código de socio (mismo patrón que el acceso al Salón) y, una
  vez validado, se muestra **solo una vista de lectura** de esa pieza (sin
  dar acceso a nada más del Salón si no se tiene membresía activa). Esto
  cierra un hueco real que existía antes, donde cualquiera con el folio de
  una pieza del Salón podía verla sin ser socio.
- **"Librero"/Book** — el visor de galería pública de piezas certificadas
  (y su versión paralela para el Salón).
- **Compartir a redes sociales** — botón "✨ Compartir" en el detalle de
  cualquier pieza (biblioteca pública y Galería Exclusiva del Salón) y en la
  tarjeta de socio. Genera una imagen vertical 1080×1920 tipo "Historia"
  dibujada directo en `<canvas>` (`buildPieceStoryCanvas`/
  `buildSocioStoryCanvas`, sin librerías nuevas) y abre una hoja de
  compartir propia (`openShareSheet`) con Web Share API nativo + botones de
  WhatsApp/Facebook/Instagram-TikTok(descarga)/copiar enlace/descargar, con
  íconos de marca en SVG inline (`shareBrandIcon()`); como Instagram/TikTok
  no soportan compartir directo desde el navegador, ese botón está
  etiquetado explícitamente como descarga ("Descargar imagen — Historia de
  Instagram"). Una
  pieza del Salón solo genera una liga pública visitable
  (`?pieza=<id>&s=salon`, atendida por `handleIncomingPiezaLink()`) si tiene
  `consentimientoLibroPublico:true`; si no, comparte solo la imagen, sin
  liga. Las piezas de la biblioteca pública siempre tienen liga
  (`?pieza=<id>`), porque ya son públicas de por sí.
- **"Piezas falsas"** (`site:piezasFalsas`) — pestaña de navegación y
  almanaque público paralelo al "Librero", donde el admin publica piezas
  detectadas como falsas/alteradas durante los peritajes (modelo, categoría,
  motivo y fotos). No toca el flujo de certificación/folios — es solo un
  registro público de advertencia para la comunidad de coleccionistas.
  Módulo completo (`getPiezasFalsas`/`setPiezasFalsas`/
  `renderPiezasFalsasAdmin`/`renderPiezasFalsasView`/etc.) justo después del
  módulo de piezas del admin. El "Dictamen de autenticidad" en Metodología
  también tiene una tarjeta nueva "Falso/Alterado" (⚠️) a lado de "Réplica".
- **Nombres de paquetes**: "Peritaje + dictamen" (antes "Peritaje físico +
  certificado") y "Premium + certificación + encapsulado" (antes "Premium +
  encapsulado"/"Peritaje premium + encapsulado", que ya estaban
  inconsistentes entre sí). El nombre del paquete se usa también como llave
  literal en `PKG_PRICE`/`DEADLINE_DAYS` y se guarda tal cual en el campo
  `nivel` de `solicitud:`/`folio:` en Firestore — por eso ambos diccionarios
  conservan las llaves viejas como respaldo (comentario en el código, junto
  a `PKG_PRICE`), para que folios/solicitudes ya emitidos con el nombre
  anterior sigan resolviendo su precio y plazo correctamente.
- **Aviso Express/Super Express**: ambos tiempos de entrega ahora aclaran
  (en la tabla de precios y en el wizard) que cuentan a partir de que la
  pieza está físicamente en el laboratorio, no desde que se solicita o se
  envía.
- **Verificar folio**: se quitó el "ejemplo de folio" mostrado en los
  campos de folio (portada y vista "Verificar folio") — el placeholder
  ahora es un texto genérico ("Folio o código del certificado"), para no
  enseñar el patrón de los folios reales. El texto de la vista también se
  simplificó a un mensaje genérico de "verifica el folio de tu pieza
  certificada o el código QR de tu certificado". La verificación en sí
  sigue siendo pública a propósito para piezas de la biblioteca pública
  (decisión confirmada con el cliente); ver arriba la nota de "Folio/QR —
  público vs. Salón" para el caso de piezas del Salón.
- **"Piezas falsas" como libro del abismo**: la vista pública de piezas
  falsas/alteradas ahora usa la misma mecánica de "libro" que el Librero
  público y la Galería del Salón (`.hv-book-*`/`.book-stage`), con una
  portada temática propia (`abyss-hv-book`) — una calavera con pulso sutil
  sobre un fondo oscuro tipo abismo, para diferenciarla visualmente de las
  otras dos galerías y dejar clara la advertencia antes de abrirla. Sigue
  siendo el mismo registro público informativo de antes (modelo, categoría,
  motivo, fotos) — solo cambió la presentación, no la lógica de datos
  (`getPiezasFalsas`/`setPiezasFalsas` sin cambios).
- **Teléfonos con lada/país**: los campos de teléfono del sitio (wizard,
  Salón, acceso a pieza del Salón, etc.) ahora tienen un selector de lada
  al lado del número, para clientes internacionales. Mientras el teléfono
  guardado sea de México, el comportamiento de búsqueda/coincidencia no
  cambia (México se guarda sin prefijo por compatibilidad con los datos ya
  existentes); otras ladas sí se antep​onen al número.
- **Notificaciones de WhatsApp al cliente**: se corrigió un bug real donde
  varios botones de "notificar al cliente" del admin (rechazo, dictamen,
  proceso completado, aviso de recolección, solicitud de datos de envío,
  etc.) abrían WhatsApp hacia el **número del laboratorio** en vez del
  número del cliente. Ahora usan `waLinkTo(telefono, mensaje)`, que arma el
  link con el teléfono guardado de esa solicitud. De paso se corrigió el
  botón "Compartir por WhatsApp" de una pieza/tarjeta de socio, que por el
  mismo motivo forzaba un chat con el laboratorio en vez de dejar elegir a
  quién compartir.
- **Paso 6 de metodología (zigzag) y llantas**: se eliminó un salto de
  scroll incómodo que ocurría al marcar "No agregado"/calificar una zona —
  antes se re-renderizaba y re-centraba todo el paso en cada clic; ahora
  solo se actualiza el bloque afectado, y únicamente se hace un scroll
  suave (y solo cuando se marca "No agregado" por primera vez) hacia la
  **siguiente** zona a evaluar. Además, la zona "llantas" ahora captura una
  calificación **individual por cada una de las 4 llantas** (delantera
  izq./der., trasera izq./der.) y el promedio de las 4 es lo que se usa
  como calificación de esa zona en el resto del dictamen.
  - **Nuevas zonas evaluables**: se agregaron 6 zonas más al protocolo
    Zigzag C-Z, todas con el mismo patrón de "evaluación individual por
    sub-parte y promedio automático" que ya tenía llantas: **Cristales**
    (parabrisas, medallón, cristal izquierdo, cristal derecho — 4
    sub-partes), **Defensas** (frontal, trasera), **Ejes** (delantero,
    trasero), **Salpicadera delantera** (izquierda, derecha) y
    **Salpicadera trasera** (izquierda, derecha) — estas dos sí llevan
    criterio de tampo/pegatina, igual que el resto de las zonas de
    carrocería pintada, y **Volante (si aplica)**, que es una zona de
    calificación única (no promediada) y sin tampo, para vehículos que no
    lo traigan de fábrica o no aplique evaluarlo. La zona "Parte trasera"
    (cajuela) que se mencionó en la retroalimentación del cliente ya
    existía desde antes en el protocolo — no se duplicó.
    Internamente, el mecanismo de "llantas" (antes una excepción
    hardcodeada en el código) se generalizó a un mapa de configuración
    único (`ZZ_MULTI_PART`) que define, por zona, cuántas sub-partes tiene
    y cómo se llaman — así cualquier zona futura con el mismo patrón
    (evaluación individual + promedio) se agrega solo con una entrada en
    ese mapa, sin repetir lógica. Los dictámenes ya guardados en Firestore
    antes de este cambio se migran automáticamente y sin pérdida de datos
    la primera vez que se abren: las zonas nuevas se agregan vacías al
    objeto ya existente, respetando lo que el perito ya había calificado
    en las zonas anteriores. La calificación general del vehículo pintado
    (usada para autollenar el certificado) ahora también promedia las dos
    nuevas zonas de salpicadera, junto con las zonas de carrocería que ya
    contaba antes.
  - **Nueva pregunta frecuente (Paquetes)**: se agregó "¿Qué sucede si el
    dictamen determina que la pieza es falsa o alterada?", con la
    respuesta de que la pieza queda registrada en el almanaque público de
    advertencia "Piezas falsas", visible para toda la comunidad — sin
    publicar nunca los datos del dueño (consistente con la cláusula ya
    existente en Términos y condiciones).
- **Confirmación de paquete + tiempo de entrega en el wizard**: al elegir
  un paquete ya no se avanza automáticamente al siguiente paso — se muestra
  un resumen de confirmación ("Elegiste: [paquete] — [tiempo] — [precio].
  Pulsa Continuar para confirmar y seguir.") que se actualiza en vivo si se
  cambia el tiempo de entrega (Estándar/Prioritario/Express/Super Express),
  y el cliente pasa al siguiente paso solo cuando pulsa "Continuar".
- **Menú y cambio de tema en móvil**: se corrigió que en pantallas de
  celular (iPhone y Android) el botón de menú (☰) y el de cambiar tema
  claro/oscuro quedaban invisibles o cortados por el encabezado —
  verificado con pruebas automatizadas en viewports de iPhone y Android.
  También se afinó la transición de color al cambiar de tema (antes tardaba
  y algunos textos se veían mal mientras cambiaba); ahora la transición es
  más corta y cubre también títulos, párrafos y demás texto, no solo el
  fondo.
- **Menú principal (escritorio) en una sola línea**: antes, cuando la
  ventana no era lo bastante ancha para las 9 pestañas del menú, "Salón
  Privado HV" se caía a un segundo renglón y se veía desordenado. Ahora el
  menú nunca rompe línea: en ventanas normales de escritorio cabe completo
  en una sola fila (se redujo un poco el tamaño/padding de las pestañas en
  anchos intermedios, vía `@media(min-width:761px) and (max-width:1180px)`
  sobre `#main-nav`), y si la ventana es muy angosta, la píldora del menú se
  desliza horizontalmente (arrastrando o con el trackpad) sin mostrar barra
  de scroll, en vez de partirse en dos líneas.
- **Tarjeta "Verificar un folio ahora" (portada)**: se rediseñó para verse
  más profesional, ya que es la primera interacción del sitio — ícono en
  una placa con degradado y sombra, etiqueta en mayúsculas más marcada,
  nuevo subtítulo ("Consulta pública e instantánea"), campo con esquinas
  redondeadas y un anillo de enfoque visible al hacer clic, y una sombra más
  presente para que la tarjeta resalte sobre el fondo. El placeholder del
  campo (aquí y en la vista completa "Verificar folio") se simplificó de
  "Folio o código del certificado" a solo **"Folio"**, para que siempre se
  vea completo sin cortarse.
- **Calendario** — agendado de citas (y su versión paralela VIP).
- **Sistema de i18n** — `SITE_LANG`, `data-i18n`/`data-i18n-placeholder`/
  `data-i18n-aria`, `I18N_EN` (diccionario a inglés), `t()`/`tt()`,
  `applyI18n()`. El contenido público es bilingüe (ES/EN); el panel admin y
  las plantillas de WhatsApp son **siempre en español**, sin importar el
  idioma del sitio — es una decisión de producto, no un olvido.
- **Términos y condiciones**: se reforzó que todo dictamen se emite bajo
  criterio de peritaje independiente, y se agregó una cláusula explícita
  sobre piezas falsas/alteradas: al aceptar el proceso de certificación, el
  cliente acepta que si el resultado indica pieza falsa/alterada, esa pieza
  será publicada en el registro público de "Piezas falsas" bajo esa
  condición. También se dejó explícito por escrito que nunca se publican
  datos del dueño (nombre, teléfono, etc.) — únicamente la pieza, sus fotos
  y su condición.
- **Paso 6 (Zigzag) — acordeón por zona + bloqueo real de avance**: hasta
  ahora "Confirmar calificación y continuar" solo exigía que **alguna** zona
  tuviera calificación, no las 16 — y las 16 zonas aparecían siempre
  desplegadas de golpe, obligando a mucho scroll para ubicar qué faltaba.
  Ahora:
  - Cada zona se colapsa sola en cuanto queda calificada (`zzZoneIsComplete`)
    y se abre automáticamente la siguiente pendiente — nunca hay que buscar
    manualmente entre las 16. Cualquier encabezado de zona se puede volver a
    tocar para revisarla o corregirla.
    Cada zona muestra su estatus sin necesidad de abrirla: **Pendiente**,
    **✓ calificación** o **No aplica**.
  - Una barra flotante fija en la parte inferior de la pantalla
    (`.zz-progress-float`) siempre visible mientras el Paso 6 está abierto,
    con el conteo "X/16 zonas calificadas", el nombre de la siguiente zona
    pendiente, y un botón "Ir a la siguiente pendiente" que salta directo a
    ella con scroll suave — así nunca hay que adivinar qué falta.
  - "Confirmar calificación y continuar" ahora queda **bloqueado de verdad**
    hasta calificar las 16 zonas (o marcarlas "No aplica", ver abajo), con un
    aviso en rojo debajo del botón listando por nombre las zonas que faltan.
  - **Volante — "¿Aplica esta zona?"**: como no todas las piezas traen
    volante, esta zona (y cualquier futura zona que se marque igual,
    `opcionalAplica` en `ZZ_ZONAS_DEF`) ahora pregunta primero "¿Aplica esta
    zona en esta pieza?" (Sí / No). Si se responde "No aplica", la zona se
    excluye del promedio general y **no bloquea** confirmar la calificación;
    si no se ha respondido todavía, sigue contando como pendiente. Antes,
    una pieza sin volante calificable habría bloqueado el paso para siempre
    bajo el nuevo requisito de "calificar todas las zonas".
  - El mismo bloqueo de avance ahora aplica a los 8 pasos del proceso
    completo (y a los pasos del flujo de Validación digital): cada paso
    queda bloqueado hasta terminar el anterior, con un aviso que nombra el
    paso exacto que falta ("Se habilita cuando completes el paso 2..."). Antes
    esto solo pasaba entre el paso 1 (recepción) y el resto — del 2 en
    adelante se podían abrir y marcar en cualquier orden.
- **Formulario de solicitud — código de referido**: el campo ya no se
  muestra siempre con un ejemplo de código ("Ej. HV-A3F9K2"), lo que se
  sentía como un requisito. Ahora primero se pregunta "¿Alguien te
  recomendó Laboratorio HV?" con botones Sí/No; el campo de texto para
  escribir el código solo aparece si el cliente responde que sí tiene uno.
- **"Verificar folio" y "Mi historial" — centradas**: la tarjeta de consulta
  se quedaba pegada a la izquierda, con mucho espacio vacío a la derecha en
  pantallas anchas. Ahora el título, subtítulo y tarjeta viven dentro de
  `.lookup-stage`, centrados como una sola pantalla de foco, con un
  degradado radial sutil detrás de la tarjeta, ícono más grande, elevación
  al pasar el mouse, y la fila de confianza ("🔒 Público y gratuito", etc.)
  ahora son píldoras con fondo en vez de texto suelto.

- **Remaster del panel admin — rendimiento, organización y diseño**: pase
  grande sobre el panel administrador, en tres frentes.
  - *Rendimiento*: las listas del admin (Solicitudes, Validación en curso,
    Historial, Dashboard, exportaciones) leían cada documento uno por uno
    en secuencia — con 100+ piezas eso se sentía lento. Ahora todas usan
    `Promise.all` para traer los documentos en paralelo.
  - *Organización a escala*: "Historial de piezas" ahora deja elegir entre
    agrupar **por semana o por mes** (antes solo por mes); hay un botón
    para **exportar a CSV exactamente lo que se está viendo** (respeta el
    filtro activo); nueva pestaña **"Cliente 360°"** que junta en una sola
    pantalla todo lo de un cliente (solicitudes, piezas en proceso, folios
    certificados, gasto total y su estatus de Salón Privado) buscando solo
    por teléfono — ya no hay que ir pestaña por pestaña; y el buscador
    global ahora tiene un botón "👤" junto a cada resultado para saltar
    directo al perfil de ese cliente. También hay **alertas de plazos**:
    el Dashboard muestra un aviso arriba de todo cuando alguna pieza en
    proceso está atrasada o le queda menos de 24h, y el ícono de
    "Validación en curso" en el menú se pone rojo con el número de piezas
    atrasadas.
  - *Diseño*: el panel se ve más pulido y con más peso visual — esquinas
    más redondeadas, sombras más suaves, tarjetas de KPI con una franja de
    color arriba y elevación al pasar el mouse, el menú lateral agrupado
    en "Operación diaria" / "Contenido y sistema" con íconos en su propio
    círculo, y se corrigió un bug real donde el botón de filtro activo
    (p. ej. "Todas" en Historial) mostraba el texto invisible por un
    choque de estilos (texto rojo sobre fondo rojo).

- **Lobby del Salón Privado — bienvenida, vigencia de membresía y "Libro
  del Coleccionismo"**: al entrar al lobby (desde la puerta de acceso, el
  menú, o la vista previa del admin) aparece una **ventana flotante de
  bienvenida** con el nombre del socio, un resumen de lo que incluye la
  membresía (tarjeta, Libro del Coleccionismo, Calendario VIP, beneficios
  que crecen por nivel) y su línea de tiempo de membresía. Esa ventana se
  puede cerrar y se puede volver a abrir en cualquier momento con el botón
  "✨ Ver bienvenida" — pero **incluso sin abrirla**, el lobby ya muestra de
  entrada, en este orden, su tarjeta de socio, su estatus/línea de tiempo
  (socio desde / se renueva / cuenta regresiva) y el **Libro del
  Coleccionismo** (las piezas más recientes del Salón, actualizadas por los
  socios). La membresía ahora tiene **vigencia real**: 30 días antes de la
  fecha de renovación aparece un aviso in-line de "por vencer pronto"
  (también reflejado como filtro nuevo en la pestaña Miembros del admin), y
  si la fecha de renovación ya pasó, el acceso a la Galería y al Calendario
  VIP se bloquea automáticamente mostrando una tarjeta de "acceso pausado"
  con un botón directo de WhatsApp para renovar — sin perder la calidez de
  seguir mostrando su tarjeta y su historial como socio. Todo esto es
  bilingüe (ES/EN) como el resto del sitio público.
  - **Corrección**: el lobby mostraba primero toda la portada pública de
    venta (el "hero" del Salón y las 3 tarjetas de niveles) y el socio
    tenía que hacer scroll para llegar a su propia tarjeta — además la
    ventana de bienvenida no se disparaba en el flujo real de acceso
    (teléfono + código). Ahora, en cuanto el socio entra, esa portada
    pública se oculta y lo primero que ve es su tarjeta, su línea de
    tiempo y el Libro del Coleccionismo — sin scroll — y la ventana de
    bienvenida sí aparece. Al salir del lobby, la portada pública vuelve a
    mostrarse para el siguiente visitante.
  - **Ajuste**: la ventana de bienvenida ya solo se abre sola la primera
    vez que un socio entra — queda guardado (en este dispositivo) que ya
    la vio, así que las siguientes veces que entra al lobby no se le
    interrumpe con la ventana. Siempre puede volver a verla a mano con el
    botón "✨ Ver bienvenida".

- **Remaster del "primer vistazo" (hero de inicio, Ubicación, Escala de
  grados y presentación institucional)**: pase de diseño para que la
  primera impresión del sitio se sienta más completa y espectacular.
  - Se quitó el carrito decorativo animado del hero y en su lugar se
    agregó un **brillo metálico en movimiento** (barrido diagonal sobre
    el fondo rojo, respetando "reducir movimiento" del sistema), y se
    ajustaron los espaciados del hero (logo, márgenes) para que todo su
    contenido — encabezado, insignias de confianza, botones y la tarjeta
    de verificar folio — se lea completo sin sentirse apretado.
  - La sección **Ubicación** se remasterizó: el mapa ahora tiene una
    franja de color superior y un botón flotante "Cómo llegar" que abre
    direcciones directo en Google Maps, y las instrucciones de acceso se
    presentan en una tarjeta con ícono circular por cada punto, en vez de
    texto plano.
  - La **Escala de grados** (Metodología → Escala) ahora se ve siempre en
    **una sola fila de 6 tarjetas** en escritorio, cada una con su ícono
    en una insignia circular de color según el resultado (verde/ámbar/
    rojo) y efecto de elevación al pasar el mouse; en anchos intermedios
    se ocultan las descripciones para que las tarjetas no se vean
    apretadas, y en celular se acomodan en 2 columnas legibles.
  - La **presentación institucional** (dentro de Quiénes somos) se
    actualizó visualmente: franja de color superior, una insignia "19
    láminas"/"19 slides", una lupa que aparece al pasar el mouse sobre
    cada miniatura (para dejar claro que se puede ampliar), un desvanecido
    en el borde de la tira de miniaturas que insinúa que hay más para
    deslizar, y un ícono de "reproducir" en el botón "Ver presentación
    completa".
  - Todo lo anterior se probó en celular, tablet y escritorio, y en
    español e inglés.

- **Contorno dinámico "luz dorada viajando" en el Salón Privado**: tanto
  la tarjeta de presentación del Salón (la sección de bienvenida con la
  vista previa de la membresía) como el botón "Salón Privado HV" del menú
  ahora tienen un segmento de luz dorada que recorre el contorno sin
  parar — nunca un anillo fijo completo, sino una línea que "camina"
  alrededor del borde — para que se sienta que hay algo especial ahí
  invitando a entrar a verlo. Se ve siempre, esté o no esa vista activa
  en el menú. Es puro CSS (sin imágenes ni JavaScript adicional): si el
  navegador de alguien no soporta la técnica de ángulo animado, el borde
  simplemente se queda dorado fijo — nunca rompe el diseño — y respeta
  "reducir movimiento" del sistema mostrando también un borde fijo.
  - **Ajuste**: el contorno casi no se notaba, así que se engrosó bastante
    la línea de luz y se le agregó un resplandor real alrededor (no solo
    el trazo) para que el borde iluminado se vea con fuerza tanto en la
    tarjeta como en el botón del menú.

- **Envío con dos velocidades — $300 terrestre / $450 al día siguiente**:
  antes había un solo costo fijo de envío ($200 MXN) para cuando el
  cliente traía o recibía su pieza por paquetería. Ahora, al elegir
  "envío" (de ida y/o de regreso, cada sentido por separado), aparece un
  segundo paso para escoger la velocidad: **terrestre** ($300 MXN, llega
  en 3 a 5 días) o **entrega al siguiente día** ($450 MXN). El costo total,
  el aviso de transferencia bancaria, el resumen final antes de enviar la
  solicitud y las tarjetas del admin reflejan automáticamente la velocidad
  elegida en cada sentido.

- **Menú — "Piezas falsas" al final y en negro**: se movió al final del
  menú de navegación (antes iba junto a "Verificar folio") y se le dio un
  tratamiento visual serio en negro/obsidiana con acento morado — a tono
  con el registro de advertencia que abre — en vez de compartir el
  rojo/dorado del resto del menú, para que se perciba como una sección
  aparte y no como una opción más de venta.

- **Primera impresión de la portada**: la portada (hero) ahora incluye una
  fila de insignias de confianza (25+ años de experiencia, folio público y
  verificable, sin afiliación a las marcas, 100% mexicano) y dos botones de
  acción directamente visibles al entrar — "Solicitar certificación de tu
  pieza" y "Ver cómo funciona" — además de la búsqueda de folio que ya
  existía, para que un visitante nuevo tenga un camino claro de inmediato
  y no dependa solo de bajar por la página.

- **Sección de reseñas remasterizada**: el promedio de calificación ahora
  vive en una tarjeta con más peso visual, el estado sin reseñas todavía
  se ve como una invitación (ícono + mensaje) en vez de una línea de texto
  suelta, y la tarjeta para escribir una reseña tiene una franja de color
  y una insignia "Verificado con Google" a tono con el resto de tarjetas
  del sitio.

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
