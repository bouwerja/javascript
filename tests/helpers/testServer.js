import http from 'node:http';
import { UserModel } from '../../src/models/userModel.js';
import { createInMemoryModel } from './inMemoryModel.js';

/**
 * Authorization header accepted by the API in tests.
 *
 * TEMPORARY: src/middleware/auth.js currently accepts this hardcoded token.
 * When real authentication (e.g. JWT) replaces it, update ONLY this constant
 * (or switch to an injected test auth middleware); no test needs to change.
 */
export const TEST_AUTH_HEADER = { Authorization: 'Bearer valid-secret-token' };

/**
 * Starts the real Express app on a random free port, backed by in-memory models.
 * No database, no network beyond localhost.
 *
 *   const api = await startTestServer();
 *   const res = await api.request('GET', '/users');
 *   assert.equal(res.status, 200);
 *   await api.close();
 *
 * Returned object:
 *   request(method, path, { body, auth = true, headers })  -> { status, body, text, headers }
 *   models   the models the app is using (e.g. api.models.user)
 *   stores   in-memory store per model, for assertions (e.g. api.stores.user.auditLog)
 *   close()  stops the server; call it in afterEach / after
 *
 * Options:
 *   models   override or add models, e.g. { user: someOtherModel }
 *   config   passed to createApp (e.g. { apiPrefix: '/api/v2' })
 */
export async function startTestServer({ models = {}, config = {} } = {}) {
  // Imported here (not at the top of the file) so that model and controller tests,
  // which never start a server, keep working even if the app itself fails to load.
  const { createApp } = await import('../../src/app.js');

  const stores = {
    user: createInMemoryModel(UserModel),
  };

  const resolvedModels = {
    user: stores.user.model,
    ...models,
  };

  const apiPrefix = config.apiPrefix ?? '/api/v1';
  const app = createApp({ models: resolvedModels, config: { ...config, apiPrefix } });

  const server = http.createServer(app);
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });

  const baseURL = `http://127.0.0.1:${server.address().port}${apiPrefix}`;

  /**
   * Sends a request to the test server. Authenticated by default.
   * - Pass { auth: false } to test 401 responses.
   * - Pass a string body to send raw text (e.g. malformed JSON: body: '{bad').
   */
  async function request(method, path, { body, auth = true, headers = {} } = {}) {
    const response = await fetch(`${baseURL}${path}`, {
      method,
      headers: {
        ...(body !== undefined && { 'Content-Type': 'application/json' }),
        ...(auth && TEST_AUTH_HEADER),
        ...headers,
      },
      body: body === undefined ? undefined : typeof body === 'string' ? body : JSON.stringify(body),
    });

    const text = await response.text();
    let json = null;
    try {
      json = text ? JSON.parse(text) : null;
    } catch {
      // Not JSON (e.g. an HTML error page); `text` still holds the raw body.
    }

    return { status: response.status, headers: response.headers, body: json, text };
  }

  return {
    models: resolvedModels,
    stores,
    request,
    close: () => new Promise((resolve) => server.close(resolve)),
  };
}
