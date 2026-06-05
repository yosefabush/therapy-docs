import { Repository } from '../types';
import { reviveDates, toJsonPayload } from '../revive';

type Row = { payload: unknown };

// Minimal structural view of a Prisma model delegate for the payload-backed
// tables. Concrete delegates are passed in via a cast from the entity repos.
export interface PayloadDelegate {
  findMany(args?: unknown): Promise<Row[]>;
  findUnique(args: { where: { id: string } }): Promise<Row | null>;
  create(args: { data: Record<string, unknown> }): Promise<unknown>;
  update(args: { where: { id: string }; data: Record<string, unknown> }): Promise<unknown>;
  delete(args: { where: { id: string } }): Promise<unknown>;
}

// Generic repository backed by a Postgres table that stores the full entity in
// a `payload` JSON column plus caller-provided scalar columns for querying.
export abstract class PrismaRepository<
  T extends { id: string; createdAt?: Date; updatedAt?: Date }
> implements Repository<T> {
  protected constructor(protected readonly delegate: PayloadDelegate) {}

  // Scalar columns (besides id/payload) derived from an entity for querying.
  protected abstract extractScalars(entity: T): Record<string, unknown>;

  protected abstract generateId(): string;

  protected rowToEntity(row: Row): T {
    return reviveDates(row.payload) as T;
  }

  protected toData(entity: T): Record<string, unknown> {
    return {
      id: entity.id,
      ...this.extractScalars(entity),
      payload: toJsonPayload(entity),
    };
  }

  async findAll(): Promise<T[]> {
    const rows = await this.delegate.findMany();
    return rows.map((r) => this.rowToEntity(r));
  }

  async findById(id: string): Promise<T | null> {
    const row = await this.delegate.findUnique({ where: { id } });
    return row ? this.rowToEntity(row) : null;
  }

  async findMany(predicate: (item: T) => boolean): Promise<T[]> {
    const all = await this.findAll();
    return all.filter(predicate);
  }

  async create(data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>): Promise<T> {
    const now = new Date();
    const entity = {
      ...(data as object),
      id: this.generateId(),
      createdAt: now,
      updatedAt: now,
    } as T;
    await this.delegate.create({ data: this.toData(entity) });
    return entity;
  }

  async update(id: string, data: Partial<T>): Promise<T | null> {
    const existing = await this.findById(id);
    if (!existing) return null;

    const merged = {
      ...existing,
      ...data,
      id: existing.id, // never allow id changes
      updatedAt: new Date(),
    } as T;

    await this.delegate.update({
      where: { id },
      data: {
        ...this.extractScalars(merged),
        payload: toJsonPayload(merged),
      },
    });
    return merged;
  }

  async delete(id: string): Promise<boolean> {
    try {
      await this.delegate.delete({ where: { id } });
      return true;
    } catch {
      return false;
    }
  }
}
