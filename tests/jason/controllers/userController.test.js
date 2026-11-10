/**
 * CONTROLLER TEST: calls controller functions directly (no HTTP server).
 *
 * Use these for request-handling logic: input validation, status codes,
 * response shape. In Express 5 controllers throw errors, so failures are
 * tested with assert.rejects().
 */
import { describe, test } from 'node:test';
import assert from 'node:assert/strict';

import { createUserController } from '../../../src/controllers/userController.js';
import { UserModel } from '../../../src/models/userModel.js';
import { NotFoundError, ValidationError } from '../../../src/errors.js';
import {
  createInMemoryModel,
  buildUser,
  mockRequest,
  mockResponse,
} from '../../helpers/index.js';

/** A controller backed by a fresh in-memory UserModel. */
function setup() {
  const { model } = createInMemoryModel(UserModel);
  return { userModel: model, controller: createUserController({ userModel: model }) };
}

describe('userController', () => {
  describe('getById', () => {
    test('responds 200 with the user', async () => {
      const { userModel, controller } = setup();
      const user = await userModel.create(buildUser({ name: 'Alex' }));
      const res = mockResponse();

      await controller.getById(mockRequest({ params: { id: String(user.id) } }), res);

      assert.equal(res.statusCode, 200);
      assert.equal(res.body.success, true);
      assert.equal(res.body.data.name, 'Alex');
    });

    test('throws NotFoundError for a missing user', async () => {
      const { controller } = setup();

      await assert.rejects(
        controller.getById(mockRequest({ params: { id: '999' } }), mockResponse()),
        NotFoundError,
      );
    });

    test('throws ValidationError for a non-numeric id', async () => {
      const { controller } = setup();

      await assert.rejects(
        controller.getById(mockRequest({ params: { id: 'abc' } }), mockResponse()),
        ValidationError,
      );
    });
  });

  describe('create', () => {
    test('responds 201 and ignores a role supplied in the body', async () => {
      const { controller } = setup();
      const res = mockResponse();

      await controller.create(mockRequest({ body: buildUser({ role: 'admin' }) }), res);

      assert.equal(res.statusCode, 201);
      assert.equal(res.body.data.role, 'user');
    });

    test('throws ValidationError when the body is missing', async () => {
      const { controller } = setup();

      await assert.rejects(
        controller.create(mockRequest({ body: undefined }), mockResponse()),
        ValidationError,
      );
    });

    test('throws ValidationError for an invalid email', async () => {
      const { controller } = setup();

      await assert.rejects(
        controller.create(mockRequest({ body: buildUser({ email: 'not-an-email' }) }), mockResponse()),
        ValidationError,
      );
    });
  });
});
