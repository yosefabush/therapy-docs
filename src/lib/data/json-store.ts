import { promises as fs } from 'fs';
import path from 'path';

// On Vercel (serverless), use /tmp for writable storage
// In development, use local data/ directory
const isVercel = process.env.VERCEL === '1';
const WRITABLE_DIR = isVercel ? '/tmp/data' : path.join(process.cwd(), 'data');
const BUNDLED_DATA_DIR = path.join(process.cwd(), 'data');

// Log environment detection on module load
console.log('[json-store] Environment detection:', {
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
    console.log(`[json-store] File already exists in /tmp: ${filename}`);
    initializedFiles.add(filename);
  } catch {
    // File doesn't exist in /tmp, try to copy from bundled
    try {
      const bundledData = await fs.readFile(bundledPath, 'utf-8');
      await fs.writeFile(writablePath, bundledData, 'utf-8');
      console.log(`[json-store] Copied bundled data to /tmp: ${filename}`);
      initializedFiles.add(filename);
    } catch (error) {
      // Bundled file doesn't exist either, that's ok
      console.log(`[json-store] No bundled data for: ${filename}`, error);
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

export async function writeJsonFile<T>(filename: string, data: T[]): Promise<void> {
  await ensureDataDir();
  const filePath = path.join(WRITABLE_DIR, filename);
  const tempPath = `${filePath}.tmp`;

  console.log(`[json-store] Writing file: ${filePath} (${data.length} items)`);

  // Atomic write: write to temp file, then rename
  await fs.writeFile(tempPath, JSON.stringify(data, null, 2), 'utf-8');
  await fs.rename(tempPath, filePath);
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
