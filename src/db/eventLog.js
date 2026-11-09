import { mysqlTable, int, varchar, json, timestamp } from 'drizzle-orm/mysql-core';

export const eventLog = mysqlTable('event_log', {
  eventId : int("id").autoincrement().primaryKey(),
  eventDate: timestamp("event_date").defaultNow(),
  dbSchema: varchar("db_schema", { length: 255 }).notNull(),
  tableName: varchar('table_name', { length: 255 }).notNull(),
  operationType: varchar("operation_type", { length: 255}).notNull(),
  primaryKeyId: int("primary_key_id").notNull(),
  changeData: json('change_data'),
});