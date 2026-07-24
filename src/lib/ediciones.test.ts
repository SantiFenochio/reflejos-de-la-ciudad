// src/lib/ediciones.test.ts
import { describe, it, expect } from 'vitest';
import { fechaDesdeTitulo, fechaDeOrden, ordenarEdiciones, urlPortada } from './ediciones';

describe('fechaDesdeTitulo', () => {
  it('lee el formato habitual de los títulos', () => {
    expect(fechaDesdeTitulo('26 de junio de 2026')).toBe('2026-06-26');
    expect(fechaDesdeTitulo('3 de julio de 2026')).toBe('2026-07-03');
  });

  it('tolera espacios de más y falta de "de"', () => {
    expect(fechaDesdeTitulo(' 26  de junio de 2026')).toBe('2026-06-26');
    expect(fechaDesdeTitulo('5 de junio 2026')).toBe('2026-06-05');
    expect(fechaDesdeTitulo('20 marzo 2026')).toBe('2026-03-20');
  });

  it('acepta mayúsculas, acentos y "setiembre"', () => {
    expect(fechaDesdeTitulo('1 de Mayo de 2026')).toBe('2026-05-01');
    expect(fechaDesdeTitulo('12 de setiembre de 2025')).toBe('2025-09-12');
  });

  it('devuelve null cuando no hay fecha reconocible', () => {
    expect(fechaDesdeTitulo('Edición especial aniversario')).toBeNull();
    expect(fechaDesdeTitulo('40 de junio de 2026')).toBeNull();
    expect(fechaDesdeTitulo('')).toBeNull();
    expect(fechaDesdeTitulo(null)).toBeNull();
  });
});

describe('fechaDeOrden', () => {
  it('prioriza la fecha del título sobre el campo fecha mal cargado', () => {
    expect(fechaDeOrden({ titulo: '26 de junio de 2026', fecha: '2026-06-19' })).toBe('2026-06-26');
  });

  it('usa el campo fecha cuando el título no tiene fecha', () => {
    expect(fechaDeOrden({ titulo: 'Suplemento aniversario', fecha: '2026-06-19' })).toBe('2026-06-19');
  });

  it('no rompe si faltan los dos', () => {
    expect(fechaDeOrden({ titulo: 'Sin fecha', fecha: null })).toBe('');
  });
});

describe('ordenarEdiciones', () => {
  it('ordena de la más reciente a la más vieja aunque el campo fecha esté mal', () => {
    const ediciones = [
      { titulo: '19 de junio de 2026', fecha: '2026-06-19' },
      { titulo: '26 de junio de 2026', fecha: '2026-06-19' }, // fecha mal cargada
      { titulo: '17 de julio de 2026', fecha: '2026-07-17' },
      { titulo: '12 de junio de 2026', fecha: '2026-06-12' },
    ];

    expect(ordenarEdiciones(ediciones).map((e) => e.titulo)).toEqual([
      '17 de julio de 2026',
      '26 de junio de 2026',
      '19 de junio de 2026',
      '12 de junio de 2026',
    ]);
  });

  it('no muta el array original', () => {
    const ediciones = [
      { titulo: '12 de junio de 2026', fecha: '2026-06-12' },
      { titulo: '17 de julio de 2026', fecha: '2026-07-17' },
    ];
    const copia = [...ediciones];
    ordenarEdiciones(ediciones);
    expect(ediciones).toEqual(copia);
  });
});

describe('urlPortada', () => {
  it('usa el CDN de Sanity cuando la portada ya existe', () => {
    const url = urlPortada({ _id: 'abc', portadaUrl: 'https://cdn.sanity.io/images/x/y/z.jpg' });
    expect(url).toBe('https://cdn.sanity.io/images/x/y/z.jpg?w=440&q=72&auto=format');
  });

  it('cae al endpoint que renderiza el PDF cuando no hay portada', () => {
    expect(urlPortada({ _id: 'abc-123', portadaUrl: null })).toBe('/api/portada/abc-123.jpg');
  });
});
