import '../../helpers/testSetup.js';
import { test, beforeEach, describe } from 'node:test';
import assert from 'node:assert/strict';
import { getUserById, createUser } from '../../../src/controllers/userController.js';
import { UserModel } from '../../../src/models/userModel.js';
import { resetTestDatabase } from '../../helpers/testSetup.js';

function createMockRes() {
  return {
    statusCode: null,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(data) {
      this.body = data;
      return this;
    }
  };
}

describe('Jason > Controller Tests', () => {
  beforeEach(async () => {
    await resetTestDatabase();
  });

  test('getUserById outputs 200 JSON payload for seeded user', async () => {
    const seeded = await UserModel.create({ name: 'Alex', email: 'alex@example.com' });
    const req = { params: { id: seeded.id } };
    const res = createMockRes();
    let err = null;

    await getUserById(req, res, (e) => { err = e; });

    assert.equal(err, null);
    assert.equal(res.statusCode, 200);
    assert.equal(res.body.data.name, 'Alex');
  });

  test('createUser forwards 400 error to next middleware when payload is incomplete', async () => {
    const req = { body: { name: 'No Email User' } };
    const res = createMockRes();
    let capturedErr = null;

    await createUser(req, res, (err) => { capturedErr = err; });

    assert.ok(capturedErr);
    assert.equal(capturedErr.statusCode, 400);
  });
});