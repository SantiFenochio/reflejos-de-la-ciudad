// sanity/schemas/fragments/seoFields.ts
// Campos SEO opcionales para el schema de nota/artículo en Sanity.
//
// Uso en tu schema de articulo:
//   import { seoFields, seoGroup } from './fragments/seoFields'
//   defineType({
//     name: 'articulo',
//     groups: [...otrosGrupos, seoGroup],
//     fields: [...camposBase, ...seoFields],
//   })

import { defineField } from 'sanity';

export const seoFields = [
  defineField({
    name: 'seoTitle',
    title: 'Título SEO',
    type: 'string',
    description: 'Opcional. Si está vacío, se usa el título de la nota. Máx. 60 caracteres.',
    validation: (Rule) => Rule.max(60).warning('Títulos largos se truncan en Google.'),
    group: 'seo',
  }),
  defineField({
    name: 'seoDescription',
    title: 'Descripción para Google',
    type: 'text',
    rows: 3,
    description: 'Opcional. Si está vacía, se usa el copete. Entre 120 y 160 caracteres.',
    validation: (Rule) =>
      Rule.min(120).warning('Muy corta: Google puede reemplazarla.')
          .max(160).warning('Muy larga: se trunca en los resultados.'),
    group: 'seo',
  }),
  defineField({
    name: 'seoImage',
    title: 'Imagen para redes sociales',
    type: 'image',
    description: 'Opcional. Si está vacía, se usa la imagen principal. Ideal: 1200×630px.',
    options: { hotspot: true },
    group: 'seo',
  }),
  defineField({
    name: 'noindex',
    title: '🚫 Ocultar de Google',
    type: 'boolean',
    description: 'Activá SOLO para notas de prueba o borradores publicados.',
    initialValue: false,
    group: 'seo',
  }),
];

export const seoGroup = {
  name:  'seo',
  title: '🔍 SEO',
};
