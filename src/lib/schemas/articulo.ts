// src/lib/schemas/articulo.ts
import { defineField, defineType } from 'sanity'

export default defineType({
  name:  'articulo',
  title: 'Artículo',
  type:  'document',
  fields: [

    defineField({
      name:  'titulo',
      title: 'Título',
      type:  'string',
      validation: Rule => Rule.required().min(10).max(200),
    }),

    defineField({
      name:  'slug',
      title: 'Slug (URL)',
      type:  'slug',
      options: { source: 'titulo', maxLength: 96 },
      validation: Rule => Rule.required(),
    }),

    defineField({
      name:  'bajada',
      title: 'Bajada / Copete',
      type:  'text',
      rows:  3,
      validation: Rule => Rule.required().max(300),
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
    }),

    defineField({
      name:         'autor',
      title:        'Autor',
      type:         'string',
      initialValue: 'Redacción Reflejos',
    }),


    defineField({
      name:         'fechaPublicacion',
      title:        'Fecha de publicación',
      type:         'datetime',
      initialValue: () => new Date().toISOString(),
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
    }),

    defineField({
      name:  'cuerpo',
      title: 'Cuerpo de la nota',
      type:  'array',
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
        { type: 'image', options: { hotspot: true } },
      ],
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
