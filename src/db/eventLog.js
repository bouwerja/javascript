import { mysqlTable, int, varchar, timestamp } from 'drizzle-orm/mysql-core';

export const eventLog = mysqlTable('products', {
  eventId : int("id").autoincrement().primaryKey(),
  eventDate: timestamp("event_date"),
  dbSchema: varchar("db_schema", { length: 255 }).notNull(),
  operationType: varchar("operation_type", { length: 255}).notNull(),
  primaryKeyId: int("primary_key_id").notNull(),
  changeData: varchar("change_data").notNull(),
  changeSource: varchar("change_source", { length: 255 }).notNull(),
});