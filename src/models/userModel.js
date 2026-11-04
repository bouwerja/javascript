// src/models/userModel.js
import { db } from '../config/db.js';

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

  static async create(userData) {
    const record = await db.insert('users', userData);
    return new UserModel(record);
  }
}