// src/lib/schemas/articulo.ts
import { defineField, defineType } from 'sanity'

export default defineType({
  name:  'articulo',
  title: 'Artículo',
  type:  'document',

  // Grupos visibles como tabs en el Studio
  groups: [
    { name: 'contenido', title: 'Contenido', default: true },
    { name: 'seo',       title: '🔍 SEO'    },
  ],

  orderings: [
    {
      title: 'Fecha de publicación (más reciente)',
      name:  'fechaPublicacionDesc',
      by: [{ field: 'fechaPublicacion', direction: 'desc' }],
    },
    {
      title: 'Fecha de publicación (más antigua)',
      name:  'fechaPublicacionAsc',
      by: [{ field: 'fechaPublicacion', direction: 'asc' }],
    },
  ],

  fields: [
    defineField({
      name:  'titulo',
      title: 'Título',
      type:  'string',
      validation: Rule => Rule.required().min(10).max(200),
      group: 'contenido',
    }),

    defineField({
      name:  'slug',
      title: 'Slug (URL)',
      type:  'slug',
      options: { source: 'titulo', maxLength: 96 },
      validation: Rule => Rule.required(),
      group: 'contenido',
    }),

    defineField({
      name:  'bajada',
      title: 'Bajada / Copete',
      type:  'text',
      rows:  3,
      validation: Rule => Rule.required().max(300),
      group: 'contenido',
    }),


    defineField({
      name:  'categoria',
      title: 'Categoría',
      type:  'string',
      options: {
        list: [
          { title: 'Sociedad',   value: 'SOCIEDAD'   },
          { title: 'Deportes',   value: 'DEPORTES'   },
          { title: 'Salud',      value: 'SALUD'      },
          { title: 'Educación',  value: 'EDUCACIÓN'  },
          { title: 'Seguridad',  value: 'SEGURIDAD'  },
          { title: 'Cultura',    value: 'CULTURA'    },
          { title: 'Economía',   value: 'ECONOMÍA'   },
          { title: 'Vecinos',    value: 'VECINOS'    },
          { title: 'Política',   value: 'POLÍTICA'   },
          { title: 'Opiniones',  value: 'OPINIONES'  },
          { title: 'Breves',     value: 'BREVES'     },
        ],
        layout: 'radio',
      },
      validation: Rule => Rule.required(),
      group: 'contenido',
    }),

    defineField({
      name:         'autor',
      title:        'Autor',
      type:         'string',
      initialValue: 'Redacción Reflejos',
      group: 'contenido',
    }),


    defineField({
      name:         'fechaPublicacion',
      title:        'Fecha de publicación',
      type:         'datetime',
      initialValue: () => new Date().toISOString(),
      group: 'contenido',
    }),

    defineField({
      name:         'featured',
      title:        'Destacada en portada',
      description:  'Si está activado, la nota aparece en el carrusel "Destacadas" de la home.',
      type:         'boolean',
      initialValue: false,
      group: 'contenido',
    }),

    defineField({
      name:    'imagenPrincipal',
      title:   'Imagen principal',
      type:    'image',
      options: { hotspot: true },
      fields: [
        defineField({
          name:  'caption',
          title: 'Epígrafe (pie de foto)',
          type:  'string',
        }),
      ],
      group: 'contenido',
    }),

    defineField({
      name:  'cuerpo',
      title: 'Cuerpo de la nota',
      type:  'array',
      group: 'contenido',
      of: [
        {
          type: 'block',
          styles: [
            { title: 'Normal',         value: 'normal'     },
            { title: 'Título interno', value: 'h3'         },
            { title: 'Destacado',      value: 'blockquote' },
          ],

          marks: {
            decorators: [
              { title: 'Negrita', value: 'strong' },
              { title: 'Itálica', value: 'em'     },
            ],
          },
        },
        { type: 'image', options: { hotspot: true },
          fields: [
            defineField({ name: 'alt',     title: 'Texto alternativo (descripción de la imagen para Google y lectores de pantalla)', type: 'string' }),
            defineField({ name: 'caption', title: 'Epígrafe (pie de foto)', type: 'string' }),
          ],
        },
        { type: 'youtube' },
      ],
    }),

    defineField({
      name:  'tags',
      title: 'Etiquetas / palabras clave',
      description: 'Opcional. Personas, lugares o temas mencionados en la nota. Ej: "Moreira", "Villa Ballester", "Concejo Deliberante". Ayudan a que Google muestre la nota cuando se busca por esos términos.',
      type:  'array',
      of:    [{ type: 'string' }],
      options: { layout: 'tags' },
      group: 'seo',
    }),

    defineField({
      name:  'seoTitle',
      title: 'Título SEO',
      type:  'string',
      description: 'Opcional. Si está vacío, se usa el título de la nota. Máx. 60 caracteres.',
      validation: (Rule) => Rule.max(60).warning('Títulos largos se truncan en Google.'),
      group: 'seo',
    }),

    defineField({
      name:  'seoDescription',
      title: 'Descripción para Google',
      type:  'text',
      rows:  3,
      description: 'Opcional. Si está vacía, se usa el copete. Entre 120 y 160 caracteres.',
      validation: (Rule) =>
        Rule.min(120).warning('Muy corta: Google puede reemplazarla.')
            .max(160).warning('Muy larga: se trunca en los resultados.'),
      group: 'seo',
    }),

    defineField({
      name:  'seoImage',
      title: 'Imagen para redes sociales',
      type:  'image',
      description: 'Opcional. Si está vacía, se usa la imagen principal. Ideal: 1200×630px.',
      options: { hotspot: true },
      group: 'seo',
    }),

    defineField({
      name:  'noindex',
      title: '🚫 Ocultar de Google',
      type:  'boolean',
      description: 'Activá SOLO para notas de prueba o borradores publicados. La nota no aparecerá en buscadores ni en sitemap.',
      initialValue: false,
      group: 'seo',
    }),

  ],

  preview: {
    select: {
      title:    'titulo',
      subtitle: 'categoria',
      media:    'imagenPrincipal',
    },
  },
})
