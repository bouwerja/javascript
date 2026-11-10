/**
 * MODEL TEST: tests a real model with in-memory storage (no database).
 *
 * The real UserModel code runs (normalisation, validation, toRecord).
 * Only BaseModel's storage is swapped for memory, and it enforces the
 * rules from the Drizzle schema (NOT NULL, lengths, UNIQUE, defaults).
 */
import { describe, test } from 'node:test';
import assert from 'node:assert/strict';

import { UserModel } from '../../../src/models/userModel.js';
import { ConflictError, ValidationError } from '../../../src/errors.js';
import { createInMemoryModel, buildUser } from '../../helpers/index.js';

describe('UserModel', () => {
  describe('create', () => {
    test('normalises name and email, and applies schema defaults', async () => {
      const { model } = createInMemoryModel(UserModel);

      const user = await model.create({ name: '  Alex  ', email: '  ALEX@Example.com ' });

      assert.equal(user.name, 'Alex');
      assert.equal(user.email, 'alex@example.com');
      assert.equal(user.role, 'user');
      assert.ok(Number.isInteger(user.id));
      assert.ok(user.createdAt instanceof Date);
    });

    test('writes one INSERT entry to the audit log', async () => {
      const { model, auditLog } = createInMemoryModel(UserModel);

      const user = await model.create(buildUser());

      assert.equal(auditLog.length, 1);
      assert.equal(auditLog[0].operationType, 'INSERT');
      assert.equal(auditLog[0].tableName, 'users');
      assert.equal(auditLog[0].primaryKeyId, user.id);
    });

    test('rejects a duplicate email, regardless of case', async () => {
      const { model } = createInMemoryModel(UserModel);
      await model.create(buildUser({ email: 'dup@example.com' }));

      await assert.rejects(
        model.create(buildUser({ email: 'DUP@example.com' })),
        ConflictError,
      );
    });

    test('rejects an unknown role and stores nothing', async () => {
      const { model, rows } = createInMemoryModel(UserModel);

      await assert.rejects(model.create(buildUser({ role: 'superuser' })), ValidationError);
      assert.equal(rows().length, 0);
    });
  });

  describe('findById', () => {
    test('returns null when the user does not exist', async () => {
      const { model } = createInMemoryModel(UserModel);

      assert.equal(await model.findById(999), null);
    });
  });

  describe('update', () => {
    test('returns null for a missing user', async () => {
      const { model } = createInMemoryModel(UserModel);

      assert.equal(await model.update(999, { name: 'Nobody' }), null);
    });

    test('rejects an update with no fields', async () => {
      const { model } = createInMemoryModel(UserModel);
      const user = await model.create(buildUser());

      await assert.rejects(model.update(user.id, {}), ValidationError);
    });
  });

  describe('delete', () => {
    test('returns true the first time and false afterwards', async () => {
      const { model } = createInMemoryModel(UserModel);
      const user = await model.create(buildUser());

      assert.equal(await model.delete(user.id), true);
      assert.equal(await model.delete(user.id), false);
    });
  });
});
