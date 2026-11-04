process.env.NODE_ENV = process.env.NODE_ENV || 'test';

import { db } from '../../src/config/db.js';

export async function resetTestDatabase() {
  if (typeof db.clear === 'function') {
    await db.clear('users');
  }
}