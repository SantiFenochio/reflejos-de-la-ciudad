// src/pages/api/revalidate.ts
//
// Webhook de Sanity → invalida cache CDN de Vercel por tags específicos.
//
// Variables de entorno requeridas:
//   SANITY_WEBHOOK_SECRET   — secreto generado al crear el webhook en Sanity
//   VERCEL_REVALIDATE_TOKEN — token de API de Vercel (ver instrucciones abajo)
//   VERCEL_PROJECT_ID       — inyectado automáticamente por Vercel en producción;
//                             para dev local: copiarlo de Project Settings → General
//   VERCEL_ORG_ID           — inyectado automáticamente por Vercel (teamId)
//
// Cómo crear VERCEL_REVALIDATE_TOKEN:
//   Vercel Dashboard → (team) Settings → Tokens → Create Token
//   Scope: Team, sin expiración. Guardarlo como env var en Vercel y en .env local.

import type { APIRoute } from 'astro';
import { isValidSignature, SIGNATURE_HEADER_NAME } from '@sanity/webhook';
import { logger } from '../../lib/logger';
import { notifyArticleUpdated } from '../../lib/indexnow';
import { slugify } from '../../lib/utils';

export const POST: APIRoute = async ({ request }) => {
  const secret    = import.meta.env.SANITY_WEBHOOK_SECRET;
  const vToken    = import.meta.env.VERCEL_REVALIDATE_TOKEN;
  const projectId = import.meta.env.VERCEL_PROJECT_ID;
  const teamId    = import.meta.env.VERCEL_ORG_ID;

  if (!secret || !vToken || !projectId) {
    logger.error('revalidate', 'Faltan env vars: SANITY_WEBHOOK_SECRET, VERCEL_REVALIDATE_TOKEN, VERCEL_PROJECT_ID');
    return json({ error: 'Server misconfigured' }, 500);
  }

  const rawBody   = await request.text();
  const signature = request.headers.get(SIGNATURE_HEADER_NAME) ?? '';

  // isValidSignature usa base64url internamente — era el bug de la impl. manual
  const valid = await isValidSignature(rawBody, signature, secret);
  if (!valid) {
    logger.warn('revalidate', 'Firma inválida');
    return json({ error: 'Unauthorized' }, 401);
  }

  let payload: Record<string, any>;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return json({ error: 'Invalid JSON' }, 400);
  }

  const tags = buildTags(payload);
  logger.info('revalidate', 'Purgando tags', tags);

  const purgeUrl = new URL('https://api.vercel.com/v1/edge-cache/invalidate-by-tags');
  purgeUrl.searchParams.set('projectIdOrName', projectId);
  if (teamId) purgeUrl.searchParams.set('teamId', teamId);

  const res = await fetch(purgeUrl.toString(), {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${vToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ tags, target: 'production' }),
  });

  if (!res.ok) {
    const err = await res.text();
    logger.error('revalidate', 'Vercel purge error', { status: res.status, error: err });
    return json({ error: 'Purge failed', detail: err }, 500);
  }

  // IndexNow: notificar a Bing/Yandex que la nota cambió.
  // Fire-and-forget — si falla no rompe el webhook.
  const doc = docOf(payload);
  if (doc._type === 'articulo') {
    const slug = doc.slug?.current;
    const cat  = doc.categoria;
    if (slug) {
      try {
        const indexNowResults = await notifyArticleUpdated({
          slug,
          categoria: typeof cat === 'string' ? cat : undefined,
        });
        logger.info('revalidate', 'IndexNow notificado', indexNowResults);
      } catch (e) {
        logger.warn('revalidate', 'IndexNow falló (no bloquea)', e);
      }
    }
  }

  logger.info('revalidate', 'OK — purge status', res.status);
  return json({ ok: true, purged: tags }, 200);
};

// ─── helpers ─────────────────────────────────────────────────────────────────

// Sanity manda el documento en la raíz del payload o envuelto en `result`,
// según cómo esté armada la proyección del webhook. Leemos siempre por las dos
// vías: antes `_type` sólo se miraba en la raíz, así que con payload envuelto
// el `if` no entraba nunca y se purgaba únicamente 'home' — la nota se quedaba
// con el HTML viejo (y su foto vieja) hasta que vencía el TTL.
function docOf(payload: Record<string, any>): Record<string, any> {
  return payload?.result && typeof payload.result === 'object' ? payload.result : payload;
}

function buildTags(payload: Record<string, any>): string[] {
  const tags: string[] = ['home'];
  const doc = docOf(payload);

  if (doc._type === 'articulo') {
    const slug = doc.slug?.current;
    const cat  = doc.categoria;

    if (slug) tags.push(`nota-${slug}`);
    // La categoría en Sanity va en mayúsculas y con tilde ('POLÍTICA'), pero la
    // ruta de sección y su Cache-Tag usan el slug sin tilde ('seccion-politica').
    // Sin normalizar, el tag purgado nunca coincidía con el tag emitido.
    if (cat)  tags.push(`seccion-${slugify(String(cat))}`);
  }

  return [...new Set(tags)];
}

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
