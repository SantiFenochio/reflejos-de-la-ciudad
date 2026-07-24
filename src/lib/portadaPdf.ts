// src/lib/portadaPdf.ts
// Renderiza la primera página de un PDF a JPEG. Sólo servidor (usa pdfjs + sharp).
//
// No le pasamos standardFontDataUrl ni cMapUrl a pdfjs a propósito: las ediciones
// salen de imprenta con todas las fuentes embebidas, así que el render es idéntico
// con o sin esos archivos (verificado byte a byte) y nos ahorra tener que arrastrar
// ~2 MB de assets de pdfjs al bundle de la función serverless.

import * as pdfjs from 'pdfjs-dist/legacy/build/pdf.mjs';
import sharp from 'sharp';

// Import estático a propósito, aunque no lo usemos acá: pdfjs carga @napi-rs/canvas
// con createRequire() en tiempo de ejecución, y el tracer que arma la función
// serverless de Vercel no puede seguir esa llamada. Sin este import el binario
// nativo no viaja al bundle y en producción el render falla con
// "Cannot load @napi-rs/canvas package".
import '@napi-rs/canvas';

/** Ancho de la miniatura que se guarda. Igual que scripts/generar-portadas.js. */
export const THUMB_WIDTH  = 480;
export const JPEG_QUALITY = 72;

/** Supersampling: renderizamos más grande y bajamos, para que el texto chico no se pixele. */
const RENDER_SCALE = 1.5;

/**
 * pdfjs tipa `canvasFactory` como `Object`, pero en Node devuelve el canvas de
 * @napi-rs/canvas (su dependencia opcional), que sí expone toBuffer().
 */
interface NodeCanvasFactory {
  create(width: number, height: number, enableHWA: boolean): {
    canvas: { toBuffer(mime: 'image/png'): Buffer };
  };
}

/**
 * Convierte la primera página de un PDF en un JPEG listo para usar como portada.
 * @throws Si el PDF está corrupto, protegido con contraseña o no tiene páginas.
 */
export async function renderPortada(pdfBuffer: Uint8Array): Promise<Buffer> {
  const doc = await pdfjs.getDocument({
    data: pdfBuffer,
    isEvalSupported: false,
  }).promise;

  try {
    if (doc.numPages < 1) throw new Error('El PDF no tiene páginas');

    const page     = await doc.getPage(1);
    const viewport = page.getViewport({ scale: RENDER_SCALE });
    const factory  = doc.canvasFactory as unknown as NodeCanvasFactory;
    const { canvas } = factory.create(viewport.width, viewport.height, false);

    // El canvas de @napi-rs/canvas no es un HTMLCanvasElement del DOM, pero es lo
    // que pdfjs espera cuando corre en Node.
    await page.render({ canvas: canvas as unknown as HTMLCanvasElement, viewport }).promise;

    return await sharp(canvas.toBuffer('image/png'))
      .resize({ width: THUMB_WIDTH })
      .jpeg({ quality: JPEG_QUALITY, mozjpeg: true })
      .toBuffer();
  } finally {
    await doc.loadingTask.destroy();
  }
}
