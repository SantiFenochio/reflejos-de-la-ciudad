// scripts/fix-fechas-ediciones.js
// Sincroniza el campo `fecha` de cada edicionImpresa con la fecha que figura en su `titulo`
// y normaliza espacios sobrantes del título.
//
// El título es lo que ve el lector ("26 de junio de 2026"), así que cuando `fecha`
// no coincide, la edición aparece fuera de orden en /edicionesanteriores.
// Suele pasar al duplicar el documento anterior en el Studio y olvidar cambiar la fecha.
//
// Uso:
//   node scripts/fix-fechas-ediciones.js          → sólo reporta (dry-run)
//   node scripts/fix-fechas-ediciones.js --aplicar → escribe los cambios en Sanity

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const PROJECT_ID = 'k3agywgt';
const DATASET    = 'production';
const API_VER    = '2024-01-01';
const APLICAR    = process.argv.includes('--aplicar');

const envText = fs.readFileSync(path.join(__dirname, '..', '.env'), 'utf-8');
const tokenMatch = envText.match(/^SANITY_MIGRATION_TOKEN=(.+)$/m) || envText.match(/^SANITY_API_TOKEN=(.+)$/m);
if (!tokenMatch) { console.error('ERROR: token de escritura de Sanity no encontrado en .env'); process.exit(1); }
const TOKEN = tokenMatch[1].trim();

const BASE_URL   = `https://${PROJECT_ID}.api.sanity.io/v${API_VER}`;
const QUERY_URL  = `${BASE_URL}/data/query/${DATASET}`;
const MUTATE_URL = `${BASE_URL}/data/mutate/${DATASET}`;

const MESES = {
  enero: 1, febrero: 2, marzo: 3, abril: 4, mayo: 5, junio: 6,
  julio: 7, agosto: 8, septiembre: 9, setiembre: 9, octubre: 10,
  noviembre: 11, diciembre: 12,
};

/** "26  de junio de 2026" → "2026-06-26" (null si no se puede parsear) */
function fechaDesdeTitulo(titulo) {
  const t = String(titulo || '').toLowerCase().replace(/\s+/g, ' ').trim();
  const m = t.match(/(\d{1,2})\s*(?:de\s*)?([a-záéíóúü]+)\s*(?:de\s*)?(\d{4})/);
  if (!m) return null;
  const mes = MESES[m[2].normalize('NFD').replace(/[̀-ͯ]/g, '')];
  if (!mes) return null;
  const dia = Number(m[1]);
  if (dia < 1 || dia > 31) return null;
  return `${m[3]}-${String(mes).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
}

/** Colapsa espacios múltiples y recorta los extremos */
const limpiarTitulo = (t) => String(t || '').replace(/\s+/g, ' ').trim();

async function main() {
  const q = `*[_type=="edicionImpresa"]{_id, titulo, fecha}`;
  const res = await fetch(`${QUERY_URL}?query=${encodeURIComponent(q)}`, {
    headers: { Authorization: `Bearer ${TOKEN}` },
  });
  if (!res.ok) throw new Error(`Query HTTP ${res.status} — ${await res.text()}`);
  const ediciones = (await res.json()).result || [];

  const mutations = [];
  const sinParsear = [];

  for (const ed of ediciones) {
    const fechaTitulo = fechaDesdeTitulo(ed.titulo);
    if (!fechaTitulo) { sinParsear.push(ed); continue; }

    const tituloLimpio = limpiarTitulo(ed.titulo);
    const set = {};
    if (fechaTitulo !== ed.fecha)   set.fecha  = fechaTitulo;
    if (tituloLimpio !== ed.titulo) set.titulo = tituloLimpio;
    if (Object.keys(set).length === 0) continue;

    console.log(`• "${ed.titulo}"  fecha ${ed.fecha}${set.fecha ? ` → ${set.fecha}` : ''}${set.titulo ? `  (título normalizado)` : ''}`);
    mutations.push({ patch: { id: ed._id, set } });
  }

  console.log(`\n${ediciones.length} ediciones | ${mutations.length} a corregir | ${sinParsear.length} con título no parseable`);
  sinParsear.forEach((e) => console.log(`  ? sin fecha en el título: "${e.titulo}" (${e._id})`));

  if (mutations.length === 0) { console.log('\nNada que corregir.\n'); return; }

  if (!APLICAR) {
    console.log('\nDry-run. Volvé a correrlo con --aplicar para escribir los cambios.\n');
    return;
  }

  const mres = await fetch(MUTATE_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ mutations }),
  });
  if (!mres.ok) throw new Error(`Mutate HTTP ${mres.status} — ${await mres.text()}`);
  console.log(`\n✓ ${mutations.length} ediciones corregidas.\n`);
}

main().catch((e) => { console.error('Error fatal:', e); process.exit(1); });
