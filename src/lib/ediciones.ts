// src/lib/ediciones.ts
// Helpers compartidos de las ediciones impresas (el PDF semanal).
// Sin dependencias de Node: se puede importar desde cualquier página o endpoint.

export interface EdicionBase {
  _id:         string;
  titulo:      string;
  fecha:       string | null;
  portadaUrl?: string | null;
}

const MESES: Record<string, number> = {
  enero: 1, febrero: 2, marzo: 3, abril: 4, mayo: 5, junio: 6,
  julio: 7, agosto: 8, septiembre: 9, setiembre: 9, octubre: 10,
  noviembre: 11, diciembre: 12,
};

/**
 * Extrae la fecha del título de una edición: "26 de junio de 2026" → "2026-06-26".
 *
 * El título es lo único que ve el lector, así que si el campo `fecha` quedó mal
 * cargado en el Studio (pasa al duplicar el documento de la semana anterior),
 * ordenar por el título es lo que mantiene la grilla en orden cronológico real.
 *
 * @returns Fecha ISO (YYYY-MM-DD) o null si el título no tiene una fecha reconocible.
 */
export function fechaDesdeTitulo(titulo: string | null | undefined): string | null {
  const t = String(titulo ?? '').toLowerCase().replace(/\s+/g, ' ').trim();
  const m = t.match(/(\d{1,2})\s*(?:de\s*)?([a-záéíóúü]+)\s*(?:de\s*)?(\d{4})/);
  if (!m) return null;

  const mes = MESES[m[2].normalize('NFD').replace(/[̀-ͯ]/g, '')];
  if (!mes) return null;

  const dia = Number(m[1]);
  if (dia < 1 || dia > 31) return null;

  return `${m[3]}-${String(mes).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
}

/** Fecha que manda para ordenar: la del título, y si no se puede leer, el campo `fecha`. */
export function fechaDeOrden(ed: Pick<EdicionBase, 'titulo' | 'fecha'>): string {
  return fechaDesdeTitulo(ed.titulo) ?? ed.fecha ?? '';
}

/** Ordena las ediciones cronológicamente, de la más reciente a la más vieja. */
export function ordenarEdiciones<T extends Pick<EdicionBase, 'titulo' | 'fecha'>>(ediciones: T[]): T[] {
  return [...ediciones].sort((a, b) => fechaDeOrden(b).localeCompare(fechaDeOrden(a)));
}

/**
 * URL de la miniatura de portada de una edición.
 *
 * Si el documento ya tiene `imagenPortada` en Sanity se sirve desde su CDN.
 * Si no la tiene (edición recién subida), apunta a /api/portada/[id].jpg, que
 * renderiza la primera página del PDF al vuelo y la guarda en Sanity.
 */
export function urlPortada(ed: Pick<EdicionBase, '_id' | 'portadaUrl'>, ancho = 440): string {
  return ed.portadaUrl
    ? `${ed.portadaUrl}?w=${ancho}&q=72&auto=format`
    : `/api/portada/${encodeURIComponent(ed._id)}.jpg`;
}
