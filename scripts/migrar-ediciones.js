// scripts/migrar-ediciones.js
// Migra ediciones impresas (PDFs) a Sanity desde el sitio viejo
// Uso: node scripts/migrar-ediciones.js

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ── Configuración ──────────────────────────────────────────────
const PROJECT_ID = 'k3agywgt';
const DATASET    = 'production';
const API_VER    = '2024-01-01';

// Leer token del .env manualmente (sin dotenv)
const envPath  = path.join(__dirname, '..', '.env');
const envText  = fs.readFileSync(envPath, 'utf-8');
const tokenMatch = envText.match(/^SANITY_TOKEN=(.+)$/m);
if (!tokenMatch) { console.error('ERROR: SANITY_TOKEN no encontrado en .env'); process.exit(1); }
const TOKEN = tokenMatch[1].trim();

// ── Constantes de la API ───────────────────────────────────────
const BASE_URL     = `https://${PROJECT_ID}.api.sanity.io/v${API_VER}`;
const ASSETS_URL   = `${BASE_URL}/assets/files/${DATASET}`;
const MUTATE_URL   = `${BASE_URL}/data/mutate/${DATASET}`;
const DELAY_MS     = 500;
const FECHA_CORTE  = '2026-03-13';  // excluir >= esta fecha (ya están en Sanity)

// ── Helpers ────────────────────────────────────────────────────
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function descargarPDF(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} al descargar ${url}`);
  return Buffer.from(await res.arrayBuffer());
}

async function subirAsset(buffer, filename) {
  const res = await fetch(ASSETS_URL, {
    method:  'POST',
    headers: {
      'Authorization':  `Bearer ${TOKEN}`,
      'Content-Type':   'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
    body: buffer,
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Error subiendo asset: HTTP ${res.status} — ${txt}`);
  }
  const data = await res.json();
  return data.document._id;   // e.g. "file-abc123-pdf"
}

async function crearDocumento(titulo, fecha, assetId) {
  const doc = {
    _type:      'edicionImpresa',
    titulo,
    fecha,
    archivoPdf: {
      _type: 'file',
      asset: { _type: 'reference', _ref: assetId },
    },
  };
  const body = JSON.stringify({ mutations: [{ create: doc }] });
  const res  = await fetch(MUTATE_URL, {
    method:  'POST',
    headers: {
      'Authorization': `Bearer ${TOKEN}`,
      'Content-Type':  'application/json',
    },
    body,
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Error creando documento: HTTP ${res.status} — ${txt}`);
  }
  return await res.json();
}

// ── Main ───────────────────────────────────────────────────────
async function main() {
  // 1. Leer JSON
  const jsonPath = path.join(__dirname, 'ediciones.json');
  const todas    = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));

  // 2. Filtrar: excluir fecha >= FECHA_CORTE
  const pendientes = todas.filter(e => e.fecha && e.fecha < FECHA_CORTE);
  // Ya vienen en orden DESC (más reciente primero) — mantener ese orden
  
  const total = pendientes.length;
  console.log(`\n📋 Total a migrar: ${total} ediciones (excluidas >= ${FECHA_CORTE})`);
  console.log(`🕐 Tiempo estimado: ~${Math.ceil(total * 0.5 / 60)} min\n`);

  let ok  = 0;
  let err = 0;
  const errores = [];

  for (let i = 0; i < pendientes.length; i++) {
    const ed       = pendientes[i];
    const num      = i + 1;
    const filename = ed.url.split('/').pop();   // e.g. "17442026.pdf"

    console.log(`[${num}/${total}] Subiendo: ${ed.titulo} (${filename})`);

    try {
      // Descargar PDF
      const buffer  = await descargarPDF(ed.url);

      // Subir a Sanity Assets
      const assetId = await subirAsset(buffer, filename);

      // Crear documento edicionImpresa
      await crearDocumento(ed.titulo, ed.fecha, assetId);

      ok++;
      console.log(`         ✓ OK — asset: ${assetId}`);
    } catch (e) {
      err++;
      errores.push({ titulo: ed.titulo, url: ed.url, error: e.message });
      console.error(`         ✗ FALLO: ${e.message}`);
    }

    // Esperar entre subidas (salvo en la última)
    if (i < pendientes.length - 1) await sleep(DELAY_MS);
  }

  // ── Resumen final ──────────────────────────────────────────
  console.log('\n══════════════════════════════════════════');
  console.log(`RESULTADO: ${ok} OK | ${err} fallidas de ${total}`);
  if (errores.length > 0) {
    console.log('\nEdiciones con error:');
    errores.forEach(e => console.log(`  - ${e.titulo}: ${e.error}`));
    // Guardar log de errores para reintentar
    const logPath = path.join(__dirname, 'errores-migracion.json');
    fs.writeFileSync(logPath, JSON.stringify(errores, null, 2));
    console.log(`\nLog guardado en: ${logPath}`);
  }
  console.log('══════════════════════════════════════════\n');
}

main().catch(e => { console.error('Error fatal:', e); process.exit(1); });
