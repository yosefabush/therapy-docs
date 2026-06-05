// Recursively revive ISO date strings into Date objects after reading a JSON
// payload back from the database (Prisma Json columns store dates as strings).

import type { Prisma } from '@prisma/client';

const ISO_DATE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/;

export function reviveDates<T>(value: T): T {
  if (typeof value === 'string') {
    return (ISO_DATE.test(value) ? new Date(value) : value) as unknown as T;
  }
  if (Array.isArray(value)) {
    return value.map((v) => reviveDates(v)) as unknown as T;
  }
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) {
      out[k] = reviveDates(v);
    }
    return out as T;
  }
  return value;
}

// Convert an entity (with Date objects) into a plain JSON-safe value suitable
// for a Prisma Json column (dates become ISO strings).
export function toJsonPayload<T>(entity: T): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(entity));
}
