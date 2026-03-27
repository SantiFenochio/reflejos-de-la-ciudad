// src/lib/logger.ts
// Sistema de logging profesional para desarrollo y producción

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogEntry {
  level: LogLevel;
  context: string;
  message: string;
  data?: any;
  timestamp: string;
}

class Logger {
  private isDev = import.meta.env.DEV;
  private isProd = import.meta.env.PROD;

  /**
   * Log informativo - solo en desarrollo
   */
  info(context: string, message: string, data?: any): void {
    if (this.isDev) {
      console.log(`[INFO][${context}]`, message, data || '');
    }
  }

  /**
   * Warning - se muestra en desarrollo y se envía a monitoreo en producción
   */
  warn(context: string, message: string, data?: any): void {
    const entry: LogEntry = {
      level: 'warn',
      context,
      message,
      data,
      timestamp: new Date().toISOString(),
    };

    if (this.isDev) {
      console.warn(`[WARN][${context}]`, message, data || '');
    }

    if (this.isProd) {
      // En producción, enviar a servicio de monitoreo (Sentry, etc.)
      this.sendToMonitoring(entry);
    }
  }

  /**
   * Error - siempre se registra y se envía a monitoreo
   */
  error(context: string, message: string, error?: any): void {
    const entry: LogEntry = {
      level: 'error',
      context,
      message,
      data: error,
      timestamp: new Date().toISOString(),
    };

    // Siempre mostrar errores
    console.error(`[ERROR][${context}]`, message, error || '');

    if (this.isProd) {
      // En producción, enviar a Sentry u otro servicio
      this.sendToMonitoring(entry);

      // Si tienes Sentry configurado, descomentar:
      // if (typeof Sentry !== 'undefined') {
      //   Sentry.captureException(error || new Error(message), {
      //     tags: { context },
      //   });
      // }
    }
  }

  /**
   * Debug - solo en desarrollo con flag específico
   */
  debug(context: string, message: string, data?: any): void {
    if (this.isDev && import.meta.env.DEBUG) {
      console.debug(`[DEBUG][${context}]`, message, data || '');
    }
  }

  /**
   * Envía logs a servicio de monitoreo en producción
   */
  private sendToMonitoring(entry: LogEntry): void {
    // Aquí puedes enviar a tu servicio de monitoreo
    // Por ahora, podemos usar Vercel Analytics custom events
    try {
      if (typeof window !== 'undefined' && 'va' in window) {
        // @ts-ignore
        window.va?.track('log_event', {
          level: entry.level,
          context: entry.context,
          message: entry.message,
        });
      }
    } catch (e) {
      // Silently fail - no queremos romper la app por logging
    }
  }
}

// Exportar instancia singleton
export const logger = new Logger();

// Export para casos especiales
export type { LogLevel, LogEntry };
