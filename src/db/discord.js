import { mysqlTable, int, varchar, json, timestamp } from 'drizzle-orm/mysql-core';

export const messages = mysqlTable('discord_messages', {
    id: int('id').autoincrement().primaryKey(),
    messageText: varchar('message_text', { length: 255 }).notNull(),
    messageType: int('message_type_id').notNull(),
    details: json('details'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const messageType = mysqlTable('discord_message_types', {
    id: int('id').autoincrement().primaryKey(),
    type: varchar('type', { length: 255 }).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
});