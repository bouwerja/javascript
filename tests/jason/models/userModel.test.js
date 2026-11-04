import '../../helpers/testSetup.js';
import { test, beforeEach, describe } from 'node:test';
import assert from 'node:assert/strict';
import { UserModel } from '../../../src/models/userModel.js';
import { resetTestDatabase } from '../../helpers/testSetup.js';

describe('Jason > Model Tests', () => {
  beforeEach(async () => {
    await resetTestDatabase();
  });

  test('UserModel.create writes to in-memory DB and returns class instance', async () => {
    const user = await UserModel.create({
      name: 'Jason Model Test',
      email: 'jason.model@example.com'
    });

    assert.ok(user instanceof UserModel);
    assert.equal(user.name, 'Jason Model Test');

    const fetched = await UserModel.findById(user.id);
    assert.equal(fetched.email, 'jason.model@example.com');
  });
});