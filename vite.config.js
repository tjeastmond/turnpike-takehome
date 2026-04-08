import path from 'node:path';
import { mkdir, writeFile, readdir, readFile, stat } from 'node:fs/promises';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const SAVES_DIR = () => path.resolve(process.cwd(), 'saves');

async function listJsonBasenamesInSaves() {
  try {
    const names = await readdir(SAVES_DIR());
    return names.filter((n) => /^[\w.-]+\.json$/i.test(n));
  } catch {
    return [];
  }
}

/** Same shape check as the app: non-empty JSON with object `inputs` and `calculations`. */
function isValidTaxExportContentsString(contents) {
  if (typeof contents !== 'string' || contents.trim() === '') return false;
  let parsed;
  try {
    parsed = JSON.parse(contents);
  } catch {
    return false;
  }
  if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) return false;
  const { inputs, calculations } = parsed;
  if (inputs === null || typeof inputs !== 'object' || Array.isArray(inputs)) return false;
  if (calculations === null || typeof calculations !== 'object' || Array.isArray(calculations)) return false;
  return true;
}

/** Next 1-based index for `NNN_*.json` names (max existing NNN + 1, or 1 if none). */
async function getNextNumberedSaveIndex() {
  const names = await listJsonBasenamesInSaves();
  let max = 0;
  for (const name of names) {
    const m = /^(\d{3})_/i.exec(name);
    if (m) {
      const n = parseInt(m[1], 10);
      if (!Number.isNaN(n) && n > max) max = n;
    }
  }
  return max + 1;
}

function isSafeJsonBasename(filename) {
  const safeName = path.basename(filename);
  return safeName === filename && /^[\w.-]+\.json$/i.test(safeName);
}

/** Writes JSON snapshots from the app into ./saves (dev + preview only). */
function taxSavePlugin() {
  function createMiddleware() {
    return async (req, res, next) => {
      const rawUrl = req.url ?? '';
      const urlPath = rawUrl.split('?')[0] ?? '';

      if (urlPath === '/__tax-saves-list' && req.method === 'GET') {
        try {
          const savesDir = SAVES_DIR();
          const jsonFiles = await listJsonBasenamesInSaves();
          const withStat = await Promise.all(
            jsonFiles.map(async (name) => {
              const full = path.join(savesDir, name);
              const st = await stat(full);
              return { name, mtimeMs: st.mtimeMs };
            })
          );
          withStat.sort((a, b) => b.mtimeMs - a.mtimeMs);
          const files = withStat.slice(0, 10);
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ files }));
        } catch (e) {
          res.statusCode = 500;
          res.end(e instanceof Error ? e.message : 'List failed');
        }
        return;
      }

      if (urlPath === '/__tax-saves-read' && req.method === 'GET') {
        try {
          const q = new URL(rawUrl, 'http://localhost').searchParams;
          const filename = q.get('filename');
          if (typeof filename !== 'string' || !isSafeJsonBasename(filename)) {
            res.statusCode = 400;
            res.end('Invalid filename');
            return;
          }
          const full = path.join(SAVES_DIR(), filename);
          const contents = await readFile(full, 'utf8');
          res.setHeader('Content-Type', 'application/json; charset=utf-8');
          res.end(contents);
        } catch (e) {
          const code = e && typeof e === 'object' && 'code' in e && e.code === 'ENOENT' ? 404 : 500;
          res.statusCode = code;
          res.end(e instanceof Error ? e.message : 'Read failed');
        }
        return;
      }

      if (urlPath === '/__tax-saves-next-index' && req.method === 'GET') {
        try {
          const nextIndex = await getNextNumberedSaveIndex();
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ nextIndex }));
        } catch (e) {
          res.statusCode = 500;
          res.end(e instanceof Error ? e.message : 'Next index failed');
        }
        return;
      }

      if (urlPath !== '/__tax-save' || req.method !== 'POST') {
        next();
        return;
      }
      try {
        const chunks = [];
        for await (const chunk of req) {
          chunks.push(chunk);
          if (Buffer.concat(chunks).length > 2_000_000) {
            res.statusCode = 413;
            res.end('Payload too large');
            return;
          }
        }
        const body = Buffer.concat(chunks).toString('utf8');
        const parsed = JSON.parse(body);
        const { filename, contents } = parsed;
        if (typeof filename !== 'string' || typeof contents !== 'string') {
          res.statusCode = 400;
          res.end('Invalid body: expected filename and contents strings');
          return;
        }
        const safeName = path.basename(filename);
        if (safeName !== filename || !/^[\w.-]+\.json$/i.test(safeName)) {
          res.statusCode = 400;
          res.end('Invalid filename');
          return;
        }
        if (!isValidTaxExportContentsString(contents)) {
          res.statusCode = 400;
          res.end('Invalid contents: expected non-empty tax export JSON with inputs and calculations');
          return;
        }
        const savesDir = SAVES_DIR();
        await mkdir(savesDir, { recursive: true });
        await writeFile(path.join(savesDir, safeName), contents, 'utf8');
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ ok: true, relativePath: `saves/${safeName}` }));
      } catch (e) {
        res.statusCode = 500;
        res.end(e instanceof Error ? e.message : 'Save failed');
      }
    };
  }
  return {
    name: 'tax-calculator-save',
    configureServer(server) {
      server.middlewares.use(createMiddleware());
    },
    configurePreviewServer(server) {
      server.middlewares.use(createMiddleware());
    },
  };
}

export default defineConfig({
  plugins: [react(), taxSavePlugin()],
  server: {
    port: 4000,
  },
  test: {
    globals: true,
    environment: 'jsdom',
    passWithNoTests: true,
  },
});