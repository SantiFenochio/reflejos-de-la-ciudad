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
  },

});
