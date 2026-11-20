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

  private save(items: T[]): Promise<void> {
    return writeJsonFile(this.filename, items.map((item) => this.toStored(item)));
  }

  async findAll(): Promise<T[]> {
    const items = await readJsonFile<T>(this.filename);
    return items.map((item) => this.fromStored(item));
  }

  async findById(id: string): Promise<T | null> {
    const items = await this.findAll();
    return items.find(item => item.id === id) ?? null;
  }

  async findMany(predicate: (item: T) => boolean): Promise<T[]> {
    const items = await this.findAll();
    return items.filter(predicate);
  }

  async create(data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>): Promise<T> {
    const items = await this.findAll();
    const now = new Date();

    const newItem = {
      ...data,
      id: this.generateId(),
      createdAt: now,
      updatedAt: now,
    } as T;

    items.push(newItem);
    await this.save(items);
    return newItem;
  }

  async update(id: string, data: Partial<T>): Promise<T | null> {
    const items = await this.findAll();
    const index = items.findIndex(item => item.id === id);

    if (index === -1) return null;

    items[index] = {
      ...items[index],
      ...data,
      id: items[index].id, // Prevent ID change
      updatedAt: new Date(),
    };

    await this.save(items);
    return items[index];
  }

  async delete(id: string): Promise<boolean> {
    const items = await this.findAll();
    const index = items.findIndex(item => item.id === id);

    if (index === -1) return false;

    items.splice(index, 1);
    await this.save(items);
    return true;
  }

  protected generateId(): string {
    return uuidv4();
  }
}
