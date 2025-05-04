import { pgTable, text, serial, integer, boolean, timestamp, doublePrecision } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Users table (for alert subscriptions)
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

// Wildfires table
export const wildfires = pgTable("wildfires", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  location: text("location").notNull(),
  latitude: doublePrecision("latitude").notNull(),
  longitude: doublePrecision("longitude").notNull(),
  acres: integer("acres").notNull(),
  containment: integer("containment").notNull().default(0),
  startDate: text("start_date").notNull(),
  severity: text("severity").notNull(),
  cause: text("cause"),
  perimeterCoordinates: text("perimeter_coordinates"),  // JSON string of coordinates defining fire perimeter
  newsUrl: text("news_url"),  // URL to news article or official information about the fire
  updated: timestamp("updated").notNull().defaultNow(),
});

// Alerts table
export const alerts = pgTable("alerts", {
  id: text("id").primaryKey(),
  type: text("type").notNull(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  severity: text("severity").notNull(),
  wildfireId: text("wildfire_id").references(() => wildfires.id),
  zones: text("zones").array(),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Updates for wildfires
export const updates = pgTable("updates", {
  id: serial("id").primaryKey(),
  wildfireId: text("wildfire_id").references(() => wildfires.id).notNull(),
  content: text("content").notNull(),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
});

// Alert subscriptions
export const subscriptions = pgTable("subscriptions", {
  id: serial("id").primaryKey(),
  wildfireId: text("wildfire_id").references(() => wildfires.id).notNull(),
  email: text("email"),
  phone: text("phone"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Define relationships
export const wildfiresRelations = relations(wildfires, ({ many }) => ({
  alerts: many(alerts),
  updates: many(updates),
  subscriptions: many(subscriptions),
}));

export const alertsRelations = relations(alerts, ({ one }) => ({
  wildfire: one(wildfires, {
    fields: [alerts.wildfireId],
    references: [wildfires.id],
  }),
}));

export const updatesRelations = relations(updates, ({ one }) => ({
  wildfire: one(wildfires, {
    fields: [updates.wildfireId],
    references: [wildfires.id],
  }),
}));

export const subscriptionsRelations = relations(subscriptions, ({ one }) => ({
  wildfire: one(wildfires, {
    fields: [subscriptions.wildfireId],
    references: [wildfires.id],
  }),
}));

// Schemas for validation
export const wildfireInsertSchema = createInsertSchema(wildfires, {
  name: (schema) => schema.min(2, "Name must be at least 2 characters"),
  location: (schema) => schema.min(2, "Location must be at least 2 characters"),
  severity: (schema) => schema.refine(
    val => ['high', 'medium', 'low', 'contained'].includes(val),
    "Severity must be one of: high, medium, low, contained"
  ),
});

export const alertInsertSchema = createInsertSchema(alerts, {
  title: (schema) => schema.min(3, "Title must be at least 3 characters"),
  message: (schema) => schema.min(5, "Message must be at least 5 characters"),
  severity: (schema) => schema.refine(
    val => ['high', 'medium', 'low'].includes(val),
    "Severity must be one of: high, medium, low"
  ),
});

export const updateInsertSchema = createInsertSchema(updates, {
  content: (schema) => schema.min(5, "Content must be at least 5 characters"),
});

export const subscriptionInsertSchema = createInsertSchema(subscriptions, {});

// Types
export type Wildfire = typeof wildfires.$inferSelect;
export type WildfireInsert = z.infer<typeof wildfireInsertSchema>;
export type Alert = typeof alerts.$inferSelect;
export type AlertInsert = z.infer<typeof alertInsertSchema>;
export type Update = typeof updates.$inferSelect;
export type UpdateInsert = z.infer<typeof updateInsertSchema>;
export type Subscription = typeof subscriptions.$inferSelect;
export type SubscriptionInsert = z.infer<typeof subscriptionInsertSchema>;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});
