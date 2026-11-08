import { eq } from "drizzle-orm";
import { db, messages } from "../db/index.js";

export class DiscordModel {
  constructor({ id, text, type, details, createdAt }) {
    this.id = id;
    this.message = text;
    this.type = type;
    this.details = details;
    this.createdAt = createdAt;
  }

  toJSON() {
    return {
      id: this.id,
      message: this.message,
      type: this.type,
    };
  }

  static async create(messageData) {
    const [result] = await db.insert(messages).values(messageData);
    const newId = result.insertId || result.id;
    return new DiscordModel({ id: newId, ...messageData });
  }

  static async getMessage(id) {
    const result = await db
        .select()
        .from(messages)
        .where(eq(messages.id, id));

    return new DiscordModel(result)
  }
}
