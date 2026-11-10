import { eq, desc } from 'drizzle-orm';
import { discordMessages } from '../db/discord.js';
import { BaseModel } from './baseModel.js';
import { ValidationError } from '../errors.js';

const MAX_PAGE_SIZE = 100;


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

    return row ? this.toRecord(row) : null;
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
      throw new ValidationError('apiMessage must include id and channel_id.');
    }

    if (!Number.isInteger(messageType)) {
      throw new ValidationError('messageType must be an integer.');
    }

    return this.insertRecord(
      {
        discordId: String(apiMessage.id),
        discordChannel: String(apiMessage.channel_id),
        messageText: apiMessage.content ?? '',
        messageType,
        details: apiMessage,
      },
      { conflictMessage: 'This Discord message has already been recorded.' },
    );
  }
}
