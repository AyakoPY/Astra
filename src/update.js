// Actualización automática: consulta latest.json (el mismo que usa el instalador), descarga la versión nueva,
// la verifica con SHA-256 y la deja lista; con «Reiniciar» (o al volver a abrir) se copia sobre la instalación
// sin tocar tus datos, .env, node ni node_modules, y Astra se reabre sola.
import fs from 'fs'; import path from 'path'; import zlib from 'zlib'; import crypto from 'crypto'; import { spawn } from 'child_process'; import { fileURLToPath } from 'url';
import { dp } from './paths.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const URL0 = process.env.ASTRA_UPDATE_URL || 'https://github.com/AyakoPY/Astra/releases/latest/download/latest.json';
const STAGE = dp('update'), READY = path.join(STAGE, 'ready.json');
const MAX = 150 * 1024 * 1024;
const num = v => String(v || '0').replace(/^v\.?/i, '').split('.').map(x => parseInt(x, 10) || 0);
export const newer = (a, b) => { const x = num(a), y = num(b); for (let i = 0; i < Math.max(x.length, y.length); i++) { if ((x[i] || 0) !== (y[i] || 0)) return (x[i] || 0) > (y[i] || 0); } return false; };

export function extractZip(buf, dest) { // extrae un zip (índice central), protegido contra rutas fuera de la carpeta
  const e = buf.lastIndexOf(Buffer.from([0x50, 0x4b, 5, 6])); if (e < 0) throw new Error('zip inválido');
  const n = buf.readUInt16LE(e + 10); let p = buf.readUInt32LE(e + 16), count = 0; const base = path.resolve(dest);
  for (let i = 0; i < n && buf.readUInt32LE(p) === 0x02014b50; i++) {
    const meth = buf.readUInt16LE(p + 10), csz = buf.readUInt32LE(p + 20), nl = buf.readUInt16LE(p + 28), xl = buf.readUInt16LE(p + 30), cl = buf.readUInt16LE(p + 32), off = buf.readUInt32LE(p + 42);
    const name = buf.slice(p + 46, p + 46 + nl).toString('utf8'); p += 46 + nl + xl + cl;
    const out = path.resolve(base, name); if (out !== base && !out.startsWith(base + path.sep)) throw new Error('ruta no permitida en el zip');
    if (name.endsWith('/')) { fs.mkdirSync(out, { recursive: true }); continue; }
    const lnl = buf.readUInt16LE(off + 26), lxl = buf.readUInt16LE(off + 28), ds = off + 30 + lnl + lxl, raw = buf.slice(ds, ds + csz);
    const data = meth === 0 ? raw : meth === 8 ? zlib.inflateRawSync(raw) : null; if (!data) throw new Error('compresión no soportada');
    fs.mkdirSync(path.dirname(out), { recursive: true }); fs.writeFileSync(out, data); count++;
  }
  return count;
}

let state = { current: '', ready: null, checking: false, error: '', last: 0 };
const readReady = () => { try { return JSON.parse(fs.readFileSync(READY, 'utf8')); } catch { return null; } };

export async function checkUpdate(current, { force = false } = {}) {
  state.current = current;
  const rd = readReady(); if (rd && !newer(rd.version, current)) { try { fs.rmSync(STAGE, { recursive: true, force: true }); } catch {} state.ready = null; } else if (rd) state.ready = rd.version;
  if (state.checking || (state.ready && !force)) return status();
  state.checking = true; state.error = '';
  try {
    const mu = new URL(URL0); if (mu.protocol !== 'https:' && !/^(localhost|127\.0\.0\.1)$/.test(mu.hostname)) throw new Error('la dirección de actualización debe ser https');
    const r = await fetch(mu, { signal: AbortSignal.timeout(15000) }); if (!r.ok) throw new Error('manifiesto HTTP ' + r.status);
    const m = await r.json(); state.last = Date.now();
    if (!m.version || !m.url || !/^[a-f0-9]{64}$/i.test(m.sha256 || '')) throw new Error('manifiesto incompleto');
    if (!newer(m.version, current)) return status();
    if (state.ready && !newer(m.version, state.ready)) return status();
    const zu = new URL(m.url, mu); if (zu.protocol !== 'https:' && !/^(localhost|127\.0\.0\.1)$/.test(zu.hostname)) throw new Error('descarga no https');
    const z = await fetch(zu, { signal: AbortSignal.timeout(180000) }); if (!z.ok) throw new Error('descarga HTTP ' + z.status);
    const buf = Buffer.from(await z.arrayBuffer()); if (buf.length > MAX) throw new Error('archivo demasiado grande');
    if (crypto.createHash('sha256').update(buf).digest('hex') !== m.sha256.toLowerCase()) throw new Error('la verificación SHA-256 no coincide');
    fs.rmSync(STAGE, { recursive: true, force: true }); const dir = path.join(STAGE, 'files'); fs.mkdirSync(dir, { recursive: true });
    extractZip(buf, dir); if (!fs.existsSync(path.join(dir, 'server.js'))) throw new Error('el paquete no trae server.js');
    fs.writeFileSync(READY, JSON.stringify({ version: String(m.version), dir })); state.ready = String(m.version);
  } catch (e) { state.error = String(e.message || e).slice(0, 160); }
  finally { state.checking = false; }
  return status();
}
export const status = () => ({ current: state.current, ready: state.ready, checking: state.checking, error: state.error, last: state.last });

export function applyNow(port) { // lanza el aplicador (proceso aparte) y devuelve true; el llamante debe cerrar el servidor
  const rd = readReady(); if (!rd || !newer(rd.version, state.current)) return false;
  const child = spawn(process.execPath, [path.join(ROOT, 'src', 'apply.mjs'), ROOT, rd.dir, String(process.pid), String(port)], { detached: true, stdio: 'ignore', windowsHide: true, cwd: ROOT }); child.unref(); return true;
}
