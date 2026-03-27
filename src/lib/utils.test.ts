// src/lib/utils.test.ts
import { describe, it, expect } from 'vitest';
import { formatearFecha, truncateText, slugify } from './utils';

describe('formatearFecha', () => {
  it('formatea fecha correctamente en español', () => {
    const fecha = '2024-03-27';
    const resultado = formatearFecha(fecha);

    expect(resultado).toContain('marzo');
    expect(resultado).toContain('2024');
  });

  it('maneja fechas inválidas gracefully', () => {
    const fecha = 'invalid-date';
    const resultado = formatearFecha(fecha);

    // Debería devolver algo razonable, no crashear
    expect(resultado).toBeTruthy();
    expect(typeof resultado).toBe('string');
  });
});

describe('truncateText', () => {
  it('trunca texto largo correctamente', () => {
    const texto = 'Este es un texto muy largo que debería ser truncado';
    const resultado = truncateText(texto, 20);

    expect(resultado.length).toBeLessThanOrEqual(23); // 20 + "..."
    expect(resultado).toContain('...');
  });

  it('no trunca texto corto', () => {
    const texto = 'Texto corto';
    const resultado = truncateText(texto, 20);

    expect(resultado).toBe(texto);
    expect(resultado).not.toContain('...');
  });

  it('maneja texto vacío', () => {
    const resultado = truncateText('', 20);
    expect(resultado).toBe('');
  });
});

describe('slugify', () => {
  it('convierte texto a slug válido', () => {
    const texto = 'Hola Mundo 123';
    const resultado = slugify(texto);

    expect(resultado).toBe('hola-mundo-123');
    expect(resultado).toMatch(/^[a-z0-9-]+$/);
  });

  it('maneja caracteres especiales y acentos', () => {
    const texto = 'Ñoño José María';
    const resultado = slugify(texto);

    expect(resultado).toMatch(/^[a-z0-9-]+$/);
    expect(resultado).not.toContain('ñ');
    expect(resultado).not.toContain('é');
  });

  it('elimina espacios múltiples', () => {
    const texto = 'Hola    Mundo';
    const resultado = slugify(texto);

    expect(resultado).toBe('hola-mundo');
    expect(resultado).not.toContain('--');
  });
});
