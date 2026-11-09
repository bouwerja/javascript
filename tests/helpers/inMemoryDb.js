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

    CREATE TABLE IF NOT EXISTS discord_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      discord_id INTERGER NOT NULL,
      discord_channel INTERGER NOT NULL,
      message_text TEXT NOT NULL,
      message_type_id INT NOT NULL,
      details JSON,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS discord_users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      discord_user_id INTERGER NOT NULL,
      display_name TEXT NOT NULL,
      is_registered BINARY,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_details JSON,
      updated_at DATETIME
    );

    CREATE TABLE IF NOT EXISTS event_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      event_date DATETIME DEFAULT CURRENT_TIMESTAMP,
      db_schema TEXT NOT NULL,
      table_name TEXT NOT NULL,
      operation_type TEXT NOT NULL,
      primary_key_id NOT NULL,
      change_data JSON
    )
  `);
}

export function resetInMemoryDatabase() {
    if (sqliteDb) {
        sqliteDb.exec('DELETE FROM users; DELETE FROM products;');
    }
}