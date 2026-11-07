import '../../helpers/testSetup.js';
import { test, beforeEach, describe } from 'node:test';
import assert from 'node:assert/strict';
import { UserModel } from '../../../src/models/userModel.js';
import { initInMemoryDatabase } from '../../helpers/inMemoryDb.js';

describe('UserModel Direct Queries', () => {
  test('UserModel.findAll returns seeded test data', async () => {

    await initInMemoryDatabase({ usersCount: 25 });

    const allUsers = await UserModel.findAll();
    assert.equal(allUsers.length, 25);
  });
});