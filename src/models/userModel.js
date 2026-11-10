import { eq, and, like, desc } from 'drizzle-orm';
import { users } from '../db/users.js';
import { BaseModel } from './baseModel.js';
import { ValidationError } from '../errors.js';

export const USER_ROLES = Object.freeze(['user', 'admin']);
const MAX_PAGE_SIZE = 100;


export class UserModel extends BaseModel {
  constructor(db) {
    super(db, users);
  }


  toRecord(row) {
    return {
      id: row.id,
      name: row.name,
      email: row.email,
      role: row.role,
      createdAt: row.createdAt,
    };
  }


  async findByEmail(email) {
    const [row] = await this.db
      .select()
      .from(users)
      .where(eq(users.email, normaliseEmail(email)));
    return row ? this.toRecord(row) : null;
  }

  async search({ searchTerm, role, limit = 10, offset = 0 } = {}) {
    const conditions = [];

    if (searchTerm) {
      conditions.push(like(users.email, `%${escapeLike(searchTerm.trim().toLowerCase())}%`));
    }
    if (role) {
      conditions.push(eq(users.role, assertRole(role)));
    }

    const rows = await this.db
      .select()
      .from(users)
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(desc(users.createdAt))
      .limit(toBoundedInt(limit, { min: 1, max: MAX_PAGE_SIZE, fallback: 10 }))
      .offset(toBoundedInt(offset, { min: 0, max: Number.MAX_SAFE_INTEGER, fallback: 0 }));

    return rows.map((row) => this.toRecord(row));
  }


  async create({ name, email, role = 'user' }) {
    return this.insertRecord(
      {
        name: normaliseName(name),
        email: normaliseEmail(email),
        role: assertRole(role),
      },
      { conflictMessage: 'A user with this email already exists' },
    );
  }

  async update(id, { name, email, role } = {}) {
    const changes = {
      ...(name !== undefined && { name: normaliseName(name) }),
      ...(email !== undefined && { email: normaliseEmail(email) }),
      ...(role !== undefined && { role: assertRole(role) }),
    };

    if (Object.keys(changes).length === 0) {
      throw new ValidationError('No fields to update');
    }

    return this.updateRecord(id, changes, {
      conflictMessage: 'A user with this email already exists',
    });
  }

  async delete(id) {
    return this.deleteRecord(id);
  }
}

/* ---------- Data rules (module-private helpers) ---------- */

function normaliseName(name) {
  if (typeof name !== 'string' || name.trim() === '') {
    throw new ValidationError('Name must be a non-empty string');
  }
  return name.trim();
}

function normaliseEmail(email) {
  if (typeof email !== 'string' || email.trim() === '') {
    throw new ValidationError('Email must be a non-empty string');
  }
  return email.trim().toLowerCase();
}

function assertRole(role) {
  if (!USER_ROLES.includes(role)) {
    throw new ValidationError(`Role must be one of: ${USER_ROLES.join(', ')}`);
  }
  return role;
}

function escapeLike(value) {
  return value.replace(/[\\%_]/g, '\\$&');
}

function toBoundedInt(value, { min, max, fallback }) {
  const n = Number(value);
  if (!Number.isInteger(n)) return fallback;
  return Math.min(Math.max(n, min), max);
}
