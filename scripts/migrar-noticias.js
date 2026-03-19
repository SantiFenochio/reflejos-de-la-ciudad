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
const DAYS_WINDOW = 60
const MAX_PAGES = 200
const useCategoriaReference = String(process.env.SANITY_CATEGORIA_REFERENCIA || 'false').toLowerCase() === 'true'

const sanityProjectId = process.env.PUBLIC_SANITY_PROJECT_ID || process.env.SANITY_PROJECT_ID
const sanityDataset = process.env.PUBLIC_SANITY_DATASET || process.env.SANITY_DATASET || 'production'
const sanityToken = process.env.SANITY_TOKEN

if (!sanityProjectId || !sanityToken) {
  console.error('Faltan credenciales de Sanity en .env')
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
  enero: 0,
  febrero: 1,
  marzo: 2,
  abril: 3,
  mayo: 4,
  junio: 5,
  julio: 6,
  agosto: 7,
  septiembre: 8,
  setiembre: 8,
  octubre: 9,
  noviembre: 10,
  diciembre: 11,
}

function normalizeWhitespace(value) {
  return String(value || '').replace(/\s+/g, ' ').trim()
}

function cleanTitle(value) {
  return normalizeWhitespace(value).replace(/\s*\|\|.*$/u, '').trim()
}

function removeAccents(value) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

function slugify(value) {
  return removeAccents(String(value || '').toLowerCase())
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 96)
}

function absoluteUrl(baseUrl, href) {
  try {
    return new URL(href, baseUrl).toString()
  } catch {
    return null
  }
}

function isLikelyArticleUrl(urlString) {
  try {
    const url = new URL(urlString)
    if (!url.hostname.includes('reflejosdelaciudad.com.ar')) return false
    const pathName = url.pathname.toLowerCase()
    if (!pathName.includes('/home/news_description/')) return false
    if (/\.(jpg|jpeg|png|webp|gif|pdf|css|js)$/i.test(pathName)) return false
    return true
  } catch {
    return false
  }
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
  const year = date.getUTCFullYear()
  const month = String(date.getUTCMonth() + 1).padStart(2, '0')
  const day = String(date.getUTCDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function buildDateFilteredNewsUrl(date) {
  const day = formatDateForUrl(date)
  return absoluteUrl(NEWS_INDEX_URL, `/noticias_san_martin/home/news/0/0/${day}/${day}`)
}

function extractDateFromListingUrl(urlString) {
  const match = String(urlString).match(/\/home\/news\/\d+\/\d+\/(\d{4}-\d{2}-\d{2})\/\d{4}-\d{2}-\d{2}/i)
  if (!match) return null
  const parsed = new Date(`${match[1]}T00:00:00.000Z`)
  if (Number.isNaN(parsed.getTime())) return null
  return parsed
}

function extractNewsListingUrls(indexHtml, baseUrl) {
  const $ = cheerio.load(indexHtml)
  const urls = []
  const seen = new Set()

  $('a[href]').each((_, el) => {
    const href = normalizeWhitespace($(el).attr('href'))
    if (!href) return
    const abs = absoluteUrl(baseUrl, href)
    if (!abs) return
    const url = new URL(abs)
    const pathName = url.pathname.toLowerCase()
    if (!url.hostname.includes('reflejosdelaciudad.com.ar')) return
    if (!pathName.includes('/home/news/')) return
    if (pathName.includes('/home/news_description/')) return
    if (seen.has(abs)) return
    seen.add(abs)
    urls.push(abs)
  })

  return urls
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
    if (month !== undefined) {
      return new Date(Date.UTC(year, month, day, hour, minute)).toISOString()
    }
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
        const iso =
          parseFechaToIso(candidate.datePublished) ||
          parseFechaToIso(candidate.dateCreated) ||
          parseFechaToIso(candidate.uploadDate)
        if (iso) return iso
      }
    } catch {
      continue
    }
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
      children: [
        {
          _type: 'span',
          text,
          marks: [],
        },
      ],
    })
  })

  if (blocks.length > 0) return blocks

  const fallbackParts = normalizeWhitespace(root.text()).split(/(?<=[.!?])\s+/).filter(Boolean)
  return fallbackParts.slice(0, 30).map((part) => ({
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
    breves: 'BREVES',
    'interes general': 'SOCIEDAD',
  }
  return map[key] || value.toUpperCase()
}

async function ensureCategoriaReference(categoriaNombre) {
  const nombre = normalizeWhitespace(categoriaNombre) || 'General'
  const slug = slugify(nombre)
  const existing = await client.fetch(
    `*[_type == "categoria" && (slug.current == $slug || nombre == $nombre || titulo == $nombre)][0]{_id}`,
    { slug, nombre }
  )
  if (existing?._id) return existing._id

  const categoriaId = `categoria-${slug}`
  await client.createIfNotExists({
    _id: categoriaId,
    _type: 'categoria',
    nombre,
    titulo: nombre,
    slug: { _type: 'slug', current: slug },
  })
  return categoriaId
}

async function normalizeLegacyCategoriaReferences() {
  const legacyDocs = await client.fetch(
    `*[_type == "articulo" && categoria._type == "reference"][0...200]{
      _id,
      "catNombre": categoria->nombre,
      "catTitulo": categoria->titulo,
      "catSlug": categoria->slug.current
    }`
  )

  if (!legacyDocs.length) return 0

  let normalized = 0
  for (const doc of legacyDocs) {
    const categoriaTexto = normalizeCategoria(doc.catNombre || doc.catTitulo || doc.catSlug || 'SOCIEDAD')
    await client.patch(doc._id).set({ categoria: categoriaTexto }).commit()
    normalized += 1
  }
  return normalized
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

  const cuerpoHtml =
    firstHtml($, [
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
  const fechaIso = fechaExtraida || new Date().toISOString()
  const categoriaNormalizada = normalizeCategoria(categoria)
  const cuerpo = htmlToPortableText(cuerpoHtml)

  return {
    url: articleUrl,
    titulo: cleanTitle(titulo),
    fechaPublicacion: fechaIso,
    fechaDetectada: Boolean(fechaExtraida),
    categoria: categoriaNormalizada,
    bajada: normalizeWhitespace(bajada).slice(0, 300),
    cuerpo,
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
    ? {
        _type: 'image',
        asset: { _type: 'reference', _ref: imageAssetId },
      }
    : undefined

  const baseDoc = {
    _type: 'articulo',
    titulo: data.titulo || 'Sin título',
    slug: { _type: 'slug', current: slugCurrent },
    fechaPublicacion: data.fechaPublicacion,
    bajada: data.bajada || 'Sin bajada',
    cuerpo: data.cuerpo?.length ? data.cuerpo : htmlToPortableText(data.cuerpoHtml),
    autor: 'Redacción Reflejos',
    ...(imageObject ? { imagen: imageObject, imagenPrincipal: imageObject } : {}),
  }

  if (useCategoriaReference) {
    try {
      const categoriaRefId = await ensureCategoriaReference(data.categoria)
      const created = await client.create({
        ...baseDoc,
        categoria: { _type: 'reference', _ref: categoriaRefId },
      })
      return { status: 'created', id: created._id, slug: slugCurrent }
    } catch {
      const created = await client.create({
        ...baseDoc,
        categoria: data.categoria,
      })
      return { status: 'created', id: created._id, slug: slugCurrent }
    }
  }

  {
    const created = await client.create({
      ...baseDoc,
      categoria: data.categoria,
    })
    return { status: 'created', id: created._id, slug: slugCurrent }
  }
}

async function main() {
  console.log(`Iniciando migración de noticias: ${NEWS_INDEX_URL}`)
  const cutoffDate = new Date()
  cutoffDate.setUTCDate(cutoffDate.getUTCDate() - DAYS_WINDOW)
  console.log(`Ventana de migración: últimos ${DAYS_WINDOW} días (desde ${cutoffDate.toISOString()})`)
  const normalizedCount = await normalizeLegacyCategoriaReferences()
  if (normalizedCount > 0) {
    console.log(`Categorías normalizadas a texto: ${normalizedCount}`)
  }

  const results = {
    processed: 0,
    created: 0,
    skipped: 0,
    failed: 0,
    tooOld: 0,
    sinFecha: 0,
  }

  let pageNumber = 0
  let stopByDate = false
  const seenArticles = new Set()
  const seenPages = new Set()
  const pageQueue = [NEWS_INDEX_URL]

  for (let dayOffset = 0; dayOffset <= 366; dayOffset += 1) {
    const dayDate = new Date()
    dayDate.setUTCDate(dayDate.getUTCDate() - dayOffset)
    if (dayDate < cutoffDate) {
      console.log(`Corte automático por antigüedad al generar páginas: ${dayDate.toISOString()} (< ${cutoffDate.toISOString()})`)
      break
    }
    const dayUrl = buildDateFilteredNewsUrl(dayDate)
    if (dayUrl) pageQueue.push(dayUrl)
  }

  while (pageQueue.length > 0 && pageNumber < MAX_PAGES && !stopByDate) {
    const currentPageUrl = pageQueue.shift()
    if (!currentPageUrl || seenPages.has(currentPageUrl)) continue
    seenPages.add(currentPageUrl)
    pageNumber += 1

    const pageDate = extractDateFromListingUrl(currentPageUrl)
    if (pageDate && pageDate < cutoffDate) {
      results.tooOld += 1
      stopByDate = true
      console.log(`\n⏹️ Corte por antigüedad de paginación: ${currentPageUrl}`)
      break
    }

    console.log(`\nListando página ${pageNumber}: ${currentPageUrl}`)
    let pageHtml = ''
    try {
      pageHtml = await fetchHtml(currentPageUrl)
    } catch (error) {
      console.error(`No se pudo abrir la página ${pageNumber}: ${error.message}`)
      continue
    }

    const pageUrls = extractArticleUrls(pageHtml).filter((url) => !seenArticles.has(url))

    if (pageUrls.length === 0) {
      console.log('Sin URLs nuevas en esta página')
    } else {
      console.log(`URLs encontradas en página ${pageNumber}: ${pageUrls.length}`)
    }

    for (const url of pageUrls) {
      seenArticles.add(url)
      const position = results.processed + 1
      console.log(`\n[${position}] Procesando ${url}`)
      try {
        const scraped = await scrapeArticle(url, pageDate?.toISOString())
        if (!scraped.titulo) {
          throw new Error('No se pudo extraer el título del artículo')
        }

        if (!scraped.fechaDetectada) {
          results.sinFecha += 1
          console.warn('   ⚠️ Fecha no detectada en HTML/JSON-LD, se usa fecha actual')
        }

        const fechaNota = new Date(scraped.fechaPublicacion)
        if (!Number.isNaN(fechaNota.getTime()) && fechaNota < cutoffDate) {
          results.tooOld += 1
          stopByDate = true
          console.log(`   ⏹️ Corte por antigüedad: ${scraped.fechaPublicacion} (< ${cutoffDate.toISOString()})`)
          break
        }

        console.log(`   Título: ${scraped.titulo}`)
        console.log(`   Fecha ISO: ${scraped.fechaPublicacion}`)
        console.log(`   Categoría: ${scraped.categoria}`)
        console.log(`   Imagen: ${scraped.imagenPrincipal || 'sin imagen'}`)
        const creation = await createArticuloInSanity(scraped)
        if (creation.status === 'created') {
          results.created += 1
          console.log(`   ✅ Creado en Sanity: ${creation.id}`)
        } else {
          results.skipped += 1
          console.log(`   ↪️ Omitido: ${creation.reason}`)
        }
      } catch (error) {
        results.failed += 1
        console.error(`   ❌ Error: ${error.message}`)
      }
      results.processed += 1
    }

    if (stopByDate) {
      console.log('Se detiene la migración por fecha objetivo alcanzada')
      break
    }

    const discoveredPages = extractNewsListingUrls(pageHtml, currentPageUrl)
    for (const discoveredUrl of discoveredPages) {
      if (seenPages.has(discoveredUrl)) continue
      if (pageQueue.includes(discoveredUrl)) continue
      const discoveredDate = extractDateFromListingUrl(discoveredUrl)
      if (discoveredDate && discoveredDate < cutoffDate) {
        results.tooOld += 1
        stopByDate = true
        console.log(`⏹️ Corte por antigüedad detectada en paginación: ${discoveredUrl}`)
        break
      }
      pageQueue.push(discoveredUrl)
    }
  }

  console.log('\nResumen de migración')
  console.log(`- Procesadas: ${results.processed}`)
  console.log(`- Creados: ${results.created}`)
  console.log(`- Omitidos: ${results.skipped}`)
  console.log(`- Fallidos: ${results.failed}`)
  console.log(`- Corte por antigüedad: ${results.tooOld}`)
  console.log(`- Sin fecha detectada: ${results.sinFecha}`)
}

main().catch((error) => {
  console.error(`Error fatal: ${error.message}`)
  process.exit(1)
})
