import '../../helpers/testSetup.js';
import { test, beforeEach, describe } from 'node:test';
import assert from 'node:assert/strict';
import { DiscordModel } from '../../../src/models/discordModel.js';
import { initInMemoryDatabase } from '../../helpers/inMemoryDb.js';

describe('Discord Direct Queries', () => {
  test('DiscordModel.create returns seeded test data', async () => {

    await initInMemoryDatabase({ discordMessageCount: 25 });

    const allMessages = await DiscordModel.create();
    assert.equal(allUsers.length, 25);
  });
});