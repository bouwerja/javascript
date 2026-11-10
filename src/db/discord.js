import { mysqlTable, int, varchar, binary, json, timestamp } from 'drizzle-orm/mysql-core';

export const discordMessages = mysqlTable('discord_messages', {
    id: int('id').autoincrement().primaryKey(),
    discordId: varchar('discord_id', { length: 25 }).notNull(),
    discordChannel: int('discord_channel').notNull(),
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

export const discordUsers = mysqlTable('discord_users', {
    id: int('id').autoincrement().primaryKey(),
    discordUserId: varchar('discord_user_id', { length: 50 }).notNull(),
    displayName: varchar('display_name', { length: 255 }).notNull(),
    isRegistered: binary('is_registed'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedDetails: json('updated_details'),
    updatedAt: timestamp('updated_at')
});