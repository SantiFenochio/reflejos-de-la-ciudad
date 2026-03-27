#!/bin/bash
# Script para reemplazar console.log con logger

# Reemplazar en todos los archivos .astro y .ts
find src -type f \( -name "*.astro" -o -name "*.ts" \) -exec sed -i \
  -e "s/console\.warn('\[/logger.warn('/g" \
  -e "s/console\.error('\[/logger.error('/g" \
  -e "s/console\.log('\[/logger.info('/g" \
  {} +

echo "✅ Console statements reemplazados con logger"
