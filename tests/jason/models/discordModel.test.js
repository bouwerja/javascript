/**
 * MODEL TEST: DiscordModel with in-memory storage.
 *
 * No Discord API calls are made here: DiscordModel only records messages that
 * a job has already sent. The schema's unique index on discord_id is enforced.
 */
import { describe, test } from 'node:test';
import assert from 'node:assert/strict';

import { DiscordModel } from '../../../src/models/discordModel.js';
import { ConflictError, ValidationError } from '../../../src/errors.js';
import { createInMemoryModel, buildDiscordApiMessage } from '../../helpers/index.js';

describe('DiscordModel', () => {
  describe('recordSentMessage', () => {
    test('stores the message with its 64-bit Discord ids intact', async () => {
      const { model } = createInMemoryModel(DiscordModel);
      const apiMessage = buildDiscordApiMessage();

      const record = await model.recordSentMessage(apiMessage, { messageType: 1 });

      assert.equal(record.discordId, apiMessage.id);
      assert.equal(record.discordChannel, apiMessage.channel_id);
      assert.equal(record.messageText, apiMessage.content);
      assert.deepEqual(record.details, apiMessage);
    });

    test('rejects recording the same Discord message twice', async () => {
      const { model } = createInMemoryModel(DiscordModel);
      const apiMessage = buildDiscordApiMessage();
      await model.recordSentMessage(apiMessage, { messageType: 1 });

      await assert.rejects(
        model.recordSentMessage(apiMessage, { messageType: 1 }),
        ConflictError,
      );
    });

    test('rejects a message without an id', async () => {
      const { model } = createInMemoryModel(DiscordModel);

      await assert.rejects(
        model.recordSentMessage({ channel_id: '1' }, { messageType: 1 }),
        ValidationError,
      );
    });

    test('rejects text longer than the column allows (2 000 characters)', async () => {
      const { model } = createInMemoryModel(DiscordModel);
      const apiMessage = buildDiscordApiMessage({ content: 'x'.repeat(2001) });

      await assert.rejects(
        model.recordSentMessage(apiMessage, { messageType: 1 }),
        { code: 'ER_DATA_TOO_LONG' },
      );
    });
  });
});
