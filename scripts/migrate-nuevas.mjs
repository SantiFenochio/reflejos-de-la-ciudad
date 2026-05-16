import path from 'path'
import { fileURLToPath } from 'url'
import dotenv from 'dotenv'
import axios from 'axios'
import mysql from 'mysql2/promise'
import { parse as parseHtml } from 'node-html-parser'
import { createClient } from '@sanity/client'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.resolve(__dirname, '..', '.env') })

const API_VERSION = '2024-01-01'
// Default: 01 ene 2026 ART (00:00 -03:00 = 2026-01-01T03:00:00Z = 1767236400)
const FECHA_DESDE_TS = process.env.DESDE_TS ? Number(process.env.DESDE_TS) : 1767236400
const FECHA_HASTA_TS = process.env.HASTA_TS ? Number(process.env.HASTA_TS) : Math.floor(Date.now() / 1000)
const IMG_BASE = 'https://www.reflejosdelaciudad.com.ar/noticias_san_martin/uploads/news_image/'

const LIMIT = process.env.LIMIT ? Number(process.env.LIMIT) : null

const sanityProjectId =
  process.env.PUBLIC_SANITY_PROJECT_ID || process.env.SANITY_PROJECT_ID || 'k3agywgt'
const sanityDataset =
  process.env.PUBLIC_SANITY_DATASET || process.env.SANITY_DATASET || 'production'
const sanityToken = process.env.SANITY_MIGRATION_TOKEN

if (!sanityToken) {
  console.error('Falta SANITY_MIGRATION_TOKEN en .env')
  process.exit(1)
}

const sanity = createClient({
  projectId: sanityProjectId,
  dataset: sanityDataset,
  apiVersion: API_VERSION,
  token: sanityToken,
  useCdn: false,
})

const mysqlUser = process.env.MYSQL_USER_MIGRACION || 'reflejos_user1'

const conn = await mysql.createConnection({
  host: process.env.MYSQL_HOST,
  port: Number(process.env.MYSQL_PORT || 3306),
  user: mysqlUser,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE,
  connectTimeout: 30000,
})

// === Helpers ===

const removeAccents = (v) => v.normalize('NFD').replace(/[̀-ͯ]/g, '')

function slugify(value) {
  return removeAccents(String(value || '').toLowerCase())
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 96)
}

const CATEGORIA_MAP = {
  'sociedad': 'SOCIEDAD',
  'seguridad': 'SEGURIDAD',
  'cultura / espectaculos': 'CULTURA',
  'cultura': 'CULTURA',
  'espectaculos': 'CULTURA',
  'economia': 'ECONOMÍA',
  'vecinos': 'VECINOS',
  'obras publicas': 'SOCIEDAD',
  'politica': 'POLÍTICA',
  'opiniones': 'OPINIONES',
  'opinion': 'OPINIONES',
  'interes general': 'SOCIEDAD',
  'breves municipales': 'BREVES',
  'breves': 'BREVES',
  'deportes': 'DEPORTES',
  'salud': 'SALUD',
  'educacion': 'EDUCACIÓN',
}

function mapCategoria(nombre) {
  if (!nombre) return 'SOCIEDAD'
  const key = removeAccents(String(nombre).toLowerCase()).trim()
  return CATEGORIA_MAP[key] || 'SOCIEDAD'
}

function extractImgFilename(imgFeaturesRaw) {
  if (!imgFeaturesRaw) return null
  const raw = String(imgFeaturesRaw).trim()
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed) && parsed.length > 0 && parsed[0]?.img) {
      return String(parsed[0].img).trim() || null
    }
  } catch {
    // No es JSON: asumir filename directo
  }
  return raw
}

function htmlToPortableText(html) {
  if (!html || !String(html).trim()) {
    return [{
      _type: 'block',
      style: 'normal',
      markDefs: [],
      children: [{ _type: 'span', text: '', marks: [] }],
    }]
  }

  const root = parseHtml(`<div>${html}</div>`, { lowerCaseTagName: true })

  const blocks = []
  const blockTags = new Set(['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'li', 'div'])

  function walkTopLevel(node) {
    for (const child of node.childNodes || []) {
      if (child.nodeType === 3) {
        // texto suelto a nivel root
        const text = (child.rawText || '').replace(/\s+/g, ' ').trim()
        if (text) {
          blocks.push(makeBlock('normal', text))
        }
        continue
      }
      if (child.nodeType !== 1) continue
      const tag = child.tagName?.toLowerCase()
      if (!tag) continue

      if (tag === 'ul' || tag === 'ol') {
        // Cada <li> se vuelve un párrafo normal con "• " prefijo (mantengo simple)
        for (const li of child.childNodes || []) {
          if (li.nodeType !== 1 || li.tagName?.toLowerCase() !== 'li') continue
          const text = collapseText(li)
          if (text) blocks.push(makeBlock('normal', `• ${text}`))
        }
        continue
      }

      if (blockTags.has(tag)) {
        const text = collapseText(child)
        if (!text) continue
        let style = 'normal'
        if (tag === 'blockquote') style = 'blockquote'
        else if (tag.startsWith('h')) style = 'h3'
        blocks.push(makeBlock(style, text))
        continue
      }

      // Span/strong/em/etc a nivel root: si tiene texto, párrafo normal
      const text = collapseText(child)
      if (text) blocks.push(makeBlock('normal', text))
    }
  }

  function collapseText(node) {
    const raw = (node.text || node.innerText || '').replace(/ /g, ' ').replace(/\s+/g, ' ').trim()
    return raw
  }

  function makeBlock(style, text) {
    return {
      _type: 'block',
      style,
      markDefs: [],
      children: [{ _type: 'span', text, marks: [] }],
    }
  }

  walkTopLevel(root)

  if (blocks.length === 0) {
    const fallback = collapseText(root)
    if (fallback) {
      blocks.push(makeBlock('normal', fallback))
    } else {
      blocks.push(makeBlock('normal', ''))
    }
  }

  return blocks
}

function unixToIso(value) {
  const num = Number(value)
  if (!Number.isFinite(num) || num <= 0) return null
  return new Date(num * 1000).toISOString()
}

async function uploadImageFromUrl(url, fallbackName) {
  if (!url) return null
  const res = await axios.get(url, {
    responseType: 'arraybuffer',
    timeout: 60000,
    headers: { 'User-Agent': 'Mozilla/5.0 (migración Reflejos)' },
    validateStatus: (s) => s >= 200 && s < 400,
  })
  const mime = String(res.headers['content-type'] || 'image/jpeg').toLowerCase()
  const ext = mime.includes('png') ? 'png'
    : mime.includes('webp') ? 'webp'
    : mime.includes('gif') ? 'gif'
    : 'jpg'
  const filename = `${slugify(fallbackName || 'imagen')}.${ext}`
  const asset = await sanity.assets.upload('image', Buffer.from(res.data), {
    filename,
    contentType: mime.split(';')[0],
  })
  return asset?._id || null
}

// === Main ===

async function main() {
  console.log(`Migración MySQL → Sanity`)
  console.log(`  Sanity:   project=${sanityProjectId} dataset=${sanityDataset}`)
  console.log(`  MySQL:    ${process.env.MYSQL_HOST}:${process.env.MYSQL_PORT}/${process.env.MYSQL_DATABASE} (user=${mysqlUser})`)
  console.log(`  Rango:    [${FECHA_DESDE_TS}] ${new Date(FECHA_DESDE_TS * 1000).toISOString()} → [${FECHA_HASTA_TS}] ${new Date(FECHA_HASTA_TS * 1000).toISOString()}`)
  console.log(`  LIMIT:    ${LIMIT ?? 'sin límite'}`)
  console.log()

  console.log('→ Cargando categorías...')
  const [cats] = await conn.query('SELECT news_category_id, name FROM news_category')
  const catsById = new Map(cats.map((c) => [c.news_category_id, c.name]))
  console.log(`  ${catsById.size} categorías`)

  console.log('→ Cargando reporters...')
  const [reps] = await conn.query('SELECT news_reporter_id, name FROM news_reporter')
  const repsById = new Map(reps.map((r) => [r.news_reporter_id, r.name]))
  console.log(`  ${repsById.size} reporters`)

  console.log('→ Cargando IDs de noticias en rango...')
  const [idsRows] = await conn.query(
    `SELECT news_id FROM news
     WHERE status = 'published' AND date + 0 >= ? AND date + 0 <= ?
     ORDER BY date + 0 ASC
     ${LIMIT ? `LIMIT ${LIMIT}` : ''}`,
    [FECHA_DESDE_TS, FECHA_HASTA_TS]
  )
  const total = idsRows.length
  console.log(`Notas a procesar: ${total}\n`)

  // Cargo cada nota individualmente (evita explotar el paquete por longtext masivos)
  async function fetchNota(news_id) {
    const [r] = await conn.query(
      `SELECT news_id, title, summary, description, date, img_features,
              news_category_id, news_reporter_id
       FROM news WHERE news_id = ? LIMIT 1`,
      [news_id]
    )
    return r[0]
  }

  const stats = {
    ok: 0,
    skip: 0,
    fail: 0,
    errores: [],
  }

  for (let i = 0; i < idsRows.length; i++) {
    const idx = `${i + 1}/${total}`
    const news_id = idsRows[i].news_id
    let row
    try {
      row = await fetchNota(news_id)
      if (!row) throw new Error(`fila ${news_id} no encontrada`)
    } catch (error) {
      stats.fail += 1
      stats.errores.push({ news_id, titulo: '(sin cargar)', error: error.message })
      console.error(`❌ ${idx}: [${news_id}] no se pudo cargar  → ${error.message}`)
      continue
    }
    const titulo = String(row.title || '').trim() || `Nota ${row.news_id}`

    try {
      const fechaIso = unixToIso(row.date)
      if (!fechaIso) throw new Error(`fecha inválida: ${row.date}`)

      const slug = slugify(titulo) || `nota-${row.news_id}`

      // Si ya existe por slug, saltar
      const existing = await sanity.fetch(
        `*[_type == "articulo" && slug.current == $slug][0]{_id}`,
        { slug }
      )
      if (existing?._id) {
        stats.skip += 1
        console.log(`↪️  ${idx}: ${titulo}  (ya existe ${existing._id})`)
        continue
      }

      // Imagen
      let imageAssetId = null
      const imgFile = extractImgFilename(row.img_features)
      if (imgFile) {
        const url = `${IMG_BASE}${imgFile}`
        try {
          imageAssetId = await uploadImageFromUrl(url, titulo)
        } catch (e) {
          console.warn(`   ⚠️  imagen no subida (${imgFile}): ${e.message}`)
        }
      }

      const summary = String(row.summary || '').replace(/\s+/g, ' ').trim()
      const bajada = summary.length >= 10 ? summary.slice(0, 300) : (titulo.slice(0, 300) || 'Sin bajada')

      const doc = {
        _type: 'articulo',
        titulo: titulo.slice(0, 200),
        slug: { _type: 'slug', current: slug },
        bajada,
        categoria: mapCategoria(catsById.get(row.news_category_id)),
        autor: String(repsById.get(row.news_reporter_id) || '').trim() || 'Redacción Reflejos',
        fechaPublicacion: fechaIso,
        cuerpo: htmlToPortableText(row.description),
        ...(imageAssetId
          ? { imagenPrincipal: { _type: 'image', asset: { _type: 'reference', _ref: imageAssetId } } }
          : {}),
      }

      const created = await sanity.create(doc)
      stats.ok += 1
      console.log(`✅ ${idx}: ${titulo}  (${created._id})`)
    } catch (error) {
      stats.fail += 1
      stats.errores.push({ news_id: row.news_id, titulo, error: error.message })
      console.error(`❌ ${idx}: ${titulo}  → ${error.message}`)
    }
  }

  console.log('\n========== RESUMEN ==========')
  console.log(`Total procesadas:  ${total}`)
  console.log(`✅ Creadas:        ${stats.ok}`)
  console.log(`↪️  Omitidas:       ${stats.skip}`)
  console.log(`❌ Fallidas:       ${stats.fail}`)
  if (stats.errores.length > 0) {
    console.log('\nErrores:')
    for (const e of stats.errores) {
      console.log(`  - [${e.news_id}] ${e.titulo}\n      → ${e.error}`)
    }
  }
}

try {
  await main()
} catch (e) {
  console.error(`Error fatal: ${e.message}`)
  process.exitCode = 1
} finally {
  await conn.end()
}
