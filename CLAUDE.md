# JARVIS — Personal AI OS (CLAUDE.md)
## Propósito
Asistente personal por voz y texto. Obsidian (`vault/`) es la memoria; Gemini Live es la voz (femenina, `GEMINI_VOICE=Aoede`); el nombre lo elige el usuario al iniciar (localStorage) y se inyecta en el prompt.
## Arquitectura
Voz/Texto → Orchestrator (`server.js`) → Context Engine (`src/vault.js: buildContext`) → Memory Engine (`memoryStore`) → Tools (`src/tools.js`) → Vault.
- Capa de voz: `public/index.html` (WebRTC) ↔ `/ws (WebSocket)` (backend reenvía SDP con la key).
- Capa cerebro: `/api/chat` y `/api/tool`; voz y texto comparten las mismas tools.
## Comandos
`npm install` · `cp .env.example .env` (poner la key) · `npm start` (abre la ventana de la app; en Windows doble clic en «Iniciar JARVIS.bat»)
## Seguridad (obligatorio)
- `GEMINI_API_KEY` solo en `.env` del backend. Nunca en frontend, vault, CLAUDE.md, logs ni Git.
- Tools con `risk` low/medium/high; medium/high exigen confirmación del usuario.
- Auditoría en `logs/audit.jsonl` con redacción de claves `sk-…`.
- Rutas de vault validadas (sin salir de `VAULT_PATH`).
## Convenciones
Markdown + frontmatter YAML + wikilinks. Contexto mínimo (≤2 KB por consulta). Modelos solo vía variables de entorno. No inventar resultados si una tool falla.
## Pendiente / roadmap
Tests (memoria, secretos en logs), AGENTS.md y agentes especializados, tareas asíncronas largas (Research Agent), índice/caché de búsqueda, calendario, morning/evening briefing, docs/ y ADRs, UI de tareas/logs.
## Control del PC (src/system.js)
Tools: open_app, open_url, play_music, media_control, set_alarm/list_alarms/cancel_alarms. Solo Windows. Solo abre accesos directos (.lnk/.url), juegos de Steam y URLs http(s) ya existentes; NO hay ejecución de comandos arbitrarios (decisión de seguridad). Alarmas en data/alarms.json, suenan solo con la app abierta (SSE /api/events). Brave: ruta autodetectada o BRAVE_PATH en .env.

## Escucha por frase (Electron)
wake.ps1 usa System.Speech de Windows (offline, gramática de una frase: hola/oye/hey/ok + nombre). main.js lanza el proceso y avisa al UI por IPC (preload.cjs). WAKE_CONFIDENCE en .env (def. 0.6) ajusta falsos positivos/negativos. Requiere un reconocedor de voz instalado en Windows (idioma español recomendado).

## Interfaz y voz (v0.4)
UI minimalista (logo en public/logo.png): pestañas Voz (solo círculo) y Chat. Onboarding: nombre del asistente, perfil (data/profile.json + memoria) y huella de voz (data/voice.json; espectro medio + tono, aproximada). Filtro de voz en el cliente: retiene el inicio de cada frase, y si no es la voz guardada envía silencio y pide al asistente el saludo de desconocido. Arranque sin consola: JARVIS.vbs; el servidor se apaga ~2 min después de cerrar la ventana.

## Escucha por frase (v0.5)
La hace el servidor (wake.ps1, System.Speech de Windows, offline) y avisa a la página por SSE; funciona en Brave/Edge/Chrome (Brave bloquea Web Speech). Frases: "hola/oye/hey/ok <nombre>" y "reconoce mi voz". WAKE_CONFIDENCE en .env ajusta sensibilidad. JARVIS.vbs abre la ventana en modo aplicación (--app) con Brave o Edge.

## v0.6
Tools nuevas: news (RSS rápido de Google News), close_app (force opcional), stop_alarm (snooze), send_message (Discord por teclado automático, riesgo high). La voz del usuario ya no se bloquea: si es Maxi dice "Hola, Creador"; si no, saludo de asistente de Maxi.

## v0.7
set_app_volume (Core Audio por proceso: afecta a todas las pestañas del navegador), ducking de navegadores/Spotify mientras hay sesión de voz (DUCK_APPS, DUCK_LEVEL), filtro de voz humana en el cliente (Modo parlantes), diagnóstico de la escucha (LOW/READY), ventana de JARVIS en Edge para separar su audio del de Brave.

## v0.8
Datos permanentes en %APPDATA%\JARVIS (perfil, voz, ajustes, alarmas y vault; migra ./data y ./vault una vez). Pendientes con detección de duplicados y paneles interactivos (/api/tasks, /api/alarm/cancel). media_control ahora usa keybd_event (antes SendKeys no enviaba teclas multimedia). close_app por WM_CLOSE a ventanas; close_tab (Ctrl+W en pestaña activa); close_music (ventana de play_music). about_me + atajo en /api/chat para "quién te creó".

## v0.9
Tools nuevas: weather (Open-Meteo, sin clave), read_page, sites_list/open_site/site_add (sitios favoritos en %APPDATA%\JARVIS\sites.json, editable), web_search con respaldo (Gemini+Google → sin razonamiento → DuckDuckGo) y errores reales en logs/audit.jsonl. La UI auto-aprueba task_create/task_complete/memory_store/weather/read_page/news. /api/version y etiqueta de versión en ⋯.

## v0.10
Huella de voz v2: distancia normalizada por la variabilidad de cada banda y tres veredictos (yes/maybe/no). "Hola, Creador" solo con yes (ajuste "Saludo al reconocerme"); saludo de desconocido solo con no; maybe = nada. Huellas antiguas (sin sd) se descartan y se pide volver a grabar. Persona: no llamar "Creador" ni asumir que habla Maxi.

## v0.11
Causa de la búsqueda fallida: Grounding con Google Search NO está en el plan gratuito de Gemini 3.x. web_search ahora usa DuckDuckGo+Bing+Google News en paralelo y lee las 2 mejores páginas (src/tools.js webSearch); wiki (Wikipedia). USE_GROUNDING=1 reactiva Google Search solo para planes de pago. /api/diag + botón Diagnóstico en ⋯. Live API: VAD con endOfSpeechSensitivity LOW y silenceDurationMs 800 (reintenta sin VAD si el servidor lo rechaza; GEMINI_VAD=0 lo desactiva). El filtro de voz humana solo actúa mientras ella habla. Umbrales de identificación: yes<=2.0, no>2.8.
