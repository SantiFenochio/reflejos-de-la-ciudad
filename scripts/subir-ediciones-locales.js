// scripts/subir-ediciones-locales.js
// Sube ediciones impresas (PDFs locales) a Sanity y crea los documentos edicionImpresa.
// Lee los PDFs de src/assets/Ediciones (nombre = fecha de edición DD-MM-YY).
// Uso: node scripts/subir-ediciones-locales.js

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ── Configuración ──────────────────────────────────────────────
const PROJECT_ID = 'k3agywgt';
const DATASET    = 'production';
const API_VER    = '2024-01-01';
const EDICIONES_DIR = path.join(__dirname, '..', 'src', 'assets', 'Ediciones');
const DELAY_MS   = 600;

// Leer token del .env
const envText = fs.readFileSync(path.join(__dirname, '..', '.env'), 'utf-8');
const tokenMatch = envText.match(/^SANITY_MIGRATION_TOKEN=(.+)$/m)
  || envText.match(/^SANITY_API_TOKEN=(.+)$/m)
  || envText.match(/^SANITY_TOKEN=(.+)$/m);
if (!tokenMatch) { console.error('ERROR: token de escritura de Sanity no encontrado en .env'); process.exit(1); }
const TOKEN = tokenMatch[1].trim();

const BASE_URL   = `https://${PROJECT_ID}.api.sanity.io/v${API_VER}`;
const ASSETS_URL = `${BASE_URL}/assets/files/${DATASET}`;
const MUTATE_URL = `${BASE_URL}/data/mutate/${DATASET}`;
const QUERY_URL  = `${BASE_URL}/data/query/${DATASET}`;

const MESES = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// "03-04-26.pdf" / "01-05-26-1.pdf"  ->  { fecha: '2026-04-03', titulo: '3 de abril de 2026' }
function parseNombre(filename) {
  const m = filename.match(/^(\d{2})-(\d{2})-(\d{2})/);
  if (!m) return null;
  const dia  = Number(m[1]);
  const mes  = Number(m[2]);
  const anio = 2000 + Number(m[3]);
  const fecha  = `${anio}-${String(mes).padStart(2,'0')}-${String(dia).padStart(2,'0')}`;
  const titulo = `${dia} de ${MESES[mes-1]} de ${anio}`;
  return { fecha, titulo };
}

async function existeEdicion(fecha) {
  const q = `count(*[_type=="edicionImpresa" && fecha=="${fecha}"])`;
  const res = await fetch(`${QUERY_URL}?query=${encodeURIComponent(q)}`, {
    headers: { Authorization: `Bearer ${TOKEN}` },
  });
  const data = await res.json();
  return (data.result || 0) > 0;
}

async function subirAsset(buffer, filename) {
  const res = await fetch(ASSETS_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${TOKEN}`,
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
    body: buffer,
  });
  if (!res.ok) throw new Error(`Asset HTTP ${res.status} — ${await res.text()}`);
  const data = await res.json();
  return data.document._id;
}

async function crearDocumento(titulo, fecha, assetId) {
  const doc = {
    _type: 'edicionImpresa',
    titulo,
    fecha,
    archivoPdf: { _type: 'file', asset: { _type: 'reference', _ref: assetId } },
  };
  const res = await fetch(MUTATE_URL, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ mutations: [{ create: doc }] }),
  });
  if (!res.ok) throw new Error(`Mutate HTTP ${res.status} — ${await res.text()}`);
  return res.json();
}

async function main() {
  const archivos = fs.readdirSync(EDICIONES_DIR)
    .filter(f => f.toLowerCase().endsWith('.pdf'))
    .map(f => ({ filename: f, ...parseNombre(f) }))
    .filter(e => e.fecha)
    .sort((a, b) => a.fecha.localeCompare(b.fecha)); // antiguo -> reciente

  console.log(`\n📋 ${archivos.length} PDFs detectados en ${EDICIONES_DIR}\n`);

  let ok = 0, err = 0, skip = 0;
  const errores = [];

  for (let i = 0; i < archivos.length; i++) {
    const { filename, fecha, titulo } = archivos[i];
    console.log(`[${i+1}/${archivos.length}] ${filename}  →  "${titulo}" (${fecha})`);

    try {
      if (await existeEdicion(fecha)) {
        skip++;
        console.log(`         ↪️  Ya existe una edición con fecha ${fecha} — omitida`);
        continue;
      }
      const buffer = fs.readFileSync(path.join(EDICIONES_DIR, filename));
      const assetId = await subirAsset(buffer, filename);
      await crearDocumento(titulo, fecha, assetId);
      ok++;
      console.log(`         ✓ OK — asset: ${assetId}`);
    } catch (e) {
      err++;
      errores.push({ filename, error: e.message });
      console.error(`         ✗ FALLO: ${e.message}`);
    }
    if (i < archivos.length - 1) await sleep(DELAY_MS);
  }

  console.log('\n══════════════════════════════════════════');
  console.log(`RESULTADO: ${ok} creadas | ${skip} omitidas | ${err} fallidas`);
  if (errores.length) errores.forEach(e => console.log(`  - ${e.filename}: ${e.error}`));
  console.log('══════════════════════════════════════════\n');
}

main().catch(e => { console.error('Error fatal:', e); process.exit(1); });
