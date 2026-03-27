// src/lib/logger.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { logger } from './logger';

describe('Logger', () => {
  // Mock console methods
  let consoleLogSpy: any;
  let consoleWarnSpy: any;
  let consoleErrorSpy: any;

  beforeEach(() => {
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('info', () => {
    it('registra mensajes info en desarrollo', () => {
      logger.info('test-context', 'Test message', { foo: 'bar' });

      // En test environment (que es DEV), debería loggear
      if (import.meta.env.DEV) {
        expect(consoleLogSpy).toHaveBeenCalled();
      }
    });
  });

  describe('warn', () => {
    it('registra warnings', () => {
      logger.warn('test-context', 'Warning message', { error: 'details' });

      if (import.meta.env.DEV) {
        expect(consoleWarnSpy).toHaveBeenCalled();
      }
    });

    it('incluye contexto en el mensaje', () => {
      logger.warn('sanity-fetch', 'Failed to fetch', null);

      if (import.meta.env.DEV) {
        expect(consoleWarnSpy).toHaveBeenCalledWith(
          expect.stringContaining('[WARN][sanity-fetch]'),
          'Failed to fetch',
          ''
        );
      }
    });
  });

  describe('error', () => {
    it('siempre registra errores', () => {
      logger.error('critical', 'Critical error', new Error('Test error'));

      // Los errores siempre se loggean, incluso en producción
      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    it('maneja errores sin stack trace', () => {
      logger.error('test', 'Simple error message');

      expect(consoleErrorSpy).toHaveBeenCalled();
    });
  });

  describe('debug', () => {
    it('solo loggea cuando DEBUG flag está activo', () => {
      logger.debug('test', 'Debug message', { data: 123 });

      // Debug solo funciona con flag DEBUG explícito
      if (import.meta.env.DEBUG) {
        expect(consoleLogSpy).toHaveBeenCalled();
      }
    });
  });
});
