// scripts/fix-console-logs.js
// Reemplaza todos los console.log/warn/error con logger

import { readFileSync, writeFileSync } from 'fs';
import { glob } from 'glob';

const files = glob.sync('src/**/*.{astro,ts,js}', { ignore: 'node_modules/**' });

let totalReplacements = 0;

files.forEach(filePath => {
  let content = readFileSync(filePath, 'utf-8');
  let modified = false;

  // Solo procesar si tiene console statements
  if (!content.includes('console.')) return;

  const originalContent = content;

  // Agregar import del logger si no existe
  if (!content.includes("from '../lib/logger'") &&
      !content.includes("from '../../lib/logger'") &&
      !content.includes("from '../../../lib/logger'")) {

    // Determinar el path relativo correcto
    const depth = (filePath.match(/\//g) || []).length - 1;
    const relativePath = '../'.repeat(depth) + 'lib/logger';

    // Encontrar el último import y agregar el logger
    const lastImportMatch = content.match(/import .+ from .+;/g);
    if (lastImportMatch) {
      const lastImport = lastImportMatch[lastImportMatch.length - 1];
      content = content.replace(
        lastImport,
        lastImport + `\nimport { logger } from '${relativePath}';`
      );
      modified = true;
    }
  }

  // Reemplazar console.warn
  content = content.replace(
    /console\.warn\(\s*['"]\[([^\]]+)\]['"]\s*,?\s*([^)]+)\)/g,
    (match, context, message) => {
      modified = true;
      return `logger.warn('${context}', ${message})`;
    }
  );

  // Reemplazar console.error
  content = content.replace(
    /console\.error\(\s*['"]\[([^\]]+)\]['"]\s*,?\s*([^)]+)\)/g,
    (match, context, message) => {
      modified = true;
      return `logger.error('${context}', ${message})`;
    }
  );

  // Reemplazar console.log
  content = content.replace(
    /console\.log\(\s*['"]\[([^\]]+)\]['"]\s*,?\s*([^)]+)\)/g,
    (match, context, message) => {
      modified = true;
      return `logger.info('${context}', ${message})`;
    }
  );

  if (modified && content !== originalContent) {
    writeFileSync(filePath, content, 'utf-8');
    totalReplacements++;
    console.log(`✅ Fixed: ${filePath}`);
  }
});

console.log(`\n✨ Total files modified: ${totalReplacements}`);
