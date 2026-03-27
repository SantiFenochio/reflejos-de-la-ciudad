// scripts/optimize-images.js
// Script para optimizar imágenes PNG pesadas a WebP con compresión óptima
import sharp from 'sharp';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const assetsDir = join(__dirname, '../src/assets');

const imagesToOptimize = [
  { input: 'Anteriores17.png', output: 'Anteriores17.webp', quality: 85, resize: { width: 600 } },
  { input: 'ultima17.png', output: 'ultima17.webp', quality: 85, resize: { width: 600 } },
  { input: 'NuevoLogo.png', output: 'NuevoLogo.webp', quality: 90, resize: { width: 800 } },
  { input: 'Nuevo96.png', output: 'Nuevo96.webp', quality: 90, resize: { width: 200 } },
];

async function optimizeImages() {
  console.log('🖼️  Iniciando optimización de imágenes...\n');

  for (const img of imagesToOptimize) {
    const inputPath = join(assetsDir, img.input);
    const outputPath = join(assetsDir, img.output);

    try {
      // Verificar que existe el archivo original
      await fs.access(inputPath);

      // Obtener info del original
      const stats = await fs.stat(inputPath);
      const originalSizeMB = (stats.size / 1024 / 1024).toFixed(2);

      console.log(`📦 Procesando: ${img.input} (${originalSizeMB} MB)`);

      // Optimizar
      await sharp(inputPath)
        .resize(img.resize.width, null, {
          fit: 'inside',
          withoutEnlargement: true
        })
        .webp({ quality: img.quality, effort: 6 })
        .toFile(outputPath);

      // Obtener tamaño del optimizado
      const newStats = await fs.stat(outputPath);
      const newSizeMB = (newStats.size / 1024 / 1024).toFixed(2);
      const reduction = ((1 - newStats.size / stats.size) * 100).toFixed(1);

      console.log(`   ✅ Creado: ${img.output} (${newSizeMB} MB) - Reducción: ${reduction}%\n`);
    } catch (error) {
      console.error(`   ❌ Error con ${img.input}:`, error.message, '\n');
    }
  }

  console.log('🎉 Optimización completada!');
}

optimizeImages().catch(console.error);
