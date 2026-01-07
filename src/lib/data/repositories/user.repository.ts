import { User } from '@/types';
import { JsonRepository } from './base.repository';

class UserJsonRepository extends JsonRepository<User> {
  constructor() {
    super('users.json');
  }

  async findByEmail(email: string): Promise<User | null> {
    const users = await this.findAll();
    return users.find(u => u.email === email) ?? null;
  }

  protected generateId(): string {
    return `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

export const userRepository = new UserJsonRepository();
