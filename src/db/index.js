import mysql from 'mysql2/promise';
import { drizzle } from 'drizzle-orm/mysql2';
import * as usersSchema from './users.js';
import * as discordSchema from './discord.js';
import * as eventLogSchema from './eventLog.js';

export * from './users.js';
export * from './discord.js';
export * from './eventLog.js';

export const schema = {
  ...usersSchema,
  ...discordSchema,
  ...eventLogSchema,
};

let dbInstance = null;

if (process.env.NODE_ENV !== 'test') {
  const pool = mysql.createPool({
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'express_dev_db',
    connectionLimit: 10
  });

  dbInstance = drizzle(pool, { schema, mode: 'default' });
}

export function setTestDb(client) {
  dbInstance = client;
}

export const db = new Proxy({}, {
  get(_, prop) {
    if (!dbInstance) {
      throw new Error('Database instance has not been initialized.');
    }
    return dbInstance[prop];
  }
});