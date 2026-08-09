import { integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const ips = sqliteTable("ips", {
  id: text("id").primaryKey(), ownerId: text("owner_id").notNull(), name: text("name").notNull(),
  positioning: text("positioning"), audience: text("audience"), contentPillars: text("content_pillars"), createdAt: integer("created_at").notNull(),
});
export const accounts = sqliteTable("accounts", {
  id: text("id").primaryKey(), ipId: text("ip_id").notNull(), platform: text("platform").notNull(), handle: text("handle").notNull(), followers: integer("followers").default(0),
});
export const contents = sqliteTable("contents", {
  id: text("id").primaryKey(), ipId: text("ip_id").notNull(), title: text("title").notNull(), status: text("status").notNull(), format: text("format"), publishedAt: integer("published_at"),
});
export const metrics = sqliteTable("metrics", {
  id: text("id").primaryKey(), contentId: text("content_id").notNull(), impressions: integer("impressions").default(0), engagements: integer("engagements").default(0), leads: integer("leads").default(0), revenue: real("revenue").default(0), capturedAt: integer("captured_at").notNull(),
});
export const leads = sqliteTable("leads", {
  id: text("id").primaryKey(), ownerId: text("owner_id").notNull(), sourceContentId: text("source_content_id"), name: text("name"), stage: text("stage").notNull(), value: real("value").default(0), createdAt: integer("created_at").notNull(),
});
export const modelConfigs = sqliteTable("model_configs", {
  id: text("id").primaryKey(), ownerId: text("owner_id").notNull(), provider: text("provider").notNull(), model: text("model").notNull(), isDefault: integer("is_default", { mode: "boolean" }).default(false),
});
