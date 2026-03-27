// src/lib/utils.ts
// Utilidades compartidas del proyecto

/**
 * Formatea una fecha ISO a formato argentino legible
 * @param iso - Fecha en formato ISO 8601
 * @returns Fecha formateada como "26 de marzo de 2026"
 */
export function formatearFecha(iso: string): string {
  return new Date(iso).toLocaleDateString('es-AR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
}

/**
 * Trunca texto a una longitud máxima sin cortar palabras
 * @param text - Texto a truncar
 * @param maxLength - Longitud máxima
 * @returns Texto truncado con "..." al final si se cortó
 */
export function truncateText(text: string, maxLength: number = 150): string {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength).replace(/\s+\S*$/, '') + '...';
}

/**
 * Genera un slug válido desde un string
 * @param text - Texto a convertir en slug
 * @returns Slug válido para URLs
 */
export function slugify(text: string): string {
  return text
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-');
}
