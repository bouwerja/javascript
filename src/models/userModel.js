import { eq, and, like, desc } from 'drizzle-orm';
import { db, users } from '../db/index.js';

export class UserModel {
  constructor({ id, name, email, role = 'user', createdAt = null }) {
    this.id = id;
    this.name = name;
    this.email = email;
    this.role = role;
    this.createdAt = createdAt;
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      email: this.email,
      role: this.role,
      createdAt: this.createdAt
    };
  }

  static async findAll() {
    const rows = await db.select().from(users);
    return rows.map((row) => new UserModel(row));
  }

  static async findById(id) {
    const [row] = await db.select().from(users).where(eq(users.id, Number(id)));
    return row ? new UserModel(row) : null;
  }

  static async create(userData) {
    const [result] = await db.insert(users).values(userData);
    const newId = result.insertId || result.id;
    return new UserModel({ id: newId, ...userData });
  }

  static async delete(id) {
    await db.delete(users).where(eq(users.id, Number(id)));
    return true;
  }

  static async search({ searchTerm, role, limit = 10, offset = 0 }) {
    const conditions = [];

    if (searchTerm) {
      conditions.push(like(users.email, `%${searchTerm}%`));
    }
    if (role) {
      conditions.push(eq(users.role, role));
    }

    const rows = await db
      .select()
      .from(users)
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(desc(users.createdAt))
      .limit(limit)
      .offset(offset);

    return rows.map((row) => new UserModel(row));
  }
}