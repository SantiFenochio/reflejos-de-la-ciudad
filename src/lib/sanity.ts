// src/lib/sanity.ts
import { createClient } from '@sanity/client'
import imageUrlBuilder from '@sanity/image-url'

export const sanityClient = createClient({
  projectId: 'k3agywgt',
  dataset:   'production',
  useCdn:    true,
  apiVersion: '2024-01-01',
})

const builder = imageUrlBuilder(sanityClient)

export function urlFor(source: any) {
  return builder.image(source)
}

import { toHTML } from '@portabletext/to-html'

export function portableTextToHtml(blocks: any[]): string {
  if (!blocks || blocks.length === 0) return ''
  return toHTML(blocks, {
    components: {
      block: {
        normal:     ({ children }: any) => `<p>${children}</p>`,
        h3:         ({ children }: any) => `<h3>${children}</h3>`,
        blockquote: ({ children }: any) => `<blockquote>${children}</blockquote>`,
      },
      marks: {
        strong: ({ children }: any) => `<strong>${children}</strong>`,
        em:     ({ children }: any) => `<em>${children}</em>`,
      },
    },
  })
}
