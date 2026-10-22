// Vault (Obsidian) + Memory Engine + Context Engine + auditoría. Solo Markdown estándar.
import fs from 'fs'; import path from 'path'; import { VAULT_DIR } from './paths.js';
export const VAULT = VAULT_DIR;
const safe = p => { const f = path.resolve(VAULT, p); if (f !== VAULT && !f.startsWith(VAULT + path.sep)) throw new Error('Ruta fuera de la vault'); return f; };
const walk = d => fs.readdirSync(d, { withFileTypes: true }).flatMap(e =>
  e.name.startsWith('.') ? [] : e.isDirectory() ? walk(path.join(d, e.name)) : e.name.endsWith('.md') ? [path.join(d, e.name)] : []);
export function search(query, limit = 5) {
  const words = query.toLowerCase().split(/\W+/).filter(w => w.length > 2);
  return walk(VAULT).map(f => {
    const t = fs.readFileSync(f, 'utf8'), l = t.toLowerCase();
    const score = words.reduce((s, w) => s + (l.split(w).length - 1) + (f.toLowerCase().includes(w) ? 5 : 0), 0);
    const i = Math.max(0, l.indexOf(words.find(w => l.includes(w)) || ''));
    return { path: path.relative(VAULT, f), score, snippet: t.slice(Math.max(0, i - 80), i + 320) };
  }).filter(r => r.score > 0).sort((a, b) => b.score - a.score).slice(0, limit);
}
export const read = p => fs.readFileSync(safe(p), 'utf8').slice(0, 4000);
export function write(p, content, append = false) {
  const f = safe(p); fs.mkdirSync(path.dirname(f), { recursive: true });
  append ? fs.appendFileSync(f, '\n' + content) : fs.writeFileSync(f, content); return p;
}
// Memoria: una línea por dato "- [categoria|importancia|fecha] texto". Evita duplicados (>=70% de palabras en común) actualizando la existente.
const MEM = '07-Memory/Memoria.md', nrm = t => t.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9 ]/g, ' ').split(' ').filter(w => w.length > 2);
export const memLines = () => { try { return fs.readFileSync(safe(MEM), 'utf8').split('\n').filter(l => l.startsWith('- [')); } catch { return []; } };
const saveMem = ls => write(MEM, '# Memoria de JARVIS\n\n' + ls.join('\n') + '\n');
export function memoryStore(text, category = 'general', importance = 3) {
  const ls = memLines(), w = new Set(nrm(text)), line = `- [${category || 'general'}|${Math.min(5, Math.max(1, Math.round(importance) || 3))}|${new Date().toISOString().slice(0, 10)}] ${text}`;
  const i = ls.findIndex(l => { const o = new Set(nrm(l.replace(/^- \[[^\]]*\]/, ''))); return [...w].filter(x => o.has(x)).length / Math.max(1, Math.min(w.size, o.size)) >= 0.7; });
  i >= 0 ? ls[i] = line : ls.push(line); saveMem(ls); return i >= 0 ? { updated: text } : { saved: text };
}
export function memoryForget(q) { const w = nrm(q); if (!w.length) return { error: 'Indica qué olvidar' }; const ls = memLines(), keep = ls.filter(l => !w.every(x => nrm(l).includes(x))); saveMem(keep); return { removed: ls.length - keep.length }; }
export const memorySearch = q => { const w = nrm(q); return memLines().map(l => ({ l, s: w.filter(x => nrm(l).includes(x)).length })).filter(x => x.s).sort((a, b) => b.s - a.s).slice(0, 8).map(x => x.l); };
export const topMemories = (n = 12) => memLines().sort((a, b) => (+b.match(/\|(\d)\|/)?.[1] || 0) - (+a.match(/\|(\d)\|/)?.[1] || 0) || b.localeCompare(a)).slice(0, n).map(l => l.replace(/^- \[[^\]]*\] /, ''));
// Context Engine: solo fragmentos relevantes, máx ~2 KB
export const buildContext = q => search(q, 3).map(r => `[[${r.path}]] ${r.snippet.replace(/\s+/g, ' ')}`).join('\n').slice(0, 2000);
export const secrets = new Set(); // claves reales en memoria (Gemini, Gmail) que nunca deben llegar a los logs
const SECRET_RX = /sk-[\w-]{10,}|AIza[\w-]{20,}|AQ\.[\w.-]{10,}|\b[a-z]{4} [a-z]{4} [a-z]{4} [a-z]{4}\b|\b[a-z]{16}\b/g; // OpenAI, Gemini, contraseña de aplicación de Gmail
export const redactAll = t => { t = String(t); for (const k of [process.env.GEMINI_API_KEY, process.env.GMAIL_APP_PASSWORD, ...secrets]) if (k && k.length >= 8) t = t.split(k).join('[REDACTED]'); return t.replace(SECRET_RX, '[REDACTED]'); };
export function audit(entry) {
  const clean = redactAll(JSON.stringify({ ts: new Date().toISOString(), ...entry }));
  fs.mkdirSync('logs', { recursive: true }); fs.appendFileSync('logs/audit.jsonl', clean + '\n');
}

// ---- Pendientes: "- [ ] título 📅 fecha <!--c:creado-->" en 06-Tasks/Tareas.md (con detección de duplicados) ----
const TF = '06-Tasks/Tareas.md';
const taskLines = () => { try { return fs.readFileSync(safe(TF), 'utf8').split('\n'); } catch { return []; } };
const parseT = (l, i) => { const m = l.match(/^- \[( |x)\] (.*?)(?: 📅 (\S+(?: \d\d:\d\d)?))?(?: <!--c:(.*?)-->)?\s*$/); return m ? { i, done: m[1] === 'x', title: m[2].trim(), due: m[3] || '', created: m[4] || '' } : null; };
export const tasks = () => taskLines().map(parseT).filter(Boolean);
const simil = (a, b) => { const x = new Set(nrm(a)), y = new Set(nrm(b)); return [...x].filter(w => y.has(w)).length / Math.max(1, Math.min(x.size, y.size)); };
export function taskAdd(title, due, force) {
  const dup = tasks().find(t => !t.done && simil(title, t.title) >= 0.7);
  if (dup && !force) return { duplicate: true, existing: dup.title + (dup.due ? ' (para ' + dup.due + ')' : ''), created: dup.created, nota: 'NO se creó. Avisa al usuario que ya tiene ese pendiente y pregunta si lo agrega igual (force=true)' };
  write(TF, `- [ ] ${title}${due ? ` 📅 ${due}` : ''} <!--c:${new Date().toISOString()}-->`, true); return { created: title };
}
export function taskSet(i, op) { const ls = taskLines(); if (!ls[i] || !parseT(ls[i], i)) return { error: 'No existe ese pendiente' }; op === 'delete' ? ls.splice(i, 1) : ls[i] = ls[i].replace('- [ ]', '- [x]'); write(TF, ls.join('\n')); return { ok: true }; }
export const taskMatch = q => { const w = nrm(q); return tasks().filter(t => !t.done && w.length && w.every(x => nrm(t.title).includes(x))); };
export function taskDedupe() { const seen = new Set(), ls = taskLines(), out = ls.filter((l, i) => { const t = parseT(l, i); if (!t || t.done) return true; const k = nrm(t.title).join(' '); if (seen.has(k)) return false; seen.add(k); return true; }); write(TF, out.join('\n')); return { removed: ls.length - out.length }; }
