// src/pages/api/portada/[id].jpg.ts
//
// Portada automática de una edición impresa: renderiza la PRIMERA PÁGINA del PDF
// y la devuelve como JPEG. Reemplaza al script manual scripts/generar-portadas.js
// para las ediciones nuevas — apenas se sube el PDF al Studio, la miniatura aparece
// sola en /edicionesanteriores sin que nadie tenga que correr nada.
//
// Además, si hay token de escritura configurado, sube la miniatura a Sanity y la
// deja asociada al documento (campo imagenPortada). A partir de ahí la portada se
// sirve directo desde el CDN de Sanity y este endpoint deja de intervenir.
//
// Variable de entorno opcional (recomendada):
//   SANITY_API_WRITE_TOKEN — token de Sanity con permiso de escritura.
//   Sin ella el endpoint igual funciona, pero re-renderiza el PDF cada vez que
//   expira la caché del CDN en lugar de guardar la portada de forma permanente.
//
// Diagnóstico: cuando devuelve el placeholder, el motivo va en la cabecera
// X-Portada-Error. En producción los console.log del logger no son visibles sin
// abrir el dashboard, así que esa cabecera es la forma rápida de ver qué pasó:
//   curl -sI https://.../api/portada/<id>.jpg | grep -i x-portada

import type { APIRoute } from 'astro';
import { createClient } from '@sanity/client';
import { sanityClient } from '../../../lib/sanity';
import { renderPortada, THUMB_WIDTH } from '../../../lib/portadaPdf';
import { logger } from '../../../lib/logger';

/** IDs de Sanity: alfanuméricos con guiones y puntos. Filtra rutas raras antes de consultar. */
const ID_VALIDO = /^[A-Za-z0-9._-]{1,128}$/;

/** Un año. La portada de una edición ya publicada no cambia nunca. */
const CACHE_OK    = 'public, max-age=3600, s-maxage=31536000, stale-while-revalidate=86400';
/** Corta, para que un fallo puntual (PDF pesado, timeout) se reintente solo. */
const CACHE_ERROR = 'public, max-age=60, s-maxage=300';

/**
 * Tope para bajar el PDF. Las ediciones pesan ~10 MB; si a los 25 s no llegó,
 * algo anda mal y conviene cortar antes de que Vercel mate la función entera.
 */
const DESCARGA_TIMEOUT_MS = 25_000;

interface EdicionPdf {
  _id:        string;
  titulo:     string | null;
  fecha:      string | null;
  pdfUrl:     string | null;
  portadaUrl: string | null;
}

const QUERY = `*[_type == "edicionImpresa" && _id == $id && !(_id in path("drafts.**"))][0]{
  _id,
  titulo,
  fecha,
  "pdfUrl": archivoPdf.asset->url,
  "portadaUrl": imagenPortada.asset->url
}`;

export const GET: APIRoute = async ({ params }) => {
  const id = params.id ?? '';
  if (!ID_VALIDO.test(id)) return placeholder(400, 'id-invalido');

  let edicion: EdicionPdf | null = null;
  try {
    edicion = await sanityClient.fetch<EdicionPdf | null>(QUERY, { id });
  } catch (e) {
    logger.error('api/portada', 'No se pudo consultar la edición', { id, e });
    return placeholder(502, `sanity-query: ${mensaje(e)}`);
  }

  if (!edicion) return placeholder(404, 'edicion-inexistente');

  // Ya tiene portada cargada (a mano o por una llamada anterior): que la sirva Sanity.
  if (edicion.portadaUrl) {
    return new Response(null, {
      status: 302,
      headers: {
        Location: `${edicion.portadaUrl}?w=${THUMB_WIDTH}&q=72&auto=format`,
        'Cache-Control': CACHE_OK,
      },
    });
  }

  if (!edicion.pdfUrl) return placeholder(404, 'edicion-sin-pdf');

  // Descarga y render van en bloques separados a propósito: así la cabecera de
  // diagnóstico dice cuál de los dos pasos falló, que es lo primero que uno
  // quiere saber cuando una portada no aparece.
  let pdf: Uint8Array;
  try {
    const res = await fetch(edicion.pdfUrl, { signal: AbortSignal.timeout(DESCARGA_TIMEOUT_MS) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    pdf = new Uint8Array(await res.arrayBuffer());
  } catch (e) {
    logger.error('api/portada', 'No se pudo descargar el PDF', { id, titulo: edicion.titulo, e });
    return placeholder(502, `descarga: ${mensaje(e)}`);
  }

  let jpeg: Buffer;
  try {
    jpeg = await renderPortada(pdf);
  } catch (e) {
    logger.error('api/portada', 'No se pudo renderizar la portada', { id, titulo: edicion.titulo, e });
    return placeholder(502, `render: ${mensaje(e)}`);
  }

  // Persistir en Sanity para no volver a renderizar nunca más. Si falla, no importa:
  // la imagen ya está generada y se devuelve igual.
  let guardada = 'si';
  try {
    guardada = await guardarEnSanity(edicion, jpeg);
  } catch (e) {
    logger.warn('api/portada', 'Portada generada pero no se pudo guardar en Sanity', { id, e });
    guardada = `no: ${mensaje(e)}`;
  }

  return new Response(new Uint8Array(jpeg), {
    status: 200,
    headers: {
      'Content-Type': 'image/jpeg',
      'Content-Length': String(jpeg.length),
      'Cache-Control': CACHE_OK,
      // Si dice algo distinto de "si", la portada se re-renderiza en cada visita
      // en lugar de quedar guardada: falta el token de escritura en Vercel.
      'X-Portada-Guardada': recortar(guardada),
    },
  });
};

// ─── helpers ─────────────────────────────────────────────────────────────────

function env(nombre: string): string | undefined {
  // import.meta.env se reemplaza en build; process.env cubre las inyectadas en runtime.
  return (import.meta.env as Record<string, any>)[nombre] ?? process.env[nombre];
}

/**
 * Sube la miniatura como image asset y la asocia al documento.
 * @returns "si" si quedó guardada, o el motivo por el que no.
 */
async function guardarEnSanity(edicion: EdicionPdf, jpeg: Buffer): Promise<string> {
  // Orden a propósito: SANITY_API_TOKEN / SANITY_TOKEN son los de sólo lectura del
  // sitio y dan 403 al subir el asset. Primero los que tienen permiso de escritura.
  const token = env('SANITY_API_WRITE_TOKEN')
             ?? env('SANITY_MIGRATION_TOKEN')
             ?? env('SANITY_API_TOKEN')
             ?? env('SANITY_TOKEN');
  if (!token) {
    logger.info('api/portada', 'Sin token de escritura: la portada no se guarda en Sanity');
    return 'no: falta token de escritura';
  }

  const writeClient = createClient({
    projectId:  env('PUBLIC_SANITY_PROJECT_ID') ?? 'k3agywgt',
    dataset:    env('PUBLIC_SANITY_DATASET')    ?? 'production',
    apiVersion: '2024-01-01',
    useCdn:     false,
    token,
  });

  const asset = await writeClient.assets.upload('image', jpeg, {
    filename: `portada-${edicion.fecha ?? edicion._id}.jpg`,
    contentType: 'image/jpeg',
  });

  await writeClient
    .patch(edicion._id)
    .set({ imagenPortada: { _type: 'image', asset: { _type: 'reference', _ref: asset._id } } })
    .commit();

  logger.info('api/portada', 'Portada guardada en Sanity', { id: edicion._id, asset: asset._id });
  return 'si';
}

/** Mensaje corto y en una sola línea de un error, apto para una cabecera HTTP. */
function mensaje(e: unknown): string {
  const raw = e instanceof Error ? `${e.name}: ${e.message}` : String(e);
  return recortar(raw);
}

/** Las cabeceras HTTP no admiten saltos de línea ni caracteres de control. */
function recortar(texto: string, max = 180): string {
  return texto.replace(/[\r\n\t]+/g, ' ').replace(/[^\x20-\x7E]/g, '').slice(0, max);
}

/**
 * Marcador de posición cuando no se pudo generar la portada.
 * Devuelve un SVG con la misma proporción y el mismo ícono que la grilla, así la
 * tarjeta no queda con la imagen rota.
 */
function placeholder(status: number, motivo: string): Response {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 440 570" width="440" height="570" role="img" aria-label="Portada no disponible">
  <rect width="440" height="570" fill="#f0f2f5"/>
  <g transform="translate(200 265) scale(1.6)" fill="none" stroke="#9aa7bb" stroke-width="1.5" stroke-linecap="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14 2 14 8 20 8"/>
  </g>
</svg>`;

  return new Response(svg, {
    status,
    headers: {
      'Content-Type': 'image/svg+xml; charset=utf-8',
      'Cache-Control': status === 404 ? CACHE_OK : CACHE_ERROR,
      'X-Portada-Error': recortar(motivo),
    },
  });
}
