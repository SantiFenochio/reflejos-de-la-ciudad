// src/__tests__/setup.ts
// Setup global para tests

import { expect, beforeAll, afterEach, afterAll } from 'vitest';

beforeAll(() => {
  // Setup antes de todos los tests
  console.log('🧪 Iniciando tests...');
});

afterEach(() => {
  // Cleanup después de cada test
});

afterAll(() => {
  // Cleanup final
  console.log('✅ Tests completados');
});

// Agregar matchers custom si es necesario
expect.extend({
  // Custom matchers aquí
});
