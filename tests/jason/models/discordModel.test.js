/**
 * MODEL TEST: DiscordModel with in-memory storage.
 *
 * No Discord API calls are made here: DiscordModel only records messages that
 * a job has already sent. The schema's unique index on discord_id is enforced.
 */
import { describe, test } from "node:test";
import assert from "node:assert/strict";

import { DiscordModel } from "../../../src/models/discordModel.js";
import { ConflictError, ValidationError } from "../../../src/errors.js";
import { createInMemoryModel } from "../../helpers/index.js";

describe("DiscordModel", () => {
  describe("recordSentMessage", () => {
    test("sending discord message", async () => {
      const { model } = createInMemoryModel(DiscordModel);

      await model.sendMessage(
        "This is a test message",
        "DISCORD_GENERAL_CHANNEL",
        1,
      );
    });

    test("stores the message with its 64-bit Discord ids intact", async () => {
      const { model } = createInMemoryModel(DiscordModel);

      const payload = {
        discordId: "1",
        discordChannel: "123",
        messageText: "This is a test",
        channelName: "DISCORD_GENERAL_CHANNEL",
        details: {
          discordId: 1,
          discordChannel: 123,
          messageText: "This is a test",
          channelName: "DISCORD_GENERAL_CHANNEL",
        },
      };
      const record = await model.recordSentMessage(payload);

      assert.equal(record.discordId, payload.discordId);
      assert.equal(record.discordChannel, payload.discordChannel);
      assert.equal(record.messageText, payload.messageText);
      assert.deepEqual(record.details, payload.details);
    });

    test("rejects recording the same Discord message twice", async () => {
      const { model } = createInMemoryModel(DiscordModel);

      const payload = {
        discordId: 1,
        discordChannel: 123,
        messageText: "This is a test",
        channelName: "GENERAL_MESSAGE",
        details: {
          discordId: 1,
          discordChannel: 123,
          messageText: "This is a test",
          channelName: "GENERAL_MESSAGE",
        },
      };

      await model.recordSentMessage(payload);

      await assert.rejects(model.recordSentMessage(payload), ConflictError);
    });

    test("rejects a message without an id", async () => {
      const { model } = createInMemoryModel(DiscordModel);

      await assert.rejects(
        model.recordSentMessage({ discordChannel: "1" }),
        ValidationError,
      );
    });
  });
});
