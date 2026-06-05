// Lightweight logger.
//
// Goals for production readiness:
//  - Never emit verbose debug output in production (avoids leaking internal
//    details and PHI into logs).
//  - Provide a single seam that can later be pointed at a real log sink
//    (Sentry, Datadog, CloudWatch, etc.).

const IS_PRODUCTION = process.env.NODE_ENV === 'production';
const DEBUG_ENABLED = process.env.DEBUG_LOGGING === 'true';

type LogArgs = unknown[];

export const logger = {
  // Verbose diagnostics – suppressed in production unless DEBUG_LOGGING=true.
  debug(...args: LogArgs): void {
    if (!IS_PRODUCTION || DEBUG_ENABLED) {
      console.log(...args);
    }
  },

  info(...args: LogArgs): void {
    console.info(...args);
  },

  warn(...args: LogArgs): void {
    console.warn(...args);
  },

  error(...args: LogArgs): void {
    console.error(...args);
  },
};
