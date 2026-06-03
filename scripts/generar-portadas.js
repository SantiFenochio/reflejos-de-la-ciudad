// scripts/generar-portadas.js
// Genera una miniatura de la PRIMERA página de cada PDF de edicionImpresa,
// la sube a Sanity como image asset y la asocia al documento (campo imagenPortada).
// Resumible: omite las ediciones que ya tienen portada.
// Usa los PDFs locales de src/assets/Ediciones cuando coinciden por fecha; el resto los descarga de Sanity.
// Uso: node scripts/generar-portadas.js

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { pdf } from 'pdf-to-img';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const PROJECT_ID = 'k3agywgt';
const DATASET    = 'production';
const API_VER    = '2024-01-01';
const EDICIONES_DIR = path.join(__dirname, '..', 'src', 'assets', 'Ediciones');
const THUMB_WIDTH = 480;   // ancho de la miniatura almacenada
const JPEG_QUALITY = 72;
const DELAY_MS = 250;

const envText = fs.readFileSync(path.join(__dirname, '..', '.env'), 'utf-8');
const tokenMatch = envText.match(/^SANITY_MIGRATION_TOKEN=(.+)$/m) || envText.match(/^SANITY_API_TOKEN=(.+)$/m);
if (!tokenMatch) { console.error('ERROR: token de escritura de Sanity no encontrado en .env'); process.exit(1); }
const TOKEN = tokenMatch[1].trim();

const BASE_URL   = `https://${PROJECT_ID}.api.sanity.io/v${API_VER}`;
const ASSETS_URL = `${BASE_URL}/assets/images/${DATASET}`;
const MUTATE_URL = `${BASE_URL}/data/mutate/${DATASET}`;
const QUERY_URL  = `${BASE_URL}/data/query/${DATASET}`;

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

// Mapa fecha(YYYY-MM-DD) -> ruta local del PDF
function mapaLocal() {
  const map = {};
  if (!fs.existsSync(EDICIONES_DIR)) return map;
  for (const f of fs.readdirSync(EDICIONES_DIR)) {
    if (!f.toLowerCase().endsWith('.pdf')) continue;
    const m = f.match(/^(\d{2})-(\d{2})-(\d{2})/);
    if (!m) continue;
    const fecha = `20${m[3]}-${m[2]}-${m[1]}`;
    map[fecha] = path.join(EDICIONES_DIR, f);
  }
  return map;
}

async function listarEdiciones() {
  const q = `*[_type=="edicionImpresa"]{_id, fecha, titulo, "pdfUrl": archivoPdf.asset->url, "tienePortada": defined(imagenPortada)} | order(fecha desc)`;
  const res = await fetch(`${QUERY_URL}?query=${encodeURIComponent(q)}`, { headers: { Authorization: `Bearer ${TOKEN}` } });
  if (!res.ok) throw new Error(`Query HTTP ${res.status} — ${await res.text()}`);
  return (await res.json()).result || [];
}

async function obtenerPdfBuffer(ed, local) {
  if (local[ed.fecha]) return fs.readFileSync(local[ed.fecha]);
  if (!ed.pdfUrl) throw new Error('sin pdfUrl ni archivo local');
  const res = await fetch(ed.pdfUrl);
  if (!res.ok) throw new Error(`descarga PDF HTTP ${res.status}`);
  return Buffer.from(await res.arrayBuffer());
}

async function renderPortada(pdfBuffer) {
  const doc = await pdf(pdfBuffer, { scale: 1.5 });
  for await (const page of doc) {
    return sharp(page).resize({ width: THUMB_WIDTH }).jpeg({ quality: JPEG_QUALITY, mozjpeg: true }).toBuffer();
  }
  throw new Error('PDF sin páginas');
}

async function subirImagen(buffer, filename) {
  const res = await fetch(ASSETS_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${TOKEN}`,
      'Content-Type': 'image/jpeg',
      'Content-Disposition': `inline; filename="${filename}"`,
    },
    body: buffer,
  });
  if (!res.ok) throw new Error(`asset HTTP ${res.status} — ${await res.text()}`);
  return (await res.json()).document._id;
}

async function asociarPortada(docId, assetId) {
  const mutations = [{
    patch: {
      id: docId,
      set: { imagenPortada: { _type: 'image', asset: { _type: 'reference', _ref: assetId } } },
    },
  }];
  const res = await fetch(MUTATE_URL, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ mutations }),
  });
  if (!res.ok) throw new Error(`mutate HTTP ${res.status} — ${await res.text()}`);
}

async function main() {
  const local = mapaLocal();
  const todas = await listarEdiciones();
  const pendientes = todas.filter(e => !e.tienePortada && (e.pdfUrl || local[e.fecha]));

  console.log(`\n📋 ${todas.length} ediciones | ${pendientes.length} sin portada a procesar\n`);

  let ok = 0, err = 0;
  const errores = [];

  for (let i = 0; i < pendientes.length; i++) {
    const ed = pendientes[i];
    const fuente = local[ed.fecha] ? 'local' : 'sanity';
    process.stdout.write(`[${i + 1}/${pendientes.length}] ${ed.fecha} ${ed.titulo || ''} (${fuente})… `);
    try {
      const pdfBuffer = await obtenerPdfBuffer(ed, local);
      const jpg = await renderPortada(pdfBuffer);
      const assetId = await subirImagen(jpg, `portada-${ed.fecha}.jpg`);
      await asociarPortada(ed._id, assetId);
      ok++;
      console.log(`✓ ${(jpg.length / 1024).toFixed(0)}KB`);
    } catch (e) {
      err++;
      errores.push({ fecha: ed.fecha, error: e.message });
      console.log(`✗ ${e.message}`);
    }
    if (i < pendientes.length - 1) await sleep(DELAY_MS);
  }

  console.log('\n══════════════════════════════════════════');
  console.log(`RESULTADO: ${ok} portadas creadas | ${err} fallidas`);
  if (errores.length) {
    fs.writeFileSync(path.join(__dirname, 'errores-portadas.json'), JSON.stringify(errores, null, 2));
    errores.slice(0, 20).forEach(e => console.log(`  - ${e.fecha}: ${e.error}`));
  }
  console.log('══════════════════════════════════════════\n');
}

main().catch(e => { console.error('Error fatal:', e); process.exit(1); });
