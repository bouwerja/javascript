import { mysqlTable, int, varchar, boolean, json, timestamp, uniqueIndex } from 'drizzle-orm/mysql-core';

export const discordMessages = mysqlTable('discord_messages', {
  id: int('id').autoincrement().primaryKey(),
  discordId: varchar('discord_id', { length: 25 }).notNull(),
  discordChannel: varchar('discord_channel', { length: 25 }).notNull(),
  messageText: varchar('message_text', { length: 2000 }).notNull(),
  messageType: int('message_type_id').notNull(),
  details: json('details'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => [
  uniqueIndex('discord_messages_discord_id_unique').on(table.discordId),
]);

export const messageType = mysqlTable('discord_message_types', {
    id: int('id').autoincrement().primaryKey(),
    type: varchar('type', { length: 255 }).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const discordUsers = mysqlTable('discord_users', {
  id: int('id').autoincrement().primaryKey(),
  discordUserId: varchar('discord_user_id', { length: 25 }).notNull(),
  displayName: varchar('display_name', { length: 255 }).notNull(),
  isRegistered: boolean('is_registered').notNull().default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedDetails: json('updated_details'),
  updatedAt: timestamp('updated_at'),
});