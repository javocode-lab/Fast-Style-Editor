// Proxy: descarga la página, inyecta inspector.js y la sirve en mismo origen
// para que el editor pueda leer y modificar su DOM dentro del iframe.
import express from 'express';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 4000;

app.get('/inspector.js', (_req, res) => {
  res.type('js').send(fs.readFileSync(path.join(__dirname, '../public/inspector.js')));
});

app.get('/proxy', async (req, res) => {
  try {
    const target = new URL(req.query.url);
    const r = await fetch(target, { headers: { 'user-agent': 'Mozilla/5.0 StyleInspector' } });
    const ct = r.headers.get('content-type') || '';
    if (!ct.includes('text/html')) {
      res.set('content-type', ct);
      return res.send(Buffer.from(await r.arrayBuffer()));
    }
    let html = await r.text();
    const inject = `<base href="${target.href}"><script src="http://localhost:${PORT}/inspector.js"></script>`;
    html = /<head[^>]*>/i.test(html) ? html.replace(/<head[^>]*>/i, (m) => m + inject) : inject + html;
    res.set('content-type', 'text/html; charset=utf-8').send(html);
  } catch (e) {
    res.status(400).send('No se pudo cargar la URL: ' + e.message);
  }
});

const dist = path.join(__dirname, '../dist');
if (fs.existsSync(dist)) app.use(express.static(dist));

app.listen(PORT, () => console.log(`Server en http://localhost:${PORT}`));
