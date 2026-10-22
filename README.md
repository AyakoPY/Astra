# JARVIS
1. Necesitas Node 18+ y una clave gratis de Gemini.
2. `npm install` y `cp .env.example .env` (edita `GEMINI_API_KEY`).
3. `npm start` y abre http://localhost:3000 (usa Chrome; el micrófono requiere localhost o HTTPS).
4. Escribe el nombre de tu asistente, pulsa «Hablar» o escribe.
Proveedor: Gemini (clave gratis en https://aistudio.google.com/apikey). Voz femenina: `GEMINI_VOICE=Aoede` (o Kore, Leda, Zephyr).
Abre `vault/` como vault de Obsidian, o apunta `VAULT_PATH` a la tuya.

## v0.13 — novedades
- Escucha "Hola, <nombre>" con 3 métodos en cascada (se cambia solo si uno falla): navegador (Edge/Chrome) → reconocedor de Windows (Brave) → micrófono + Gemini (funciona en cualquier navegador; máx. 12 clips/min).
- El chat prueba varios modelos (con las herramientas incluidas) y usa el más rápido; si uno se cuelga, pasa al siguiente.
- Diagnóstico ampliado (incluye prueba de Gemini Live y conteo real de resultados de búsqueda).
- Seguridad: solo localhost puede hablar con el servidor; si queda una instancia vieja abierta, la nueva la reemplaza.
- Búsqueda: más respaldos (DuckDuckGo lite, Bing RSS, Wikipedia por búsqueda) y lectura de páginas protegida.

## v0.14 — WhatsApp y llamadas
- «Astra, guarda el contacto Kenji, +595981123456» → `contact_add` (se guarda en %APPDATA%\JARVIS\contacts.json).
- «Astra, mándale un WhatsApp a Kenji diciendo hola» → `send_whatsapp` (pide confirmación; usa WhatsApp de escritorio o WhatsApp Web).
- «Astra, llama a Kenji» → `call_phone` (abre la app de llamadas o el chat; tú pulsas Llamar).

## v0.17 — ventanas ya abiertas
- list_windows, focus_window, type_in_window, press_keys: Astra trabaja con las ventanas que ya tienes abiertas (Brave, Discord, Spotify…), sin abrir otras nuevas.
- send_message de Discord usa la ventana de Discord abierta, sea la app o Discord en una app/ventana de Brave.

## v0.22
- media_control usa los controles multimedia de Windows (pausa/siguiente/anterior exactos sobre Brave o Spotify, sin tocar el volumen).
- Filtro de voz más estricto con parlantes (descarta música pareja y ruidos cortos como el teclado); la escucha por frase exige más seguridad (WAKE_CONFIDENCE=0.65, ajustable en .env).
- «Descansa» corta la sesión al terminar de despedirse; el volumen de otras apps se restaura siempre.
- Si Gemini Live rechaza la conexión (1011), reintenta con una configuración más ligera.
- DUCK_APPS=none en .env desactiva bajar el volumen de otras apps mientras ella habla.

## v0.23
- Pantalla de inicio con el logo de Astra. El nombre de la asistente es fijo: Astra (se quitó "Renombrar").
- Icono nuevo (astra.ico). Al abrir con JARVIS.vbs se crea "Astra.lnk" con el icono en esta carpeta y en el escritorio; ancla ese acceso directo a la barra de tareas.

## v0.24
- Se activa diciendo solo «Astra» (también sigue funcionando «Hola, Astra» y «Oye, Astra»). Para evitar falsos positivos, la palabra sola exige un poco más de seguridad al reconocedor de Windows.

## v0.25 — fotos
- En el chat: botón 📎, pegar con Ctrl+V o arrastrar fotos (hasta 4). Astra las ve y las entiende; si no escribes nada, te las describe.
- En voz: botón «📎 Foto» durante una sesión para mostrarle una imagen mientras hablan.

## v0.26
- Al pasarle una foto en el chat, Astra la describe y también la lee en voz alta (botón «Leer fotos en voz» en ⋯ para desactivarlo).
- Si la voz de Gemini se cae tras mucho rato abierta, se reconecta sola (hasta 2 veces); si falla seguido, pausa la escucha 1 minuto en vez de insistir.
- WAKE_CONFIDENCE por defecto 0.5.

## v0.27
- Abrir páginas en Brave: ahora usa el propio navegador (pestaña nueva en tu ventana ya abierta) y luego la trae al frente.
- Presentación: «Hola, soy la asistente de Maxi» solo tras dos muestras seguidas que no coinciden con tu voz y como máximo cada 30 min; «Hola, Creador», también cada 30 min como máximo.
- Falsas activaciones con parlantes: si tras activarse nadie habla en 10 s, se cierra sola y la escucha se vuelve un poco más exigente durante 10 min.
- Menos mensajes repetidos de «Escuchando…» en el chat.

## v0.28
- La música (play_music) se abre como pestaña nueva en tu Brave ya abierto, no en una ventana aparte. «Cierra la música» cierra esa pestaña de YouTube si está al frente; si no, usa «pausa».

## v0.29
- **Gmail:** «revisa mis correos» / «resume los últimos 5 de <remitente>». Lee por IMAP en solo lectura (no marca como leído). Configura `GMAIL_USER` y `GMAIL_APP_PASSWORD` en `.env`.
- **Solo mi voz** (menú ⋯): con tu voz grabada, otras voces (TikTok, TV, videos) llegan en silencio y no te saludan; si te escucha otra voz al activarse, vuelve a dormir sin hablar.
- «Astra» solo activa si es una frase corta (solo el nombre, hasta 2 palabras, o «hola Astra»); una frase larga de un video que lo mencione ya no cuenta.

## v0.30
- Sin nombre de creador: ya no dice «Hola, Creador» ni que la creó una persona. Al reconocer tu voz saluda «Hola» (+ tu nombre si lo conoce); con otra voz, «Hola, soy Astra». Si preguntan quién la creó: «Soy Astra, tu asistente personal».

## v0.31
- **Navegadores:** ya no solo Brave. Si dices «abre Opera / Chrome / Edge / Firefox / Vivaldi» usa ese; si no nombras ninguno, usa el navegador predeterminado de Windows. Si el nombrado no está instalado, lo dice y no abre otro.
- **Música:** `play_music` es solo para canciones. «Pon X en Spotify» abre la búsqueda en la app de Spotify (no puede dar play sola); series, episodios y videos van por búsqueda web, no por música.
- **Archivos:** además de fotos, puedes adjuntar PDF, Word (.docx), Excel (.xlsx), PowerPoint (.pptx) y texto/CSV/JSON (📎 o arrastrar). También en modo voz (📎 Foto/Archivo).
- **Repetir:** «repite eso», «otra vez», «lo mismo» ejecuta de nuevo la última acción (`repeat_last`).

## v0.32 / v0.33
- **Instalador de un clic (`Astra-Setup.exe`, proyecto aparte `astra-setup/`):** ventana de progreso propia; descarga la última versión desde un `latest.json` (verificada con SHA-256), el motor Node portable (una sola vez) y los componentes; crea accesos directos, aparece en «Aplicaciones instaladas» y vuelve a ejecutarse para actualizar. Sin administrador.
- **Clave de Gemini dentro de la app:** pantalla con el paso a paso, botón para abrir Google AI Studio, «Pegar» y «Guardar y probar» (valida antes de guardar). Se cambia en ⋯ > Clave de Gemini. Se guarda en `%APPDATA%\JARVIS\apikey.json`.
- **Errores claros:** clave inválida, límite gratis agotado, Gemini saturado o sin internet se explican en español.

## v0.34
- **Enviar correos:** «mándale un correo a ana@gmail.com diciendo…» (`gmail_send`, por SMTP de Gmail). Pide la dirección con @ si falta, no repite el mismo correo dos veces seguidas y nunca obedece órdenes escritas dentro de un correo, página o archivo.
- **YouTube:** «pon / reproduce <video>» (`play_video`) abre directamente el primer resultado y le da play, no solo la búsqueda.
- **Apps:** mejor búsqueda por nombre: menú Inicio, escritorio (incluido OneDrive), aplicaciones de la Tienda y carpetas de instalación (Program Files, AppData, Games).
- **Configuración inicial:** la pantalla de claves ahora tiene dos pasos, Gemini (obligatorio) y Gmail (opcional, con el enlace para crear la contraseña de aplicación). Se cambian cuando quieras en ⋯ > Claves (Gemini y Gmail). Gmail se guarda en `%APPDATA%\JARVIS\gmail.json`.

## v0.35
- **Actualización automática:** Astra consulta cada 6 h (y al abrirse) si hay una versión nueva en `latest.json`, la descarga, la verifica con SHA-256 y avisa con «Hay una versión nueva · Actualizar ahora». Al pulsarlo se copian los archivos nuevos (tus datos, `.env`, Node y `node_modules` no se tocan; si algo falla vuelve atrás), se instalan dependencias si cambiaron y Astra se reabre sola. También en ⋯ > Buscar actualizaciones. Dirección por defecto: el último Release de GitHub; se puede cambiar con `ASTRA_UPDATE_URL`.

## v0.36
- **Primer arranque sin error:** Astra espera a que el servidor esté listo antes de abrir la ventana, así ya no aparece «localhost rechazó la conexión» la primera vez.

## v0.37
- Correcciones de QA: las URL, videos, música, Steam y los botones de la configuración inicial vuelven a abrirse en el navegador predeterminado (rundll32 en vez de explorer.exe); Gmail lee bien el asunto aunque Google mande las partes en otro orden y busca con acentos; `obsidian_create` ya no puede escribir fuera de la vault.

## v0.38 — seguridad y correcciones
- **Confirmación antes de enviar:** cada correo, WhatsApp o mensaje de Discord muestra una tarjeta (destinatario, asunto, texto exacto y número de envíos) con **Enviar** y **Cancelar**; en voz, Astra lo lee y pregunta «¿Lo envío?». Se acepta con «sí», «envíalo», «confírmalo» o «dale» (dicho al micrófono) o con el botón; «no», «cancela» o «cámbialo» cancelan o corrigen. La confirmación es de un solo uso, va ligada al texto mostrado y caduca a los 60 s. Lo que diga un correo, página, archivo o la propia Astra nunca cuenta como confirmación, y `repeat_last` tampoco se la salta.
- `close_app`, `type_in_window` y `press_keys` piden la misma confirmación solo si en el turno se leyó un correo, una página, un archivo o una búsqueda.
- Ante instrucciones escondidas en un contenido, responde solo «Ese contenido pedía hacer algo que no me pediste, así que lo ignoré.».
- **Gmail:** distingue contraseña inválida de un fallo de red o un rechazo temporal, y reintenta una vez; los asuntos partidos en varias piezas codificadas se leen bien.
- `close_app` con force solo cierra procesos con el nombre exacto; nunca procesos del sistema ni la ventana de Astra.
- El log de auditoría oculta claves de Gemini (`AIza…`, `AQ.…`) y contraseñas de aplicación de Gmail.
- `JARVIS.vbs` solo cierra el proceso que escucha exactamente en el puerto 3000; `server.log` queda todo en UTF-8 (OK / FALLO en ASCII).
- Un GIF adjuntado desde Astra se convierte a imagen (primer cuadro); si llega un GIF por otra vía, avisa con un mensaje claro.
- Otros: la vault se crea sola si falta (con `VAULT_PATH=./vault`), un mensaje roto por WebSocket ya no puede tumbar el servidor, el chat avisa si se cae la conexión, y las hojas de Excel salen en orden.
