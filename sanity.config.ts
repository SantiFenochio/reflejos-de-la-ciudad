// sanity.config.ts  (raíz del proyecto)
import { defineConfig } from 'sanity'
import { structureTool } from 'sanity/structure'
import { visionTool } from '@sanity/vision'
import { schemaTypes } from './src/lib/schemas'

export default defineConfig({
  name:      'reflejos-de-la-ciudad',
  title:     'Reflejos de la Ciudad',
  projectId: 'k3agywgt',
  dataset:   'production',
  plugins: [
    structureTool(),
    visionTool(),
  ],
  schema: {
    types: schemaTypes,
  },
})
