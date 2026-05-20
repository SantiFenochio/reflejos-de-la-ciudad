// src/pages/sitemap-news.xml.ts
// Google News sitemap — solo notas publicadas en las últimas 48 horas.
// Cumple con la especificación: https://developers.google.com/search/docs/crawling-indexing/sitemaps/news-sitemap
//
// Requisitos cubiertos:
//   - <news:publication_date> en formato ISO 8601
//   - <news:title> idéntico al H1/headline visible
//   - <news:publication> con name e idioma (es)
//   - Sólo URLs frescas (<=48 h) — Google ignora todo lo más viejo
//
// Cache corto (5 min): este sitemap se mira con frecuencia alta cuando
// Google Discover/News rastrean novedades.

import type { APIRoute } from 'astro';
import { sanityClient } from '../lib/sanity';
import { SITE_URL, SITE_NAME } from '../lib/seo';
import { logger } from '../lib/logger';

interface NotaNews {
  slug: { current: string };
  titulo: string;
  fechaPublicacion: string;
  categoria?: string;
  noindex?: boolean;
}

const HORAS_VENTANA = 48;

function escapeXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export const GET: APIRoute = async () => {
  const corteMs = Date.now() - HORAS_VENTANA * 60 * 60 * 1000;
  const corteIso = new Date(corteMs).toISOString();

  let notas: NotaNews[] = [];

  try {
    notas = await sanityClient.fetch(
      `*[_type == "articulo"
          && defined(slug.current)
          && (noindex != true)
          && fechaPublicacion >= $corte]
       | order(fechaPublicacion desc) [0...1000] {
        slug,
        titulo,
        fechaPublicacion,
        categoria,
        noindex
       }`,
      { corte: corteIso }
    );
  } catch (e) {
    logger.error('sitemap-news', 'No se pudieron obtener notas frescas', e);
  }

  const items = notas
    .filter(n => n.slug?.current && n.titulo && n.fechaPublicacion)
    .map(n => {
      const loc = `${SITE_URL}/nota/${n.slug.current}`;
      const pub = new Date(n.fechaPublicacion).toISOString();
      const kw = n.categoria ? `\n      <news:keywords>${escapeXml(n.categoria)}</news:keywords>` : '';
      return `  <url>
    <loc>${escapeXml(loc)}</loc>
    <news:news>
      <news:publication>
        <news:name>${escapeXml(SITE_NAME)}</news:name>
        <news:language>es</news:language>
      </news:publication>
      <news:publication_date>${pub}</news:publication_date>
      <news:title>${escapeXml(n.titulo)}</news:title>${kw}
    </news:news>
  </url>`;
    })
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
${items}
</urlset>`;

  return new Response(xml, {
    status: 200,
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=180, s-maxage=300, stale-while-revalidate=900',
    },
  });
};
