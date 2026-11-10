import { BaseModel } from './baseModel.js';
import { db, discordMessages } from "../db/index.js";
import { eq } from 'drizzle-orm';

const BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
const GENERAL_CHANNEL = process.env.DISCORD_GENERAL_CHANNEL_ID

export class DiscordModel extends BaseModel {
  constructor({ id, message, type, details, createdAt }) {
    super({ id, createdAt });
    this.message = message;
    this.type = type;
    this.details = details;
  }

  static async sendMessage(content) {

    const payload = content.payload;

    const response = await fetch(`https://discord.com/api/v10/channels/${GENERAL_CHANNEL}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bot ${BOT_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Discord API Error [${response.status}]: ${JSON.stringify(errorData)}`);
    }

    const rawResult = await response.json();

    const insertValues = {
      discordId: rawResult.id,
      discordChannel: rawResult.channel_id,
      messageText: rawResult.content,
      messageType: content.messageType,
      details: rawResult,
    };

    const result = await this.insertRecord(discordMessages, insertValues);

    return result.id;
  }

  static async getLastUserMessage() {

    const response = await fetch(`https://discord.com/api/v10/channels/${GENERAL_CHANNEL}/messages?limit=1`, {
      method: 'GET',
      headers: {
        'Authorization': `Bot ${BOT_TOKEN}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Discord API Error [${response.status}]: ${JSON.stringify(errorData)}`);
    }

    const rawResult = await response.json();

    return rawResult;
  }

  static async getMessage(id) {
    const result = await db
        .select()
        .from(discordMessages)
        .where(eq(discordMessages.id, id));

    return new DiscordModel(result)
  }
}
