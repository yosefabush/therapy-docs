import { v4 as uuidv4 } from 'uuid';
import { readJsonFile, writeJsonFile } from '../json-store';
import { Repository } from '../types';

export abstract class JsonRepository<T extends { id: string; createdAt?: Date; updatedAt?: Date }>
  implements Repository<T> {

  constructor(protected readonly filename: string) {}

  async findAll(): Promise<T[]> {
    return readJsonFile<T>(this.filename);
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
    await writeJsonFile(this.filename, items);
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

    await writeJsonFile(this.filename, items);
    return items[index];
  }

  async delete(id: string): Promise<boolean> {
    const items = await this.findAll();
    const index = items.findIndex(item => item.id === id);

    if (index === -1) return false;

    items.splice(index, 1);
    await writeJsonFile(this.filename, items);
    return true;
  }

  protected generateId(): string {
    return uuidv4();
  }
}
