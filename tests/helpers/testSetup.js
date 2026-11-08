import { before, beforeEach } from 'node:test';
import { initInMemoryDatabase, resetInMemoryDatabase } from './inMemoryDb.js';

process.env.NODE_ENV = process.env.NODE_ENV || 'test';

before(async () => {
  await initInMemoryDatabase();
});

beforeEach(async () => {
  resetInMemoryDatabase();
});

export async function resetTestDatabase() {
  resetInMemoryDatabase();
}