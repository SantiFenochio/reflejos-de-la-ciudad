// src/lib/schemas/youtube.ts
import { defineType, defineField } from 'sanity'

export default defineType({
  name:  'youtube',
  title: 'Video de YouTube',
  type:  'object',
  fields: [
    defineField({
      name:        'url',
      title:       'URL del Video',
      description: 'Pegá la URL completa del video (ej: https://www.youtube.com/watch?v=XXXXXXX)',
      type:        'url',
      validation:  Rule => Rule.required(),
    }),
  ],
  preview: {
    select:  { title: 'url' },
    prepare: ({ title }: { title: string }) => ({
      title: title || 'Video de YouTube',
    }),
  },
})
