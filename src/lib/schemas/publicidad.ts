// src/lib/schemas/publicidad.ts
import { defineField, defineType } from 'sanity'

export default defineType({
  name:  'publicidad',
  title: 'Publicidad',
  type:  'document',
  fields: [

    defineField({
      name:  'nombre',
      title: 'Nombre del anunciante',
      type:  'string',
      validation: Rule => Rule.required(),
    }),

    defineField({
      name:        'imagen',
      title:       'Imagen o GIF',
      type:        'image',
      description: 'Subí la imagen o GIF del aviso',
    }),

    defineField({
      name:        'linkDestino',
      title:       'Link destino (opcional)',
      type:        'url',
      description: 'URL a donde va cuando hacen click',
    }),

    defineField({
      name:  'posicion',
      title: 'Posición',
      type:  'string',
      options: {
        list: [
          { title: 'Sidebar derecho', value: 'sidebar' },
          { title: 'Banner superior', value: 'header'  },
          { title: 'Entre noticias',  value: 'inline'  },
        ],
      },
      validation: Rule => Rule.required(),
    }),

    defineField({
      name:         'activa',
      title:        '¿Activa?',
      type:         'boolean',
      initialValue: true,
    }),

    defineField({
      name:         'orden',
      title:        'Orden de aparición',
      type:         'number',
      initialValue: 1,
    }),

  ],

  preview: {
    select: {
      title:    'nombre',
      subtitle: 'posicion',
      media:    'imagen',
    },
  },
})
