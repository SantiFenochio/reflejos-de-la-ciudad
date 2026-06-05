import path from 'path'
import { fileURLToPath } from 'url'
import dotenv from 'dotenv'
import axios from 'axios'
import * as cheerio from 'cheerio'
import { createClient } from '@sanity/client'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.resolve(__dirname, '..', '.env') })

const NEWS_INDEX_URL = 'https://www.reflejosdelaciudad.com.ar/noticias_san_martin/'
const API_VERSION = '2024-01-01'

const FECHA_DESDE = process.env.FECHA_DESDE || '2026-03-27'
const FECHA_HASTA = process.env.FECHA_HASTA || '2026-05-05'

const desdeDate = new Date(`${FECHA_DESDE}T00:00:00.000Z`)
const hastaDate = new Date(`${FECHA_HASTA}T23:59:59.999Z`)

if (Number.isNaN(desdeDate.getTime()) || Number.isNaN(hastaDate.getTime())) {
  console.error(`FECHA_DESDE/FECHA_HASTA inválidas: ${FECHA_DESDE} / ${FECHA_HASTA}`)
  process.exit(1)
}
if (desdeDate > hastaDate) {
  console.error('FECHA_DESDE no puede ser mayor que FECHA_HASTA')
  process.exit(1)
}

const sanityProjectId =
  process.env.PUBLIC_SANITY_PROJECT_ID || process.env.SANITY_PROJECT_ID || 'k3agywgt'
const sanityDataset =
  process.env.PUBLIC_SANITY_DATASET || process.env.SANITY_DATASET || 'production'
const sanityToken = process.env.SANITY_API_TOKEN || process.env.SANITY_TOKEN

if (!sanityProjectId || !sanityToken) {
  console.error('Faltan credenciales de Sanity. Definí SANITY_API_TOKEN (o SANITY_TOKEN) en .env')
  process.exit(1)
}

const client = createClient({
  projectId: sanityProjectId,
  dataset: sanityDataset,
  apiVersion: API_VERSION,
  token: sanityToken,
  useCdn: false,
})

const monthMap = {
  enero: 0, febrero: 1, marzo: 2, abril: 3, mayo: 4, junio: 5,
  julio: 6, agosto: 7, septiembre: 8, setiembre: 8, octubre: 9,
  noviembre: 10, diciembre: 11,
}

const normalizeWhitespace = (v) => String(v || '').replace(/\s+/g, ' ').trim()
const cleanTitle = (v) => normalizeWhitespace(v).replace(/\s*\|\|.*$/u, '').trim()
const removeAccents = (v) => v.normalize('NFD').replace(/[̀-ͯ]/g, '')

function slugify(value) {
  return removeAccents(String(value || '').toLowerCase())
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 96)
}

function absoluteUrl(baseUrl, href) {
  try { return new URL(href, baseUrl).toString() } catch { return null }
}

function isLikelyArticleUrl(urlString) {
  try {
    const url = new URL(urlString)
    if (!url.hostname.includes('reflejosdelaciudad.com.ar')) return false
    const pathName = url.pathname.toLowerCase()
    if (!pathName.includes('/home/news_description/')) return false
    if (/\.(jpg|jpeg|png|webp|gif|pdf|css|js)$/i.test(pathName)) return false
    return true
  } catch { return false }
}

async function fetchHtml(url) {
  const response = await axios.get(url, {
    timeout: 30000,
    responseType: 'text',
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      Accept: 'text/html,application/xhtml+xml',
    },
  })
  return response.data
}

function extractArticleUrls(indexHtml) {
  const $ = cheerio.load(indexHtml)
  const urls = []
  const seen = new Set()
  $('a[href]').each((_, el) => {
    const href = String($(el).attr('href') || '').trim()
    if (!href || href.startsWith('#') || href.startsWith('javascript:') || href.startsWith('mailto:')) return
    const abs = absoluteUrl(NEWS_INDEX_URL, href)
    if (!abs || !isLikelyArticleUrl(abs)) return
    if (seen.has(abs)) return
    seen.add(abs)
    urls.push(abs)
  })
  if (urls.length === 0) {
    const matches = indexHtml.match(/https?:\/\/www\.reflejosdelaciudad\.com\.ar\/[^"'<\s)]+/gi) || []
    for (const match of matches) {
      const clean = match.replace(/[),.;]+$/g, '')
      if (!isLikelyArticleUrl(clean)) continue
      if (seen.has(clean)) continue
      seen.add(clean)
      urls.push(clean)
    }
  }
  return urls
}

function formatDateForUrl(date) {
  const y = date.getUTCFullYear()
  const m = String(date.getUTCMonth() + 1).padStart(2, '0')
  const d = String(date.getUTCDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function buildDateFilteredNewsUrl(date) {
  const day = formatDateForUrl(date)
  return absoluteUrl(NEWS_INDEX_URL, `/noticias_san_martin/home/news/0/0/${day}/${day}`)
}

function firstMetaContent($, selectors) {
  for (const selector of selectors) {
    const raw = $(selector).attr('content') || $(selector).attr('datetime') || $(selector).attr('src') || $(selector).text()
    const value = normalizeWhitespace(raw)
    if (value) return value
  }
  return ''
}

function firstHtml($, selectors) {
  for (const selector of selectors) {
    const el = $(selector).first()
    if (el.length === 0) continue
    el.find('script,style,aside,.sharedaddy,.share-buttons,.related-posts,.post-tags,.adsbygoogle').remove()
    const html = normalizeWhitespace(el.html() || '')
    const textLen = normalizeWhitespace(el.text()).length
    if (html && textLen > 120) return el.html() || ''
  }
  return ''
}

function parseFechaToIso(rawFecha) {
  const raw = normalizeWhitespace(rawFecha)
  if (!raw) return null
  const direct = new Date(raw)
  if (!Number.isNaN(direct.getTime())) return direct.toISOString()
  const clean = removeAccents(raw.toLowerCase()).replace(/,/g, ' ').replace(/\s+/g, ' ')
  const full = clean.match(/(\d{1,2})\s+de?\s*([a-z]+)\s+de?\s*(\d{4})(?:\s+(\d{1,2})[:.](\d{2}))?/)
  if (full) {
    const day = Number(full[1])
    const month = monthMap[full[2]]
    const year = Number(full[3])
    const hour = Number(full[4] || 0)
    const minute = Number(full[5] || 0)
    if (month !== undefined) return new Date(Date.UTC(year, month, day, hour, minute)).toISOString()
  }
  const compact = clean.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})(?:\s+(\d{1,2})[:.](\d{2}))?/)
  if (compact) {
    const day = Number(compact[1])
    const month = Number(compact[2]) - 1
    const year = Number(compact[3].length === 2 ? `20${compact[3]}` : compact[3])
    const hour = Number(compact[4] || 0)
    const minute = Number(compact[5] || 0)
    return new Date(Date.UTC(year, month, day, hour, minute)).toISOString()
  }
  return null
}

function extractDateFromJsonLd($) {
  const scripts = $('script[type="application/ld+json"]')
  for (let i = 0; i < scripts.length; i += 1) {
    const raw = normalizeWhitespace($(scripts[i]).html() || '')
    if (!raw) continue
    try {
      const parsed = JSON.parse(raw)
      const candidates = Array.isArray(parsed) ? parsed : [parsed]
      for (const candidate of candidates) {
        if (!candidate || typeof candidate !== 'object') continue
        const iso = parseFechaToIso(candidate.datePublished) ||
          parseFechaToIso(candidate.dateCreated) ||
          parseFechaToIso(candidate.uploadDate)
        if (iso) return iso
      }
    } catch { continue }
  }
  return null
}

function htmlToPortableText(html) {
  const wrapped = `<div id="root">${html || ''}</div>`
  const $ = cheerio.load(wrapped)
  const root = $('#root')
  const blocks = []
  const visited = new Set()
  const selectors = 'h1,h2,h3,h4,p,blockquote,li'
  root.find(selectors).each((_, el) => {
    if (visited.has(el)) return
    visited.add(el)
    const tag = el.tagName?.toLowerCase() || 'p'
    const text = normalizeWhitespace($(el).text())
    if (!text) return
    let style = 'normal'
    if (tag === 'blockquote') style = 'blockquote'
    if (tag.startsWith('h')) style = 'h3'
    blocks.push({
      _type: 'block',
      style,
      markDefs: [],
      children: [{ _type: 'span', text, marks: [] }],
    })
  })
  if (blocks.length > 0) return blocks
  const fallback = normalizeWhitespace(root.text()).split(/(?<=[.!?])\s+/).filter(Boolean)
  return fallback.slice(0, 30).map((part) => ({
    _type: 'block',
    style: 'normal',
    markDefs: [],
    children: [{ _type: 'span', text: normalizeWhitespace(part), marks: [] }],
  }))
}

function normalizeCategoria(rawCategoria) {
  const value = normalizeWhitespace(rawCategoria)
  if (!value) return 'SOCIEDAD'
  const key = removeAccents(value.toLowerCase())
  const map = {
    sociedad: 'SOCIEDAD',
    deportes: 'DEPORTES',
    salud: 'SALUD',
    educacion: 'EDUCACIÓN',
    seguridad: 'SEGURIDAD',
    cultura: 'CULTURA',
    economia: 'ECONOMÍA',
    vecinos: 'VECINOS',
    politica: 'POLÍTICA',
    opiniones: 'OPINIONES',
    opinion: 'OPINIONES',
    breves: 'BREVES',
    'interes general': 'SOCIEDAD',
  }
  return map[key] || 'SOCIEDAD'
}

async function scrapeArticle(articleUrl, contextFechaIso) {
  const html = await fetchHtml(articleUrl)
  const $ = cheerio.load(html)

  const titulo = firstMetaContent($, [
    'meta[property="og:title"]',
    'meta[name="twitter:title"]',
    'meta[name="title"]',
    'h1.entry-title',
    '.post-title h1',
    'article h1',
    'h1',
  ])

  const fechaRaw = firstMetaContent($, [
    'meta[property="article:published_time"]',
    'meta[name="pubdate"]',
    'time[datetime]',
    '.post-date',
    '.entry-date',
    '.fecha',
    '.date',
  ])

  const categoria = firstMetaContent($, [
    'meta[property="article:section"]',
    '.post-category a',
    '.entry-category a',
    '.cat-links a',
    '.breadcrumb a:nth-last-child(2)',
    '.categoria',
    '.section',
  ])

  const bajada = firstMetaContent($, [
    'meta[name="description"]',
    'meta[property="og:description"]',
    '.bajada',
    '.copete',
    '.entry-excerpt',
    '.post-excerpt',
    'article p',
  ])

  const cuerpoHtml = firstHtml($, [
    'article .entry-content',
    'article .post-content',
    '.single-post-content',
    '.entry-content',
    '.post-content',
    '.article-content',
    '.contenido-nota',
    '.news-content',
    'article',
  ]) || '<p></p>'

  const imagenPrincipal = firstMetaContent($, [
    'meta[property="og:image"]',
    'meta[name="twitter:image"]',
    'article img[src]',
    '.entry-content img[src]',
    '.post-content img[src]',
  ])

  const fechaContexto = parseFechaToIso(contextFechaIso || '')
  const fechaExtraida = parseFechaToIso(fechaRaw) || extractDateFromJsonLd($) || fechaContexto
  const fechaIso = fechaExtraida || contextFechaIso || new Date().toISOString()

  return {
    url: articleUrl,
    titulo: cleanTitle(titulo),
    fechaPublicacion: fechaIso,
    fechaDetectada: Boolean(fechaExtraida),
    categoria: normalizeCategoria(categoria),
    bajada: normalizeWhitespace(bajada).slice(0, 300),
    cuerpo: htmlToPortableText(cuerpoHtml),
    cuerpoHtml,
    imagenPrincipal: absoluteUrl(articleUrl, imagenPrincipal),
  }
}

async function uploadImageFromUrl(url, fallbackName) {
  if (!url) return null
  const imageRes = await axios.get(url, {
    responseType: 'arraybuffer',
    timeout: 30000,
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
  })
  const mime = String(imageRes.headers['content-type'] || 'image/jpeg')
  const extension = mime.includes('png') ? 'png' : mime.includes('webp') ? 'webp' : 'jpg'
  const filename = `${slugify(fallbackName || 'imagen')}.${extension}`
  const asset = await client.assets.upload('image', Buffer.from(imageRes.data), {
    filename,
    contentType: mime,
  })
  return asset?._id || null
}

async function createArticuloInSanity(data) {
  const slugCurrent = slugify(data.titulo || data.url.split('/').filter(Boolean).pop() || `nota-${Date.now()}`)
  const existing = await client.fetch(
    `*[_type == "articulo" && slug.current == $slug][0]{_id}`,
    { slug: slugCurrent }
  )
  if (existing?._id) {
    return { status: 'skipped', reason: `slug existente (${slugCurrent})`, id: existing._id }
  }

  let imageAssetId = null
  if (data.imagenPrincipal) {
    try {
      imageAssetId = await uploadImageFromUrl(data.imagenPrincipal, data.titulo)
    } catch (error) {
      console.warn(`   ⚠️ Imagen no subida: ${error.message}`)
    }
  }

  const imageObject = imageAssetId
    ? { _type: 'image', asset: { _type: 'reference', _ref: imageAssetId } }
    : undefined

  const bajadaFinal = (data.bajada && data.bajada.length >= 10) ? data.bajada : (data.titulo || 'Sin bajada')

  const doc = {
    _type: 'articulo',
    titulo: data.titulo || 'Sin título',
    slug: { _type: 'slug', current: slugCurrent },
    fechaPublicacion: data.fechaPublicacion,
    bajada: bajadaFinal,
    cuerpo: data.cuerpo?.length ? data.cuerpo : htmlToPortableText(data.cuerpoHtml),
    autor: 'Redacción Reflejos',
    categoria: data.categoria,
    ...(imageObject ? { imagenPrincipal: imageObject } : {}),
  }

  const created = await client.create(doc)
  return { status: 'created', id: created._id, slug: slugCurrent }
}

async function main() {
  console.log(`Migración por rango: ${FECHA_DESDE} → ${FECHA_HASTA}`)
  console.log(`Sanity: project=${sanityProjectId} dataset=${sanityDataset}`)
  console.log(`Origen: ${NEWS_INDEX_URL}`)

  const results = {
    processed: 0,
    created: 0,
    skipped: 0,
    failed: 0,
    fueraDeRango: 0,
    sinFecha: 0,
    errores: [],
  }

  const seenArticles = new Set()
  const dayUrls = []
  for (let d = new Date(hastaDate); d >= desdeDate; d.setUTCDate(d.getUTCDate() - 1)) {
    const u = buildDateFilteredNewsUrl(d)
    if (u) dayUrls.push({ url: u, fecha: new Date(d) })
  }

  console.log(`Páginas a recorrer (una por día): ${dayUrls.length}`)

  for (const { url: pageUrl, fecha: pageDate } of dayUrls) {
    console.log(`\n📅 ${formatDateForUrl(pageDate)} → ${pageUrl}`)
    let pageHtml = ''
    try {
      pageHtml = await fetchHtml(pageUrl)
    } catch (error) {
      console.error(`   No se pudo abrir: ${error.message}`)
      continue
    }

    const pageUrls = extractArticleUrls(pageHtml).filter((u) => !seenArticles.has(u))
    if (pageUrls.length === 0) {
      console.log('   (sin notas)')
      continue
    }
    console.log(`   Notas detectadas: ${pageUrls.length}`)

    for (const url of pageUrls) {
      seenArticles.add(url)
      const position = results.processed + 1
      console.log(`\n[${position}] ${url}`)
      try {
        const scraped = await scrapeArticle(url, pageDate.toISOString())
        if (!scraped.titulo) throw new Error('No se pudo extraer el título')

        if (!scraped.fechaDetectada) {
          results.sinFecha += 1
          console.warn('   ⚠️ Fecha no detectada en HTML/JSON-LD; uso fecha de la página de listado')
        }

        const fechaNota = new Date(scraped.fechaPublicacion)
        if (Number.isNaN(fechaNota.getTime()) || fechaNota < desdeDate || fechaNota > hastaDate) {
          results.fueraDeRango += 1
          console.log(`   ⏭️ Fuera de rango: ${scraped.fechaPublicacion}`)
          continue
        }

        console.log(`   Título: ${scraped.titulo}`)
        console.log(`   Fecha: ${scraped.fechaPublicacion}`)
        console.log(`   Categoría: ${scraped.categoria}`)
        console.log(`   Imagen: ${scraped.imagenPrincipal || 'sin imagen'}`)

        const creation = await createArticuloInSanity(scraped)
        if (creation.status === 'created') {
          results.created += 1
          console.log(`   ✅ Creado: ${creation.id}`)
        } else {
          results.skipped += 1
          console.log(`   ↪️ Omitido: ${creation.reason}`)
        }
      } catch (error) {
        results.failed += 1
        results.errores.push({ url, error: error.message })
        console.error(`   ❌ Error: ${error.message}`)
      }
      results.processed += 1
    }
  }

  console.log('\n========== RESUMEN ==========')
  console.log(`Rango:               ${FECHA_DESDE} → ${FECHA_HASTA}`)
  console.log(`Procesadas:          ${results.processed}`)
  console.log(`Creadas en Sanity:   ${results.created}`)
  console.log(`Omitidas (existen):  ${results.skipped}`)
  console.log(`Fallidas:            ${results.failed}`)
  console.log(`Fuera de rango:      ${results.fueraDeRango}`)
  console.log(`Sin fecha detectada: ${results.sinFecha}`)
  if (results.errores.length > 0) {
    console.log('\nErrores:')
    for (const e of results.errores) {
      console.log(`  - ${e.url}\n    → ${e.error}`)
    }
  }
}

main().catch((error) => {
  console.error(`Error fatal: ${error.message}`)
  process.exit(1)
})
