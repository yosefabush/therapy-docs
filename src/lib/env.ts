// Edge-safe environment/secret access shared by both Node and Edge (middleware)
// runtimes. Must not import Node-only modules so it can run in middleware.

export const IS_PRODUCTION = process.env.NODE_ENV === 'production';

// Development-only fallback. Never returned in production (guarded below).
const DEV_FALLBACK_KEY = 'dev-only-insecure-key-change-me-1234567890';

export function requireSecret(name: string): string {
  const value = process.env[name];
  if (value && value.length > 0) {
    return value;
  }
  if (IS_PRODUCTION) {
    throw new Error(
      `Missing required environment variable "${name}". Refusing to use insecure defaults in production.`
    );
  }
  return DEV_FALLBACK_KEY;
}
