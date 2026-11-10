/**
 * INTEGRATION TEST: the real app over HTTP (routing, auth, controllers,
 * models and the error handler together), with in-memory storage.
 *
 * A fresh server and fresh data are created for every test.
 */
import { describe, test, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';

import { startTestServer, buildUser } from '../../helpers/index.js';

describe('Users API', () => {
  let api;

  beforeEach(async () => {
    api = await startTestServer();
  });

  afterEach(async () => {
    await api.close();
  });

  describe('authentication', () => {
    test('GET /health is public', async () => {
      const res = await api.request('GET', '/health', { auth: false });

      assert.equal(res.status, 200);
      assert.deepEqual(res.body, { status: 'ok' });
    });

    test('GET /users without a token responds 401', async () => {
      const res = await api.request('GET', '/users', { auth: false });

      assert.equal(res.status, 401);
    });
  });

  describe('POST /users', () => {
    test('creates a user (201) and audits it', async () => {
      const res = await api.request('POST', '/users', {
        body: buildUser({ email: 'New.User@Example.com' }),
      });

      assert.equal(res.status, 201);
      assert.equal(res.body.data.email, 'new.user@example.com');
      assert.equal(api.stores.user.auditLog.length, 1);
    });

    test('responds 409 for a duplicate email', async () => {
      const body = buildUser({ email: 'dup@example.com' });
      await api.request('POST', '/users', { body });

      const res = await api.request('POST', '/users', { body });

      assert.equal(res.status, 409);
      assert.match(res.body.error.message, /already exists/);
    });

    test('responds 400 for malformed JSON', async () => {
      const res = await api.request('POST', '/users', { body: '{bad json' });

      assert.equal(res.status, 400);
    });
  });

  describe('GET /users/:id', () => {
    test('responds 200 with the user', async () => {
      const user = await api.models.user.create(buildUser({ name: 'Alex' }));

      const res = await api.request('GET', `/users/${user.id}`);

      assert.equal(res.status, 200);
      assert.equal(res.body.data.name, 'Alex');
    });

    test('responds 404 for a missing user', async () => {
      const res = await api.request('GET', '/users/999');

      assert.equal(res.status, 404);
    });
  });

  describe('error handling', () => {
    test('unexpected errors respond 500 without leaking details, and are logged', async (t) => {
      const consoleError = t.mock.method(console, 'error', () => {});
      t.mock.method(api.models.user, 'findAll', async () => {
        throw new Error('ER_ACCESS_DENIED on table secret_internal_table');
      });

      const res = await api.request('GET', '/users');

      assert.equal(res.status, 500);
      assert.equal(res.body.error.message, 'Internal Server Error');
      assert.doesNotMatch(res.text, /secret_internal_table/);
      assert.equal(consoleError.mock.callCount(), 1);
    });

    test('unknown routes respond 404', async () => {
      const res = await api.request('GET', '/does-not-exist');

      assert.equal(res.status, 404);
    });
  });
});
