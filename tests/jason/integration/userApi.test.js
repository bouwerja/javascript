import '../../helpers/testSetup.js';
import { test, beforeEach, after, describe } from 'node:test';
import assert from 'node:assert/strict';
import app from '../../../src/app.js';
import { resetTestDatabase } from '../../helpers/testSetup.js';

describe('Jason > Integration Tests', () => {
  let server;
  let baseURL;

  beforeEach(async () => {
    await resetTestDatabase();
    await new Promise((resolve) => {
      server = app.listen(0, () => {
        const port = server.address().port;
        baseURL = `http://localhost:${port}/api/v1`;
        resolve();
      });
    });
  });

  after(() => {
    if (server) server.close();
  });

  test('POST /api/v1/users creates user and returns 201', async () => {
    const res = await fetch(`${baseURL}/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer dev-token'
      },
      body: JSON.stringify({ name: 'Integration User', email: 'integration@example.com' })
    });

    const body = await res.json();
    assert.equal(res.status, 201);
    assert.equal(body.success, true);
    assert.equal(body.data.name, 'Integration User');
  });
});