// astro.config.mjs
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

import sitemap from '@astrojs/sitemap';

export default defineConfig({
  // Dominio actual: Vercel preview → cambiar a .com.ar cuando esté listo el DNS.
  site: 'https://reflejos-de-la-ciudad.vercel.app',

  output: 'static',

  vite: {
    plugins: [
      // TailwindCSS v4 va como plugin de Vite, NO como integración de Astro
      // @astrojs/tailwind es para v3 — no usarlo con v4
      tailwindcss(),
    ],

    build: {
      rollupOptions: {
        // Suprime warning de Astro interno: funciones importadas de
        // @astrojs/internal-helpers/remote no usadas en assets/utils.
        // Bug rastreado en https://github.com/withastro/astro — pendiente de fix upstream.
        onwarn(warning, defaultHandler) {
          if (
            warning.code === 'UNUSED_EXTERNAL_IMPORT' &&
            warning.exporter === '@astrojs/internal-helpers/remote'
          ) {
            return;
          }
          defaultHandler(warning);
        },
      },
    },
  },

  integrations: [
    sitemap({
      changefreq: 'daily',
      priority: 0.7,
      lastmod: new Date(),
      filter: (page) =>
        !page.includes('/studio') &&
        !page.includes('/draft') &&
        !page.includes('/preview'),
      serialize(item) {
        if (item.url === 'https://reflejos-de-la-ciudad.vercel.app/') {
          return { ...item, changefreq: 'hourly', priority: 1.0 };
        }
        if (item.url.includes('/nota/')) {
          return { ...item, changefreq: 'weekly', priority: 0.7 };
        }
        return { ...item, changefreq: 'daily', priority: 0.8 };
      },
    }),
  ],
});