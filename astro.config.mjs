// astro.config.mjs
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import vercel from '@astrojs/vercel';

export default defineConfig({
  // Dominio canónico. www.reflejosdelaciudad.com.ar asignado al proyecto en Vercel.
  site: 'https://www.reflejosdelaciudad.com.ar',

  output: 'server',
  adapter: vercel(),

  // Sitemaps: NO usamos @astrojs/sitemap porque en output:'server' solo recoge
  // rutas estáticas y deja huérfanas las dinámicas (/nota/[slug], /[seccion]).
  // En su lugar tenemos rutas SSR en src/pages/sitemap*.xml.ts que consultan
  // Sanity en tiempo real (con caché Vercel). Ver:
  //   /sitemap.xml         → índice
  //   /sitemap-pages.xml   → home + secciones + ediciones
  //   /sitemap-notas.xml   → todas las notas publicadas
  //   /sitemap-news.xml    → últimas 48 h (Google News)

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
});