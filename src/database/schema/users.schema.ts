import { pgTable, uuid, varchar, timestamp, text } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  microsoftId: varchar('microsoft_id', { length: 255 }).unique(),
  email: text('email').notNull().unique(),
  name: text('name').notNull(),
  qrSignature: text('qr_signature'),
  passwordHash: text('password_hash'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
