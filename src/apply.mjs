// Aplicador de actualizaciones (proceso aparte): espera a que Astra se cierre, copia los archivos nuevos
// (con copia de seguridad y vuelta atrás si algo falla), instala dependencias si cambiaron y reabre Astra.
import fs from 'fs'; import path from 'path'; import os from 'os'; import { spawn, spawnSync } from 'child_process';
const [root, stage, pid] = process.argv.slice(2);
const SKIP = new Set(['node', 'node_modules', 'logs', '.env', 'data', 'vault', 'Astra.lnk', 'unins000.exe']);
const log = m => { try { fs.appendFileSync(path.join(root, 'logs', 'update.log'), new Date().toISOString() + ' ' + m + '\n'); } catch {} };
const alive = p => { try { process.kill(+p, 0); return true; } catch { return false; } };
for (let i = 0; i < 40 && alive(pid); i++) await new Promise(r => setTimeout(r, 250));
const files = (d, rel = '') => fs.readdirSync(d, { withFileTypes: true }).flatMap(e => e.isDirectory() ? files(path.join(d, e.name), path.join(rel, e.name)) : [path.join(rel, e.name)]);
const bak = fs.mkdtempSync(path.join(os.tmpdir(), 'astra-bak-')), done = [];
try {
  const oldPkg = (() => { try { return fs.readFileSync(path.join(root, 'package.json'), 'utf8'); } catch { return ''; } })();
  for (const rel of files(stage)) {
    if (SKIP.has(rel.split(path.sep)[0])) continue;
    const to = path.join(root, rel), from = path.join(stage, rel);
    if (fs.existsSync(to)) { fs.mkdirSync(path.dirname(path.join(bak, rel)), { recursive: true }); fs.copyFileSync(to, path.join(bak, rel)); }
    fs.mkdirSync(path.dirname(to), { recursive: true }); fs.copyFileSync(from, to); done.push(rel);
  }
  const newPkg = fs.readFileSync(path.join(root, 'package.json'), 'utf8'), dep = s => { try { return JSON.stringify(JSON.parse(s).dependencies); } catch { return ''; } };
  if (dep(oldPkg) !== dep(newPkg)) {
    const npmCli = path.join(root, 'node', 'node_modules', 'npm', 'bin', 'npm-cli.js');
    const r = fs.existsSync(npmCli) ? spawnSync(process.execPath, [npmCli, 'install', '--omit=dev', '--no-audit', '--no-fund'], { cwd: root, windowsHide: true }) : spawnSync('npm', ['install', '--omit=dev', '--no-audit', '--no-fund'], { cwd: root, shell: true, windowsHide: true });
    if (r.status !== 0) throw new Error('npm install falló');
  }
  log('actualizado: ' + done.length + ' archivos');
  try { fs.rmSync(path.dirname(stage), { recursive: true, force: true }); } catch {}
} catch (e) {
  log('ERROR, vuelvo atrás: ' + e.message);
  for (const rel of done) { const b = path.join(bak, rel); try { fs.existsSync(b) ? fs.copyFileSync(b, path.join(root, rel)) : fs.rmSync(path.join(root, rel), { force: true }); } catch {} }
  try { fs.rmSync(path.dirname(stage), { recursive: true, force: true }); } catch {}
}
try { fs.rmSync(bak, { recursive: true, force: true }); } catch {}
if (process.platform === 'win32' && !process.env.ASTRA_NO_RELAUNCH) spawn('wscript.exe', [path.join(root, 'JARVIS.vbs'), 'reinicio'], { cwd: root, detached: true, stdio: 'ignore' }).unref();
else if (!process.env.ASTRA_NO_RELAUNCH) spawn(process.execPath, ['server.js'], { cwd: root, detached: true, stdio: 'ignore' }).unref();
