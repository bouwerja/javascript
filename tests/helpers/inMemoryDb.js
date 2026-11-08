import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { setTestDb, schema } from '../../src/db/index.js';
import { seedTestDatabase } from './seeder.js';

let sqliteDb;

export async function initInMemoryDatabase(seedConfig = {}) {
    sqliteDb = new Database(':memory:');

    sqliteDb.function('now', () => new Date().toISOString().slice(0, 19).replace('T', ' '));

    const testDrizzleClient = drizzle(sqliteDb, { schema });

    setTestDb(testDrizzleClient);

    createTablesFromSchema(sqliteDb);

    await seedTestDatabase(testDrizzleClient, seedConfig);

    return testDrizzleClient;
}

function createTablesFromSchema(sqliteInstance) {
    sqliteInstance.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      role TEXT DEFAULT 'user',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      price REAL NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS discord_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      message_text TEXT NOT NULL,
      message_type INT NOT NULL,
      details JSON,
      created_at TIMESTAMP NOT NULL,
    )
  `);
}

export function resetInMemoryDatabase() {
    if (sqliteDb) {
        sqliteDb.exec('DELETE FROM users; DELETE FROM products;');
    }
}