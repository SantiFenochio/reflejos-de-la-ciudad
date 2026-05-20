// src/pages/sitemap.xml.ts
// Sitemap index: lista los sub-sitemaps que Google debe rastrear.
// - sitemap-pages.xml: home + secciones + ediciones (rutas estáticas)
// - sitemap-notas.xml: TODAS las notas publicadas en Sanity (rutas dinámicas)
// - sitemap-news.xml: Google News sitemap con las últimas 48 horas
//
// robots.txt apunta a este archivo. NO modificar la URL sin actualizar robots.txt.

import type { APIRoute } from 'astro';
import { SITE_URL } from '../lib/seo';

export const GET: APIRoute = async () => {
  const now = new Date().toISOString();

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>${SITE_URL}/sitemap-pages.xml</loc>
    <lastmod>${now}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${SITE_URL}/sitemap-notas.xml</loc>
    <lastmod>${now}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${SITE_URL}/sitemap-news.xml</loc>
    <lastmod>${now}</lastmod>
  </sitemap>
</sitemapindex>`;

  return new Response(xml, {
    status: 200,
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=300, s-maxage=600, stale-while-revalidate=3600',
    },
  });
};
