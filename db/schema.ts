import { boolean, date, index, integer, jsonb, numeric, pgEnum, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";

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
  positioning: text("positioning"), audience: text("audience"), valueProposition: text("value_proposition"), persona: jsonb("persona"), contentPillars: jsonb("content_pillars"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(), updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
export const accounts = pgTable("accounts", {
  id: uuid("id").primaryKey().defaultRandom(), ipId: uuid("ip_id").notNull().references(() => ips.id, { onDelete: "cascade" }), platform: text("platform").notNull(), handle: text("handle").notNull(),
  platformUserId: text("platform_user_id"), displayName: text("display_name"), profileUrl: text("profile_url"), avatarUrl: text("avatar_url"), status: text("status").notNull().default("manual"),
  syncMode: text("sync_mode").notNull().default("manual"), followers: integer("followers").notNull().default(0), lastSyncedAt: timestamp("last_synced_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(), updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [uniqueIndex("accounts_ip_platform_handle_uq").on(table.ipId, table.platform, table.handle)]);
export const contents = pgTable("contents", {
  id: uuid("id").primaryKey().defaultRandom(), ipId: uuid("ip_id").notNull().references(() => ips.id, { onDelete: "cascade" }), accountId: uuid("account_id").references(() => accounts.id, { onDelete: "set null" }),
  platformContentId: text("platform_content_id"), title: text("title").notNull(), body: text("body"), status: text("status").notNull(), format: text("format"), topicId: uuid("topic_id"),
  publishedUrl: text("published_url"), publishedAt: timestamp("published_at", { withTimezone: true }), createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(), updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
export const metrics = pgTable("metrics", {
  id: uuid("id").primaryKey().defaultRandom(), contentId: uuid("content_id").notNull().references(() => contents.id, { onDelete: "cascade" }),
  views: integer("views").notNull().default(0), impressions: integer("impressions").notNull().default(0), likes: integer("likes").notNull().default(0), comments: integer("comments").notNull().default(0),
  shares: integer("shares").notNull().default(0), saves: integer("saves").notNull().default(0), engagements: integer("engagements").notNull().default(0), leads: integer("leads").notNull().default(0),
  revenue: numeric("revenue", { precision: 14, scale: 2 }).notNull().default("0"), capturedAt: timestamp("captured_at", { withTimezone: true }).notNull().defaultNow(),
});

export const accountDailyMetrics = pgTable("account_daily_metrics", {
  id: uuid("id").primaryKey().defaultRandom(), accountId: uuid("account_id").notNull().references(() => accounts.id, { onDelete: "cascade" }), metricDate: date("metric_date").notNull(),
  followers: integer("followers").notNull().default(0), followerDelta: integer("follower_delta").notNull().default(0), impressions: integer("impressions").notNull().default(0), views: integer("views").notNull().default(0),
  engagements: integer("engagements").notNull().default(0), profileVisits: integer("profile_visits").notNull().default(0), leads: integer("leads").notNull().default(0), revenue: numeric("revenue", { precision: 14, scale: 2 }).notNull().default("0"),
  source: text("source").notNull().default("manual"), createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [uniqueIndex("account_daily_metrics_account_date_uq").on(table.accountId, table.metricDate), index("account_daily_metrics_date_idx").on(table.metricDate)]);

export const importBatches = pgTable("import_batches", {
  id: uuid("id").primaryKey().defaultRandom(), ownerId: uuid("owner_id").notNull().references(() => users.id), accountId: uuid("account_id").references(() => accounts.id, { onDelete: "set null" }),
  fileName: text("file_name").notNull(), importType: text("import_type").notNull(), status: text("status").notNull().default("processing"), rowCount: integer("row_count").notNull().default(0),
  successCount: integer("success_count").notNull().default(0), errorCount: integer("error_count").notNull().default(0), errors: jsonb("errors"), createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(), completedAt: timestamp("completed_at", { withTimezone: true }),
});

export const platformConnections = pgTable("platform_connections", {
  id: uuid("id").primaryKey().defaultRandom(), accountId: uuid("account_id").notNull().references(() => accounts.id, { onDelete: "cascade" }), provider: text("provider").notNull(),
  authType: text("auth_type").notNull(), encryptedCredential: text("encrypted_credential"), scopes: jsonb("scopes"), status: text("status").notNull().default("pending"),
  expiresAt: timestamp("expires_at", { withTimezone: true }), lastError: text("last_error"), createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(), updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const topics = pgTable("topics", {
  id: uuid("id").primaryKey().defaultRandom(), ipId: uuid("ip_id").notNull().references(() => ips.id, { onDelete: "cascade" }), title: text("title").notNull(), angle: text("angle"),
  audiencePain: text("audience_pain"), contentType: text("content_type"), source: text("source"), score: numeric("score", { precision: 5, scale: 2 }), status: text("status").notNull().default("idea"),
  plannedAt: timestamp("planned_at", { withTimezone: true }), createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const assets = pgTable("assets", {
  id: uuid("id").primaryKey().defaultRandom(), ipId: uuid("ip_id").notNull().references(() => ips.id, { onDelete: "cascade" }), ownerId: uuid("owner_id").notNull().references(() => users.id),
  name: text("name").notNull(), kind: text("kind").notNull(), storageKey: text("storage_key"), sourceUrl: text("source_url"), mimeType: text("mime_type"), sizeBytes: integer("size_bytes"),
  tags: jsonb("tags"), transcript: text("transcript"), status: text("status").notNull().default("ready"), createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const leads = pgTable("leads", {
  id: uuid("id").primaryKey().defaultRandom(), ipId: uuid("ip_id").notNull().references(() => ips.id, { onDelete: "cascade" }), contentId: uuid("content_id").references(() => contents.id, { onDelete: "set null" }),
  accountId: uuid("account_id").references(() => accounts.id, { onDelete: "set null" }), name: text("name"), contact: text("contact"), channel: text("channel"), stage: text("stage").notNull().default("new"),
  score: integer("score").notNull().default(0), intent: text("intent"), assigneeId: uuid("assignee_id").references(() => users.id, { onDelete: "set null" }), nextFollowUpAt: timestamp("next_follow_up_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(), updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const serviceCases = pgTable("service_cases", {
  id: uuid("id").primaryKey().defaultRandom(), leadId: uuid("lead_id").notNull().references(() => leads.id, { onDelete: "cascade" }), title: text("title").notNull(), status: text("status").notNull().default("open"),
  priority: text("priority").notNull().default("normal"), assigneeId: uuid("assignee_id").references(() => users.id, { onDelete: "set null" }), dueAt: timestamp("due_at", { withTimezone: true }),
  result: text("result"), createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(), updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const aiInsights = pgTable("ai_insights", {
  id: uuid("id").primaryKey().defaultRandom(), ipId: uuid("ip_id").notNull().references(() => ips.id, { onDelete: "cascade" }), insightType: text("insight_type").notNull(),
  title: text("title").notNull(), summary: text("summary").notNull(), evidence: jsonb("evidence"), recommendation: jsonb("recommendation"), confidence: numeric("confidence", { precision: 5, scale: 4 }),
  modelProvider: text("model_provider"), modelName: text("model_name"), periodStart: date("period_start"), periodEnd: date("period_end"), status: text("status").notNull().default("new"), createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const actionTasks = pgTable("action_tasks", {
  id: uuid("id").primaryKey().defaultRandom(), ipId: uuid("ip_id").notNull().references(() => ips.id, { onDelete: "cascade" }), insightId: uuid("insight_id").references(() => aiInsights.id, { onDelete: "set null" }),
  assigneeId: uuid("assignee_id").references(() => users.id, { onDelete: "set null" }), title: text("title").notNull(), module: text("module").notNull(), status: text("status").notNull().default("todo"),
  priority: text("priority").notNull().default("normal"), dueAt: timestamp("due_at", { withTimezone: true }), completedAt: timestamp("completed_at", { withTimezone: true }), createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
export const modelConfigs = pgTable("model_configs", {
  id: uuid("id").primaryKey().defaultRandom(), ownerId: uuid("owner_id").notNull().references(() => users.id), provider: text("provider").notNull(), model: text("model").notNull(), isDefault: boolean("is_default").default(false),
});
