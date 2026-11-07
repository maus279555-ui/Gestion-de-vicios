import { sqliteTable, text, real, integer } from 'drizzle-orm/sqlite-core';

export const transactionsTable = sqliteTable('transactions', {
  id: text('id').primaryKey(),
  type: text('type').notNull(), // 'income' | 'expense'
  category: text('category').notNull(),
  categoryName: text('category_name').notNull(),
  amount: real('amount').notNull(),
  note: text('note'),
  date: text('date').notNull(), // 'YYYY-MM-DD'
  time: text('time').notNull(), // 'HH:mm:ss'
  timestamp: integer('timestamp').notNull(),
  latitude: real('latitude'),
  longitude: real('longitude'),
  accuracy: real('accuracy'),
  locationAddress: text('location_address'),
  paymentMethod: text('payment_method').default('efectivo'),
  createdAt: integer('created_at').notNull(),
});

export type DBTransaction = typeof transactionsTable.$inferSelect;
export type DBInsertTransaction = typeof transactionsTable.$inferInsert;
