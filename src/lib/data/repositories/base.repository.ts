import { v4 as uuidv4 } from 'uuid';
import { readJsonFile, writeJsonFile } from '../json-store';
import { Repository } from '../types';

export abstract class JsonRepository<T extends { id: string; createdAt?: Date; updatedAt?: Date }>
  implements Repository<T> {

  constructor(protected readonly filename: string) {}

  // Hooks for field-level at-rest transforms (e.g. encryption). Identity by
  // default; every read goes through fromStored and every write through toStored.
  protected fromStored(item: T): T {
    return item;
  }

  protected toStored(item: T): T {
    return item;
  }

  // Items are persisted exactly as given: callers pass raw (stored-form)
  // items so untouched rows are never decrypted and re-encrypted on a write.
  private save(rawItems: T[]): Promise<void> {
    return writeJsonFile(this.filename, rawItems);
  }

  private readRaw(): Promise<T[]> {
    return readJsonFile<T>(this.filename);
  }

  async findAll(): Promise<T[]> {
    const items = await this.readRaw();
    return items.map((item) => this.fromStored(item));
  }

  async findById(id: string): Promise<T | null> {
    const items = await this.readRaw();
    const raw = items.find(item => item.id === id);
    return raw ? this.fromStored(raw) : null;
  }

  async findMany(predicate: (item: T) => boolean): Promise<T[]> {
    const items = await this.findAll();
    return items.filter(predicate);
  }

  async create(data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>): Promise<T> {
    const items = await this.readRaw();
    const now = new Date();

    const newItem = {
      ...data,
      id: this.generateId(),
      createdAt: now,
      updatedAt: now,
    } as T;

    items.push(this.toStored(newItem));
    await this.save(items);
    return newItem;
  }

  async update(id: string, data: Partial<T>): Promise<T | null> {
    const items = await this.readRaw();
    const index = items.findIndex(item => item.id === id);

    if (index === -1) return null;

    const existing = this.fromStored(items[index]);
    const updated = {
      ...existing,
      ...data,
      id: existing.id, // Prevent ID change
      updatedAt: new Date(),
    } as T;

    items[index] = this.toStored(updated);
    await this.save(items);
    return updated;
  }

  async delete(id: string): Promise<boolean> {
    const items = await this.readRaw();
    const index = items.findIndex(item => item.id === id);

    if (index === -1) return false;

    items.splice(index, 1);
    await this.save(items);
    return true;
  }

  // Remove every item matching the predicate; returns how many were removed.
  // The predicate sees the stored form, so it must only read plain (unencrypted)
  // fields such as ids.
  async deleteMany(predicate: (item: T) => boolean): Promise<number> {
    const items = await this.readRaw();
    const kept = items.filter(item => !predicate(item));
    const removed = items.length - kept.length;
    if (removed > 0) await this.save(kept);
    return removed;
  }

  protected generateId(): string {
    return uuidv4();
  }
}
