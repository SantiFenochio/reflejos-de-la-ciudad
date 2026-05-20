// src/pages/sitemap-pages.xml.ts
// Sitemap de rutas estáticas: home + páginas de sección + ediciones.
// Las notas tienen su propio sitemap (sitemap-notas.xml).

import type { APIRoute } from 'astro';
import { SITE_URL } from '../lib/seo';

const SECCIONES = [
  'sociedad', 'deportes', 'salud', 'educacion', 'seguridad',
  'cultura', 'economia', 'vecinos', 'politica', 'opiniones', 'breves',
];

interface UrlEntry {
  loc: string;
  changefreq: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority: string;
  lastmod?: string;
}

export const GET: APIRoute = async () => {
  const now = new Date().toISOString();

  const urls: UrlEntry[] = [
    { loc: `${SITE_URL}/`,                       changefreq: 'hourly',  priority: '1.0', lastmod: now },
    { loc: `${SITE_URL}/edicionesanteriores`,    changefreq: 'weekly',  priority: '0.6', lastmod: now },
    ...SECCIONES.map((s): UrlEntry => ({
      loc: `${SITE_URL}/${s}`,
      changefreq: 'daily',
      priority: '0.8',
      lastmod: now,
    })),
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(u => `  <url>
    <loc>${u.loc}</loc>
    ${u.lastmod ? `<lastmod>${u.lastmod}</lastmod>` : ''}
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`).join('\n')}
</urlset>`;

  return new Response(xml, {
    status: 200,
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=600, s-maxage=1800, stale-while-revalidate=86400',
    },
  });
};
