// src/lib/indexnow.ts
//
// Protocolo IndexNow: notifica a buscadores (Bing, Yandex, Seznam, Naver, Yep)
// que una o más URLs cambiaron, sin esperar al próximo rastreo orgánico.
// Google adoptó IndexNow indirectamente: aunque su crawler oficial no lo lee,
// Bing comparte el feed con Microsoft Search Network y muchos signals llegan
// igual. Para Google además se ping el sitemap-news y se confía en su rastreo.
//
// Spec: https://www.indexnow.org/documentation
//
// Verificación: el archivo public/{INDEXNOW_KEY}.txt contiene la key como
// contenido plano. Los buscadores hacen GET a ese archivo antes de aceptar
// el envío.
//
// Llamadas:
//   - notifyIndexNow([url, url2, ...])   → envía hasta 10000 URLs por request
//   - notifyArticleUpdated(slug)         → atajo para una nota
//
// Errores: nunca lanzan. Loguean y devuelven { ok, status } para que el
// caller decida si retry. NO bloquean el flujo (publicación de nota).

import { SITE_URL } from './seo';
import { logger } from './logger';

// API key generada con crypto.randomBytes(16).toString('hex')
// MUST coincidir con el nombre del archivo en public/{key}.txt
export const INDEXNOW_KEY = 'd91a6961bd471028fa890b8d66d576bf';

// Host SIN protocolo, tal como lo espera la API.
const HOST = SITE_URL.replace(/^https?:\/\//, '');

// Endpoints de IndexNow. Cualquiera acepta el envío y propaga al resto,
// pero mandamos a los principales en paralelo por redundancia.
const ENDPOINTS = [
  'https://api.indexnow.org/IndexNow',
  'https://www.bing.com/IndexNow',
];

interface IndexNowResult {
  ok: boolean;
  status: number;
  endpoint: string;
  error?: string;
}

/**
 * Notifica a IndexNow que una o más URLs cambiaron.
 * Acepta hasta 10000 URLs por llamada (límite de spec). Si pasás más,
 * se cortan a 10000.
 *
 * Las URLs deben ser absolutas y del mismo host configurado en INDEXNOW_KEY.
 */
export async function notifyIndexNow(urls: string[]): Promise<IndexNowResult[]> {
  if (!urls || urls.length === 0) return [];

  const urlList = urls
    .filter(u => typeof u === 'string' && u.startsWith(SITE_URL))
    .slice(0, 10000);

  if (urlList.length === 0) {
    logger.warn('indexnow', 'No hay URLs válidas para notificar', { recibidas: urls.length });
    return [];
  }

  const payload = {
    host: HOST,
    key: INDEXNOW_KEY,
    keyLocation: `${SITE_URL}/${INDEXNOW_KEY}.txt`,
    urlList,
  };

  const results = await Promise.allSettled(
    ENDPOINTS.map(async (endpoint): Promise<IndexNowResult> => {
      try {
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json; charset=utf-8',
            'Host': new URL(endpoint).host,
          },
          body: JSON.stringify(payload),
        });

        // IndexNow devuelve 200 OK, 202 Accepted, o 4xx con detalle.
        const ok = res.status === 200 || res.status === 202;
        if (!ok) {
          const text = await res.text().catch(() => '');
          logger.warn('indexnow', `${endpoint} → ${res.status}`, { error: text, urls: urlList.length });
        } else {
          logger.info('indexnow', `${endpoint} → ${res.status}`, { urls: urlList.length });
        }
        return { ok, status: res.status, endpoint };
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        logger.error('indexnow', `${endpoint} falló`, msg);
        return { ok: false, status: 0, endpoint, error: msg };
      }
    })
  );

  return results.map(r =>
    r.status === 'fulfilled'
      ? r.value
      : { ok: false, status: 0, endpoint: 'unknown', error: String(r.reason) }
  );
}

/**
 * Notifica que una nota se publicó o editó.
 * Empuja la URL canónica de la nota + home + sección (porque también cambian).
 */
export async function notifyArticleUpdated(opts: {
  slug: string;
  categoria?: string;
}): Promise<IndexNowResult[]> {
  const urls = [
    `${SITE_URL}/`,
    `${SITE_URL}/nota/${opts.slug}`,
  ];
  if (opts.categoria) {
    urls.push(`${SITE_URL}/${opts.categoria.toLowerCase()}`);
  }
  return notifyIndexNow(urls);
}
