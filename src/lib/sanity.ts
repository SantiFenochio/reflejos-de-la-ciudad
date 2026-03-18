// src/lib/sanity.ts
import { createClient } from '@sanity/client'
import imageUrlBuilder from '@sanity/image-url'

export const sanityClient = createClient({
  projectId:  import.meta.env.PUBLIC_SANITY_PROJECT_ID ?? 'k3agywgt',
  dataset:    import.meta.env.PUBLIC_SANITY_DATASET    ?? 'production',
  useCdn:     false,
  apiVersion: '2024-01-01',
})

const builder = imageUrlBuilder(sanityClient)

export function urlFor(source: any) {
  return builder.image(source)
}

import { toHTML } from '@portabletext/to-html'

export function portableTextToHtml(blocks: any[]): string {
  if (!blocks || blocks.length === 0) return ''

  // FIX DROP-CAP: rastrear el primer párrafo real (>80 chars) con clase first-para.
  // Epígrafes cortos como "Foto Juventud radical" no reciben la clase.
  // La closure vive por invocación de esta función, no por bloque.
  let firstRealParagraphFound = false

  return toHTML(blocks, {
    components: {
      block: {
        normal: ({ children }: any) => {
          const rawText = String(children ?? '').replace(/<[^>]+>/g, '')
          if (!firstRealParagraphFound && rawText.length > 80) {
            firstRealParagraphFound = true
            return `<p class="first-para">${children}</p>`
          }
          return `<p>${children}</p>`
        },
        h3:         ({ children }: any) => `<h3>${children}</h3>`,
        blockquote: ({ children }: any) => `<blockquote>${children}</blockquote>`,
      },
      marks: {
        strong: ({ children }: any) => `<strong>${children}</strong>`,
        em:     ({ children }: any) => `<em>${children}</em>`,
      },
      types: {
        image: ({ value }: any) => {
          if (!value?.asset) return ''
          const imgUrl = urlFor(value).width(900).fit('max').auto('format').url()
          const alt     = value.alt     ? String(value.alt).replace(/"/g, '&quot;') : ''
          const caption = value.caption ? String(value.caption) : ''
          return [
            '<figure class="nota-img-inline">',
            `  <img src="${imgUrl}" alt="${alt}" loading="lazy" />`,
            caption ? `  <figcaption>${caption}</figcaption>` : '',
            '</figure>',
          ].filter(Boolean).join('\n')
        },
        youtube: ({ value }: any) => {
          const url = value?.url ?? ''
          const match = url.match(
            /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/
          )
          const videoId = match?.[1]
          if (!videoId) return ''
          return [
            '<div class="yt-embed-wrap">',
            `  <iframe`,
            `    src="https://www.youtube.com/embed/${videoId}"`,
            `    title="Video de YouTube"`,
            `    frameborder="0"`,
            `    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"`,
            `    allowfullscreen`,
            `    loading="lazy"`,
            `  ></iframe>`,
            '</div>',
          ].join('\n')
        },
      },
    },
  })
}
