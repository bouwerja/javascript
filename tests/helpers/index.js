/**
 * Everything a test needs, from one import:
 *
 *   import { createInMemoryModel, buildUser, startTestServer } from '../../helpers/index.js';
 *
 * See tests/README.md for when to use each helper.
 */

// Models: a real model whose storage is in memory (no database).
export { createInMemoryModel } from './inMemoryModel.js';

// Test data with unique values.
export { buildUser, buildDiscordApiMessage } from './builders.js';

// Controller tests: call controllers directly.
export { mockRequest, mockResponse } from './httpMocks.js';

// Integration tests: the real app over HTTP.
export { startTestServer, TEST_AUTH_HEADER } from './testServer.js';
