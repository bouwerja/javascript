import mysql from 'mysql2/promise';
import { drizzle } from 'drizzle-orm/mysql2';
import * as schema from '../db/index.js';
import { initialTables } from '../db/test/index.js';

const isDevOrTest = ['development', 'test'].includes(process.env.NODE_ENV || 'development');

class InMemoryAdapter {
  constructor(seedData = initialTables) {
    this.seedData = seedData;
    this.resetAll();
  }

  getClient() {
    return null;
  }

  resetAll() {
    this.tables = JSON.parse(JSON.stringify(this.seedData));
  }

  async select(tableName, filterFn = null) {
    const data = this.tables[tableName] || [];
    return filterFn ? data.filter(filterFn) : [...data];
  }

  async insert(tableName, record) {
    if (!this.tables[tableName]) this.tables[tableName] = [];
    const newRecord = { id: Date.now(), ...record };
    this.tables[tableName].push(newRecord);
    return newRecord;
  }

  async clear(tableName) {
    this.tables[tableName] = [];
  }
}

class DrizzleAdapter {
  constructor() {
    this.client = null;
    this.drizzle = null;
  }

  getDrizzle() {
    if (!this.drizzle) {
      this.client = mysql.createPool({
        host: process.env.DB_HOST || '127.0.0.1',
        port: Number(process.env.DB_PORT) || 3306,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        connectionLimit: Number(process.env.DB_CONNECTION_LIMIT) || 10
      });

      this.drizzle = drizzle(this.client, { schema, mode: 'default' });
    }
    return this.drizzle;
  }

  getClient() {
    return this.getDrizzle();
  }

  async select(tableName, filterFn = null) {
    const tableSchema = schema[tableName];
    if (!tableSchema) {
      throw new Error(`Table schema for "${tableName}" not found in src/db/schema/index.js`);
    }

    const db = this.getDrizzle();
    const rows = await db.select().from(tableSchema);
    return filterFn ? rows.filter(filterFn) : rows;
  }

  async insert(tableName, record) {
    const tableSchema = schema[tableName];
    if (!tableSchema) {
      throw new Error(`Table schema for "${tableName}" not found in src/db/schema/index.js`);
    }

    const db = this.getDrizzle();
    const [result] = await db.insert(tableSchema).values(record);
    return { id: result.insertId, ...record };
  }

  async clear(tableName) {
    const tableSchema = schema[tableName];
    if (tableSchema) {
      const db = this.getDrizzle();
      await db.delete(tableSchema);
    }
  }
}

export const db = isDevOrTest ? new InMemoryAdapter() : new DrizzleAdapter();