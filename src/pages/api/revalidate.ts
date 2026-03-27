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

export const POST: APIRoute = async ({ request }) => {
  const secret    = import.meta.env.SANITY_WEBHOOK_SECRET;
  const vToken    = import.meta.env.VERCEL_REVALIDATE_TOKEN;
  const projectId = import.meta.env.VERCEL_PROJECT_ID;
  const teamId    = import.meta.env.VERCEL_ORG_ID;

  if (!secret || !vToken || !projectId) {
    console.error('[revalidate] Faltan env vars: SANITY_WEBHOOK_SECRET, VERCEL_REVALIDATE_TOKEN, VERCEL_PROJECT_ID');
    return json({ error: 'Server misconfigured' }, 500);
  }

  const rawBody   = await request.text();
  const signature = request.headers.get(SIGNATURE_HEADER_NAME) ?? '';

  // isValidSignature usa base64url internamente — era el bug de la impl. manual
  const valid = await isValidSignature(rawBody, signature, secret);
  if (!valid) {
    console.warn('[revalidate] Firma inválida');
    return json({ error: 'Unauthorized' }, 401);
  }

  let payload: Record<string, any>;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return json({ error: 'Invalid JSON' }, 400);
  }

  const tags = buildTags(payload);
  console.log('[revalidate] Purgando tags:', tags);

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
    console.error('[revalidate] Vercel purge error:', res.status, err);
    return json({ error: 'Purge failed', detail: err }, 500);
  }

  console.log('[revalidate] OK — purge status:', res.status);
  return json({ ok: true, purged: tags }, 200);
};

// ─── helpers ─────────────────────────────────────────────────────────────────

function buildTags(payload: Record<string, any>): string[] {
  const tags: string[] = ['home'];

  if (payload._type === 'articulo') {
    const slug = payload.slug?.current ?? payload.result?.slug?.current;
    const cat  = payload.categoria     ?? payload.result?.categoria;

    if (slug) tags.push(`nota-${slug}`);
    if (cat)  tags.push(`seccion-${String(cat).toLowerCase()}`);
  }

  return [...new Set(tags)];
}

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
