// src/lib/schemas/edicionImpresa.ts
import { defineType, defineField } from 'sanity'

export default defineType({
  name:  'edicionImpresa',
  type:  'document',
  title: 'Edición Impresa (PDF)',
  fields: [
    defineField({
      name:        'titulo',
      type:        'string',
      title:       'Semana y Año de la Edición',
      description: 'Ej: "Semana del 16 al 22 de Marzo de 2026"',
      validation:  (Rule) => Rule.required().min(5).max(120),
    }),
    defineField({
      name:       'fecha',
      type:       'date',
      title:      'Fecha de publicación',
      description: 'Usá el primer día de la semana correspondiente',
      validation: (Rule) => Rule.required(),
      options: {
        dateFormat: 'DD/MM/YYYY',
      },
    }),
    defineField({
      name:        'archivoPdf',
      type:        'file',
      title:       'Archivo PDF de la edición semanal',
      description: 'Subí el PDF de la edición impresa de esta semana',
      options: {
        accept: 'application/pdf',
      },
      validation: (Rule) => Rule.required(),
    }),
  ],
  // Ordena por fecha DESC en el Studio para que la más reciente aparezca primero
  orderings: [
    {
      title: 'Fecha de publicación (más reciente primero)',
      name:  'fechaDesc',
      by:    [{ field: 'fecha', direction: 'desc' }],
    },
  ],
  // Vista previa en la lista del Studio
  preview: {
    select: {
      title:    'titulo',
      subtitle: 'fecha',
    },
    prepare({ title, subtitle }) {
      return {
        title:    title ?? 'Sin título',
        subtitle: subtitle ? `📅 ${subtitle}` : 'Sin fecha',
      }
    },
  },
})
