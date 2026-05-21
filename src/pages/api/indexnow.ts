// src/pages/api/indexnow.ts
//
// Endpoint manual para disparar pings de IndexNow.
// Usos:
//   1. Disparo administrativo: GET /api/indexnow?slug=mi-nota&categoria=politica
//      (útil para reindexar una nota ya publicada cuando hace falta)
//   2. Disparo masivo:        GET /api/indexnow?all=true
//      Pingea TODAS las notas publicadas (úsalo con cuidado — rate limit).
//   3. POST con JSON {"urls": ["...", "..."]}  → notifica esas URLs directas.
//
// Protección: requiere header X-IndexNow-Secret coincidente con INDEXNOW_PING_SECRET
// (env var). Sin secreto configurado, devuelve 503 — nunca expuesto sin auth.
// El secreto se setea en Vercel → Project Settings → Environment Variables.

import type { APIRoute } from 'astro';
import { sanityClient } from '../../lib/sanity';
import { SITE_URL } from '../../lib/seo';
import { notifyArticleUpdated, notifyIndexNow } from '../../lib/indexnow';
import { logger } from '../../lib/logger';

function authorized(request: Request): boolean {
  const secret = import.meta.env.INDEXNOW_PING_SECRET;
  if (!secret) return false;
  const got = request.headers.get('X-IndexNow-Secret') ?? '';
  return got === secret;
}

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export const GET: APIRoute = async ({ request, url }) => {
  if (!authorized(request)) {
    return json({ error: 'Unauthorized — set X-IndexNow-Secret header' }, 401);
  }

  // Modo: notificar todas las notas
  if (url.searchParams.get('all') === 'true') {
    try {
      const notas: { slug: { current: string }; categoria?: string }[] =
        await sanityClient.fetch(
          `*[_type == "articulo" && defined(slug.current) && (noindex != true)]
           | order(fechaPublicacion desc) [0...9999] { slug, categoria }`
        );

      const urls = [`${SITE_URL}/`];
      for (const n of notas) {
        if (n.slug?.current) urls.push(`${SITE_URL}/nota/${n.slug.current}`);
      }
      const results = await notifyIndexNow(urls);
      return json({ ok: true, count: urls.length, results }, 200);
    } catch (e) {
      logger.error('api/indexnow', 'Falló el modo all=true', e);
      return json({ error: 'Internal error' }, 500);
    }
  }

  // Modo: notificar una nota específica
  const slug = url.searchParams.get('slug');
  const categoria = url.searchParams.get('categoria') ?? undefined;
  if (slug) {
    const results = await notifyArticleUpdated({ slug, categoria });
    return json({ ok: true, slug, categoria, results }, 200);
  }

  return json(
    {
      error: 'Faltan parámetros',
      hint: 'Usá ?slug=mi-nota&categoria=politica  ó  ?all=true',
    },
    400
  );
};

export const POST: APIRoute = async ({ request }) => {
  if (!authorized(request)) {
    return json({ error: 'Unauthorized — set X-IndexNow-Secret header' }, 401);
  }

  let payload: { urls?: unknown };
  try {
    payload = await request.json();
  } catch {
    return json({ error: 'Invalid JSON' }, 400);
  }

  if (!Array.isArray(payload.urls) || payload.urls.length === 0) {
    return json({ error: 'Body debe ser {"urls": ["...", "..."]}' }, 400);
  }

  const urls = (payload.urls as unknown[]).filter(
    (u): u is string => typeof u === 'string'
  );
  const results = await notifyIndexNow(urls);
  return json({ ok: true, count: urls.length, results }, 200);
};
