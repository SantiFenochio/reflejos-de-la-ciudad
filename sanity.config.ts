// sanity.config.ts  (raíz del proyecto)
import { defineConfig } from 'sanity'
import { structureTool } from 'sanity/structure'
import { visionTool } from '@sanity/vision'
import { orderableDocumentListDeskItem } from '@sanity/orderable-document-list'
import { schemaTypes } from './src/lib/schemas'

export default defineConfig({
  name:      'reflejos-de-la-ciudad',
  title:     'Reflejos de la Ciudad',
  projectId: 'k3agywgt',
  dataset:   'production',
  plugins: [
    structureTool({
      structure: (S, context) =>
        S.list()
          .title('Contenido')
          .items([
            orderableDocumentListDeskItem({
              type: 'articulo',
              title: 'Artículos (orden manual)',
              S,
              context,
            }),
            ...S.documentTypeListItems().filter((item) => item.getId() !== 'articulo'),
          ]),
    }),
    visionTool(),
  ],
  schema: {
    types: schemaTypes,
  },
})
