import { eq, desc } from "drizzle-orm";
import { discordMessages } from "../db/discord.js";
import { BaseModel } from "./baseModel.js";
import { ValidationError, NotFoundError, ResponseError } from "../errors.js";
import { messageTypes } from "../constants/messageTypes.js";

const MAX_PAGE_SIZE = 100;
const DISCORD_URL = "https://discord.com/api/v10";
const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;

export class DiscordModel extends BaseModel {
  constructor(db) {
    super(db, discordMessages);
  }

  toRecord(row) {
    return {
      id: row.id,
      discordId: row.discordId,
      discordChannel: row.discordChannel,
      messageText: row.messageText,
      messageType: row.messageType,
      details: row.details,
      createdAt: row.createdAt,
    };
  }

  async findByDiscordId(discordId) {
    const [row] = await this.db
      .select()
      .from(discordMessages)
      .where(eq(discordMessages.discordId, String(discordId)));

    if (!row) {
      throw new NotFoundError("no records found for discord_id.");
    }

    return this.toRecord(row);
  }

  async findRecent({ limit = 20 } = {}) {
    const rows = await this.db
      .select()
      .from(discordMessages)
      .orderBy(desc(discordMessages.createdAt))
      .limit(Math.min(Math.max(Number(limit) || 20, 1), MAX_PAGE_SIZE));

    return rows.map((row) => this.toRecord(row));
  }

  async recordSentMessage(apiMessage) {
    if (
      !apiMessage?.discordId ||
      !apiMessage?.discordChannel ||
      !apiMessage?.channelName
    ) {
      throw new ValidationError(
        "payload must include userId and channelId and channelName.",
      );
    }

    return this.insertRecord(
      {
        discordId: String(apiMessage.discordId),
        discordChannel: String(apiMessage.discordChannel),
        messageText: apiMessage.messageText ?? "",
        channelName: apiMessage.channelName,
        details: apiMessage.details,
      },
      { conflictMessage: "This Discord message has already been recorded." },
    );
  }

  async sendMessage(textMessage, channel, userId) {
    if (
      !textMessage ||
      textMessage?.length <= 1 ||
      typeof textMessage !== "string"
    ) {
      throw new ValidationError(
        "Input text message is required and must be a string value.",
      );
    }
    if (!userId || !Number.isInteger(userId)) {
      throw new ValidationError(
        "User ID is required and must be a integer value.",
      );
    }
    if (!channel || channel?.length <= 1 || typeof channel !== "string") {
      throw new ValidationError(
        "Channel is required and must be a string value.",
      );
    }

    let channelId = null;
    try {
      channelId = this.#getMessageTypes(channel);
    } catch (err) {
      throw err;
    }

    const url = DISCORD_URL + `/channels/${channelId}/messages`;

    const payload = {
      content: textMessage,
      tts: false,
      allowed_mentions: { parse: [] },
    };

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bot ${DISCORD_BOT_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new ResponseError(
        `Discord API request failed (${response.status}). `,
        response.status,
      );
    }

    try {
      this.recordSentMessage({
        discordId: userId,
        discordChannel: channelId,
        messageText: textMessage,
        channelName: channel,
        details: payload,
      });
    } catch (err) {
      throw err;
    }
  }

  #getMessageTypes(messageType) {
    try {
      if (!Object.hasOwn(messageTypes, messageType)) {
        throw new Error("Message type not included in valid types.");
      }

      return messageTypes[messageType];
    } catch (error) {
      throw new Error(error.message);
    }
  }
}
