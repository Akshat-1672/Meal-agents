import { sqliteTable, text, integer, primaryKey } from 'drizzle-orm/sqlite-core';

export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  preferences: text('preferences'), // JSON serialized string[]
  allergies: text('allergies'),     // JSON serialized string[]
  days: text('days'),               // JSON serialized string[] (e.g. ["Monday", "Wednesday"])
  meals: text('meals'),             // JSON serialized Meal[] (e.g. [{ type: "Lunch", customName: "Office Eat" }])
  specialInstructions: text('special_instructions').default(''),
  createdAt: text('created_at').default('CURRENT_TIMESTAMP'),
});

export const sessions = sqliteTable('sessions', {
  appName: text('app_name').notNull(),
  userId: text('user_id').notNull(),
  id: text('id').notNull(),
  state: text('state').notNull(), // JSON serialized session state dictionary
  createTime: text('create_time').notNull(),
  updateTime: text('update_time').notNull(),
}, (table) => ({
  pk: primaryKey({ columns: [table.appName, table.userId, table.id] }),
}));

export const orders = sqliteTable('orders', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  sessionId: text('session_id').notNull(),
  mealDetails: text('meal_details').notNull(), // JSON serialized order receipt
  status: text('status').notNull(),
});
