import { boolean, integer, jsonb, numeric, pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const roleEnum = pgEnum("user_role", ["admin", "member"]);

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  passwordHash: text("password_hash").notNull(),
  role: roleEnum("role").notNull().default("member"),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const sessions = pgTable("sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  tokenHash: text("token_hash").notNull().unique(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  ip: text("ip"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const authEvents = pgTable("auth_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull(),
  ip: text("ip").notNull(),
  success: boolean("success").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const ips = pgTable("ips", {
  id: uuid("id").primaryKey().defaultRandom(), ownerId: uuid("owner_id").notNull().references(() => users.id), name: text("name").notNull(),
  positioning: text("positioning"), audience: text("audience"), contentPillars: jsonb("content_pillars"), createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
export const accounts = pgTable("accounts", {
  id: uuid("id").primaryKey().defaultRandom(), ipId: uuid("ip_id").notNull().references(() => ips.id, { onDelete: "cascade" }), platform: text("platform").notNull(), handle: text("handle").notNull(), followers: integer("followers").default(0),
});
export const contents = pgTable("contents", {
  id: uuid("id").primaryKey().defaultRandom(), ipId: uuid("ip_id").notNull().references(() => ips.id, { onDelete: "cascade" }), title: text("title").notNull(), status: text("status").notNull(), format: text("format"), publishedAt: timestamp("published_at", { withTimezone: true }),
});
export const metrics = pgTable("metrics", {
  id: uuid("id").primaryKey().defaultRandom(), contentId: uuid("content_id").notNull().references(() => contents.id, { onDelete: "cascade" }), impressions: integer("impressions").default(0), engagements: integer("engagements").default(0), leads: integer("leads").default(0), revenue: numeric("revenue", { precision: 14, scale: 2 }).default("0"), capturedAt: timestamp("captured_at", { withTimezone: true }).notNull().defaultNow(),
});
export const modelConfigs = pgTable("model_configs", {
  id: uuid("id").primaryKey().defaultRandom(), ownerId: uuid("owner_id").notNull().references(() => users.id), provider: text("provider").notNull(), model: text("model").notNull(), isDefault: boolean("is_default").default(false),
});
