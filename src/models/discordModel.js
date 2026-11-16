import { eq, desc } from "drizzle-orm";
import { discordMessages } from "../db/discord.js";
import { BaseModel } from "./baseModel.js";
import { ValidationError, NotFoundError, ResponseError } from "../errors.js";

const MAX_PAGE_SIZE = 100;
const DISCROD_URL = "https://discord.com/api/v10";
const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;

const MESSAGE_TYPE_GENERAL = 1;

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

  async recordSentMessage(apiMessage, { messageType }) {
    if (!apiMessage?.id || !apiMessage?.channel_id) {
      throw new ValidationError("apiMessage must include id and channel_id.");
    }

    if (!Number.isInteger(messageType)) {
      throw new ValidationError("messageType must be an integer.");
    }

    if (!apiMessage?.content || apiMessage.content.length <= 1) {
      throw new ValidationError("apiMessage needs to contain content.");
    }

    return this.insertRecord(
      {
        discordId: String(apiMessage.id),
        discordChannel: String(apiMessage.channel_id),
        messageText: apiMessage.content ?? "",
        messageType,
        details: apiMessage,
      },
      { conflictMessage: "This Discord message has already been recorded." },
    );
  }

  async sendDiscordMessage(apiMessage, messageType) {
    if (!apiMessage?.channelId) {
      throw new ValidationError("channelId is required.");
    }
    if (!apiMessage?.content || apiMessage.content.length <= 1) {
      throw new ValidationError("contnet is required.");
    }
    if (!Number.isInteger(apiMessage?.messageType)) {
      throw new ValidationError("messageType must be integer.");
    }

    const url = DISCROD_URL + `/channels/${apiMessage.channel_id}/messages`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bot ${DISCORD_BOT_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        content: apiMessage.content,
        tts: false,
        allowed_mentions: { parse: [] },
      }),
    });

    const text = await response.text();
    let data = text ? JSON.parse(text) : null;

    if (!response.ok) {
      const detail = data?.message ?? "no error message returned";
      throw new ResponseError(
        `Discord API request failed (${response.status}: ${detail}). Status: `,
        502,
        { cause: { discordStatus: response.status, body: data ?? text } },
      );
    }

    try {
      return await this.recordSentMessage(data, { messageType });
    } catch (err) {
      console.error(
        `Discord message ${data?.id} was sent but could not be recorded.`,
      );
      throw err;
    }
  }
}
