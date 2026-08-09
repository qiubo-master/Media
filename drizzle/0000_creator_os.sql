CREATE TABLE `ips` (`id` text PRIMARY KEY NOT NULL, `owner_id` text NOT NULL, `name` text NOT NULL, `positioning` text, `audience` text, `content_pillars` text, `created_at` integer NOT NULL);
--> statement-breakpoint
CREATE TABLE `accounts` (`id` text PRIMARY KEY NOT NULL, `ip_id` text NOT NULL, `platform` text NOT NULL, `handle` text NOT NULL, `followers` integer DEFAULT 0);
--> statement-breakpoint
CREATE TABLE `contents` (`id` text PRIMARY KEY NOT NULL, `ip_id` text NOT NULL, `title` text NOT NULL, `status` text NOT NULL, `format` text, `published_at` integer);
--> statement-breakpoint
CREATE TABLE `metrics` (`id` text PRIMARY KEY NOT NULL, `content_id` text NOT NULL, `impressions` integer DEFAULT 0, `engagements` integer DEFAULT 0, `leads` integer DEFAULT 0, `revenue` real DEFAULT 0, `captured_at` integer NOT NULL);
--> statement-breakpoint
CREATE TABLE `leads` (`id` text PRIMARY KEY NOT NULL, `owner_id` text NOT NULL, `source_content_id` text, `name` text, `stage` text NOT NULL, `value` real DEFAULT 0, `created_at` integer NOT NULL);
--> statement-breakpoint
CREATE TABLE `model_configs` (`id` text PRIMARY KEY NOT NULL, `owner_id` text NOT NULL, `provider` text NOT NULL, `model` text NOT NULL, `is_default` integer DEFAULT false);
--> statement-breakpoint
CREATE INDEX `idx_accounts_ip_id` ON `accounts` (`ip_id`);
--> statement-breakpoint
CREATE INDEX `idx_contents_ip_status` ON `contents` (`ip_id`,`status`);
--> statement-breakpoint
CREATE INDEX `idx_metrics_content_captured` ON `metrics` (`content_id`,`captured_at`);
--> statement-breakpoint
CREATE INDEX `idx_leads_owner_stage` ON `leads` (`owner_id`,`stage`);
