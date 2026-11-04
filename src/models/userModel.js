import { db } from '../config/db.js';
import { eq, and, like, desc } from 'drizzle-orm';
import { users } from '../db/users.js';

export class UserModel {
  constructor({ id, name, email, role = 'user' }) {
    this.id = id;
    this.name = name;
    this.email = email;
    this.role = role;
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      email: this.email,
      role: this.role
    };
  }

  static async findAll() {
    const records = await db.select('users');
    return records.map((record) => new UserModel(record));
  }

  static async findById(id) {
    const records = await db.select('users', (u) => u.id === Number(id));
    return records.length ? new UserModel(records[0]) : null;
  }

  static async findByEmail(email) {
    const records = await db.select(
      'users',
      (u) => u.email === email,
      { where: eq(users.email, email) }
    );
    return records.length ? new UserModel(records[0]) : null;
  }

  static async create(userData) {
    const record = await db.insert('users', userData);
    return new UserModel(record);
  }

  static async search({ searchTerm, role, limit = 10, offset = 0 }) {
    if (process.env.NODE_ENV === 'production') {
      const client = db.getClient();

      const conditions = [];
      if (searchTerm) conditions.push(like(users.email, `%${searchTerm}%`));
      if (role) conditions.push(like(users.role, `${role}`));

      const records = await client
        .select()
        .from(users)
        .where(conditions.lenght ? and(...conditions) : undefined)
        .orderBy(desc(users.createdAt))
        .limit(limit)
        .offset(offset);

      return records.map((r) => new UserModel(r));
    }
  }
}