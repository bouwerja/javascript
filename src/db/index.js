import mysql from 'mysql2/promise';
import { drizzle } from 'drizzle-orm/mysql2';
import * as usersSchema from './users.js';
import * as discordSchema from './discord.js';
import * as eventLogSchema from './eventLog.js';

export const IS_DEV = process.env.NODE_ENV;

export const schema = { ...usersSchema, ...discordSchema, ...eventLogSchema };

const mockQuery = async (sqlOrOptions, params = []) => {
  const isObject = typeof sqlOrOptions === 'object' && sqlOrOptions !== null;
  const sql = isObject ? sqlOrOptions.sql : sqlOrOptions;
  const values = isObject ? sqlOrOptions.values || [] : params;
  const formattedSql = mysql.format(sql, values);

  if (isObject && sqlOrOptions.rowsAsArray) {
    console.log('\n' + formattedSql);
    return [[[formattedSql]], []];
  }

  return [[{ sql: formattedSql, rawSql: sql, values }], []];
}

const mockPool = {
  query: mockQuery,
  execute: mockQuery,
  getConnection: async () => ({
    query: mockQuery,
    execute: mockQuery,
    beginTransaction: async () => { },
    commit: async () => { },
    rollback: async () => { },
    release: () => { },
  }),
  end: async () => { },
};

export const pool =
  IS_DEV === 'development' ? mockPool
    : mysql.createPool({
      host: process.env.DB_HOST || '127.0.0.1',
      port: Number(process.env.DB_PORT) || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'express_dev_db',
      connectionLimit: 10,
    });

export const db = drizzle(pool, { schema, mode: 'default' });
