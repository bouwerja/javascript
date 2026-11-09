import '../../helpers/testSetup.js';
import { test, beforeEach, describe } from 'node:test';
import assert from 'node:assert/strict';
import { DiscordModel } from '../../../src/models/discordModel.js';
import { initInMemoryDatabase } from '../../helpers/inMemoryDb.js';
import { eq } from 'drizzle-orm';
import { db, eventLog } from '../../../src/db/index.js';

describe('Discord Direct Queries', () => {
  test('DiscordModel.sendMessage', async () => {

    // await initInMemoryDatabase({ discordMessageCount: 25 });

    const messageDetails = {
      messageType: 1,
      payload: {
        content: "Hello <@452846771098484736>! This is test 2 message.",
        tts: false,
        embeds: [],
        allowed_mentions: {
          parse: ["users"],
        },
      }
    }

    const message = await DiscordModel.sendMessage(messageDetails);
    console.log(message);

    const sqlResults = await db.select().from(eventLog).where(eq(eventLog.eventId, message));
    console.log(sqlResults);
  });

  test('DiscordModel.getLastUserMessage', async () => {
    const message = await DiscordModel.getLastUserMessage();
    console.log(message);
  })
});