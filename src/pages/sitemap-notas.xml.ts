// src/pages/sitemap-notas.xml.ts
// Sitemap dinámico de TODAS las notas publicadas en Sanity.
// Crítico para SEO: sin esto Google solo descubre notas por enlaces internos,
// lo que en SSR (output: 'server') deja muchas URLs huérfanas.
//
// Cada <url> incluye:
//   - <loc>: URL canónica de la nota
//   - <lastmod>: max(_updatedAt, fechaPublicacion) en ISO 8601
//   - <changefreq>: 'weekly' (las notas no cambian seguido tras publicarse)
//   - <priority>: 0.8 (alta, son el contenido principal del sitio)
//   - <image:image>: imagen principal con título como caption (Google Imágenes)

import type { APIRoute } from 'astro';
import { sanityClient, urlFor } from '../lib/sanity';
import { SITE_URL } from '../lib/seo';
import { logger } from '../lib/logger';

interface NotaSitemap {
  slug: { current: string };
  fechaPublicacion: string;
  _updatedAt: string;
  titulo: string;
  imagen?: any;
  noindex?: boolean;
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export const GET: APIRoute = async () => {
  let notas: NotaSitemap[] = [];

  try {
    notas = await sanityClient.fetch(
      `*[_type == "articulo" && defined(slug.current) && (noindex != true)] | order(fechaPublicacion desc) {
        slug,
        fechaPublicacion,
        _updatedAt,
        titulo,
        "imagen": imagenPrincipal,
        noindex
      }`
    );
  } catch (e) {
    logger.error('sitemap-notas', 'No se pudieron obtener notas para el sitemap', e);
  }

  const items = notas
    .filter(n => n.slug?.current)
    .map(n => {
      const loc = `${SITE_URL}/nota/${n.slug.current}`;
      const lastmod = (() => {
        const pub = n.fechaPublicacion ? new Date(n.fechaPublicacion).getTime() : 0;
        const upd = n._updatedAt ? new Date(n._updatedAt).getTime() : 0;
        const max = Math.max(pub, upd);
        return max > 0 ? new Date(max).toISOString() : new Date().toISOString();
      })();

      const imgTag = n.imagen
        ? (() => {
            try {
              const imgUrl = urlFor(n.imagen).width(1200).height(630).fit('crop').format('webp').url();
              return `
    <image:image>
      <image:loc>${escapeXml(imgUrl)}</image:loc>
      <image:title>${escapeXml(n.titulo)}</image:title>
    </image:image>`;
            } catch {
              return '';
            }
          })()
        : '';

      return `  <url>
    <loc>${escapeXml(loc)}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>${imgTag}
  </url>`;
    })
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${items}
</urlset>`;

  return new Response(xml, {
    status: 200,
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=300, s-maxage=600, stale-while-revalidate=3600',
    },
  });
};
