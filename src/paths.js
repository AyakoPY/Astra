// Carpeta de datos PERMANENTE (sobrevive a reinstalar o descomprimir en otra carpeta): %APPDATA%\JARVIS
import fs from 'fs'; import path from 'path'; import os from 'os';
export const DATA = process.env.JARVIS_DATA || path.join(process.env.APPDATA || path.join(os.homedir(), '.config'), 'JARVIS');
fs.mkdirSync(DATA, { recursive: true });
for (const f of ['profile.json', 'voice.json', 'alarms.json', 'settings.json']) { const o = path.resolve('data', f), n = path.join(DATA, f); try { if (fs.existsSync(o) && !fs.existsSync(n)) fs.copyFileSync(o, n); } catch {} } // migración única desde ./data
export const dp = f => path.join(DATA, f);
export const VAULT_DIR = path.resolve(process.env.VAULT_PATH || path.join(DATA, 'vault'));
if (!process.env.VAULT_PATH && !fs.existsSync(VAULT_DIR)) { try { fs.cpSync(path.resolve('vault'), VAULT_DIR, { recursive: true }); } catch { fs.mkdirSync(VAULT_DIR, { recursive: true }); } }
try { fs.mkdirSync(VAULT_DIR, { recursive: true }); } catch {} // con VAULT_PATH=./vault (del .env.example) y sin carpeta, la búsqueda fallaba
