import { promises as fs } from 'fs';
import path from 'path';
import { logger } from '@/lib/logger';

// On Vercel (serverless), use /tmp for writable storage
// In development, use local data/ directory
const isVercel = process.env.VERCEL === '1';
const WRITABLE_DIR = isVercel ? '/tmp/data' : path.join(process.cwd(), 'data');
const BUNDLED_DATA_DIR = path.join(process.cwd(), 'data');

// Log environment detection on module load (debug-only).
logger.debug('[json-store] Environment detection:', {
  isVercel,
  VERCEL_ENV: process.env.VERCEL,
  WRITABLE_DIR,
  BUNDLED_DATA_DIR,
});

// Track which files have been initialized from bundled data
const initializedFiles = new Set<string>();

async function ensureDataDir(): Promise<void> {
  try {
    await fs.access(WRITABLE_DIR);
  } catch {
    await fs.mkdir(WRITABLE_DIR, { recursive: true });
  }
}

// Copy bundled data to writable directory if it doesn't exist
async function ensureFileFromBundled(filename: string): Promise<void> {
  if (!isVercel || initializedFiles.has(filename)) return;

  const writablePath = path.join(WRITABLE_DIR, filename);
  const bundledPath = path.join(BUNDLED_DATA_DIR, filename);

  try {
    await fs.access(writablePath);
    logger.debug(`[json-store] File already exists in /tmp: ${filename}`);
    initializedFiles.add(filename);
  } catch {
    // File doesn't exist in /tmp, try to copy from bundled
    try {
      const bundledData = await fs.readFile(bundledPath, 'utf-8');
      await fs.writeFile(writablePath, bundledData, 'utf-8');
      logger.debug(`[json-store] Copied bundled data to /tmp: ${filename}`);
      initializedFiles.add(filename);
    } catch (error) {
      // Bundled file doesn't exist either, that's ok
      logger.debug(`[json-store] No bundled data for: ${filename}`, error);
      initializedFiles.add(filename);
    }
  }
}

// Date reviver for JSON.parse - converts ISO date strings back to Date objects
function dateReviver(key: string, value: unknown): unknown {
  if (typeof value === 'string') {
    const dateRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/;
    if (dateRegex.test(value)) {
      return new Date(value);
    }
  }
  return value;
}

export async function readJsonFile<T>(filename: string): Promise<T[]> {
  await ensureDataDir();
  await ensureFileFromBundled(filename);
  const filePath = path.join(WRITABLE_DIR, filename);

  try {
    const data = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(data, dateReviver) as T[];
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return [];
    }
    throw error;
  }
}

// Per-file write lock: serialize concurrent writes to the same file within the
// process so a read-modify-write from one request cannot clobber another's.
// (For multi-instance deployments this must move to the database layer.)
const writeLocks = new Map<string, Promise<void>>();

async function withWriteLock(
  filename: string,
  task: () => Promise<void>
): Promise<void> {
  const previous = writeLocks.get(filename) ?? Promise.resolve();
  const current = previous.catch(() => {}).then(task);
  writeLocks.set(
    filename,
    current.finally(() => {
      if (writeLocks.get(filename) === current) {
        writeLocks.delete(filename);
      }
    })
  );
  return current;
}

export async function writeJsonFile<T>(filename: string, data: T[]): Promise<void> {
  return withWriteLock(filename, async () => {
    await ensureDataDir();
    const filePath = path.join(WRITABLE_DIR, filename);
    const tempPath = `${filePath}.tmp`;

    logger.debug(`[json-store] Writing file: ${filePath} (${data.length} items)`);

    // Atomic write: write to temp file, then rename
    await fs.writeFile(tempPath, JSON.stringify(data, null, 2), 'utf-8');
    await fs.rename(tempPath, filePath);
  });
}

export async function fileExists(filename: string): Promise<boolean> {
  await ensureFileFromBundled(filename);
  try {
    await fs.access(path.join(WRITABLE_DIR, filename));
    return true;
  } catch {
    return false;
  }
}

export { WRITABLE_DIR as DATA_DIR };
