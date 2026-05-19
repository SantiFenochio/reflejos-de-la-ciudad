// src/pages/api/noticias.ts
//
// Proxy server-side para la paginación de la home ("Cargar más noticias").
// El navegador no puede consultar la API de Sanity directamente: el endpoint
// apicdn.sanity.io rechaza con 403 cualquier request con header Origin que no
// esté en la lista CORS del proyecto. Este endpoint corre en el servidor
// (sin restricción de CORS) y el navegador consulta su propio dominio.

import type { APIRoute } from 'astro';
import { sanityClient } from '../../lib/sanity';
import { logger } from '../../lib/logger';

const MAX_LIMIT = 24;

export const GET: APIRoute = async ({ url }) => {
  const offset = clampInt(url.searchParams.get('offset'), 0, 0, Number.MAX_SAFE_INTEGER);
  const limit  = clampInt(url.searchParams.get('limit'), 12, 1, MAX_LIMIT);

  try {
    const notas = await sanityClient.fetch(
      `*[_type == "articulo"] | order(fechaPublicacion desc) [$offset...$end] {
        titulo,
        "slug": slug.current,
        bajada,
        categoria,
        fechaPublicacion,
        autor,
        "imgUrl": imagenPrincipal.asset->url
      }`,
      { offset, end: offset + limit }
    );

    return json({ notas }, 200);
  } catch (e) {
    logger.error('api/noticias', 'No se pudo obtener notas paginadas', e);
    return json({ error: 'No se pudieron cargar las noticias' }, 500);
  }
};

function clampInt(raw: string | null, fallback: number, min: number, max: number): number {
  const n = Number.parseInt(raw ?? '', 10);
  if (Number.isNaN(n)) return fallback;
  return Math.min(Math.max(n, min), max);
}

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=60, s-maxage=300, stale-while-revalidate=3600',
    },
  });
}
