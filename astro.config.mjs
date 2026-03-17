// astro.config.mjs
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({

  // Dominio final: lo usan canonical URLs y OG images en BaseLayout
  site: 'https://reflejosdelaciudad.com.ar',

  // Salida estática: genera HTML puro → ideal para Vercel sin funciones
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

});
