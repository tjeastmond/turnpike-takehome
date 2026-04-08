import path from 'node:path';
import { mkdir, writeFile } from 'node:fs/promises';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

/** Writes JSON snapshots from the app into ./saves (dev + preview only). */
function taxSavePlugin() {
  function createMiddleware() {
    return async (req, res, next) => {
      const url = req.url?.split('?')[0] ?? '';
      if (url !== '/__tax-save' || req.method !== 'POST') {
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
        const savesDir = path.resolve(process.cwd(), 'saves');
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
  },
});