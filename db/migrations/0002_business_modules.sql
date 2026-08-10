ALTER TABLE ips ADD COLUMN IF NOT EXISTS value_proposition text;
ALTER TABLE ips ADD COLUMN IF NOT EXISTS persona jsonb;
ALTER TABLE ips ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

ALTER TABLE accounts ADD COLUMN IF NOT EXISTS platform_user_id text;
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS display_name text;
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS profile_url text;
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS avatar_url text;
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'manual';
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS sync_mode text NOT NULL DEFAULT 'manual';
ALTER TABLE accounts ALTER COLUMN followers SET DEFAULT 0;
UPDATE accounts SET followers = 0 WHERE followers IS NULL;
ALTER TABLE accounts ALTER COLUMN followers SET NOT NULL;
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS last_synced_at timestamptz;
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();
CREATE UNIQUE INDEX IF NOT EXISTS accounts_ip_platform_handle_uq ON accounts(ip_id, platform, handle);

ALTER TABLE contents ADD COLUMN IF NOT EXISTS account_id uuid REFERENCES accounts(id) ON DELETE SET NULL;
ALTER TABLE contents ADD COLUMN IF NOT EXISTS platform_content_id text;
ALTER TABLE contents ADD COLUMN IF NOT EXISTS body text;
ALTER TABLE contents ADD COLUMN IF NOT EXISTS topic_id uuid;
ALTER TABLE contents ADD COLUMN IF NOT EXISTS published_url text;
ALTER TABLE contents ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();
ALTER TABLE contents ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

ALTER TABLE metrics ADD COLUMN IF NOT EXISTS views integer NOT NULL DEFAULT 0;
ALTER TABLE metrics ADD COLUMN IF NOT EXISTS likes integer NOT NULL DEFAULT 0;
ALTER TABLE metrics ADD COLUMN IF NOT EXISTS comments integer NOT NULL DEFAULT 0;
ALTER TABLE metrics ADD COLUMN IF NOT EXISTS shares integer NOT NULL DEFAULT 0;
ALTER TABLE metrics ADD COLUMN IF NOT EXISTS saves integer NOT NULL DEFAULT 0;
UPDATE metrics SET impressions = 0 WHERE impressions IS NULL;
UPDATE metrics SET engagements = 0 WHERE engagements IS NULL;
UPDATE metrics SET leads = 0 WHERE leads IS NULL;
UPDATE metrics SET revenue = 0 WHERE revenue IS NULL;
ALTER TABLE metrics ALTER COLUMN impressions SET NOT NULL;
ALTER TABLE metrics ALTER COLUMN engagements SET NOT NULL;
ALTER TABLE metrics ALTER COLUMN leads SET NOT NULL;
ALTER TABLE metrics ALTER COLUMN revenue SET NOT NULL;

CREATE TABLE IF NOT EXISTS account_daily_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), account_id uuid NOT NULL REFERENCES accounts(id) ON DELETE CASCADE, metric_date date NOT NULL,
  followers integer NOT NULL DEFAULT 0, follower_delta integer NOT NULL DEFAULT 0, impressions integer NOT NULL DEFAULT 0, views integer NOT NULL DEFAULT 0,
  engagements integer NOT NULL DEFAULT 0, profile_visits integer NOT NULL DEFAULT 0, leads integer NOT NULL DEFAULT 0, revenue numeric(14,2) NOT NULL DEFAULT 0,
  source text NOT NULL DEFAULT 'manual', created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS account_daily_metrics_account_date_uq ON account_daily_metrics(account_id, metric_date);
CREATE INDEX IF NOT EXISTS account_daily_metrics_date_idx ON account_daily_metrics(metric_date);

CREATE TABLE IF NOT EXISTS import_batches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), owner_id uuid NOT NULL REFERENCES users(id), account_id uuid REFERENCES accounts(id) ON DELETE SET NULL,
  file_name text NOT NULL, import_type text NOT NULL, status text NOT NULL DEFAULT 'processing', row_count integer NOT NULL DEFAULT 0,
  success_count integer NOT NULL DEFAULT 0, error_count integer NOT NULL DEFAULT 0, errors jsonb, created_at timestamptz NOT NULL DEFAULT now(), completed_at timestamptz
);
CREATE TABLE IF NOT EXISTS platform_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), account_id uuid NOT NULL REFERENCES accounts(id) ON DELETE CASCADE, provider text NOT NULL, auth_type text NOT NULL,
  encrypted_credential text, scopes jsonb, status text NOT NULL DEFAULT 'pending', expires_at timestamptz, last_error text,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS topics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), ip_id uuid NOT NULL REFERENCES ips(id) ON DELETE CASCADE, title text NOT NULL, angle text, audience_pain text,
  content_type text, source text, score numeric(5,2), status text NOT NULL DEFAULT 'idea', planned_at timestamptz, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), ip_id uuid NOT NULL REFERENCES ips(id) ON DELETE CASCADE, owner_id uuid NOT NULL REFERENCES users(id), name text NOT NULL,
  kind text NOT NULL, storage_key text, source_url text, mime_type text, size_bytes integer, tags jsonb, transcript text, status text NOT NULL DEFAULT 'ready', created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), ip_id uuid NOT NULL REFERENCES ips(id) ON DELETE CASCADE, content_id uuid REFERENCES contents(id) ON DELETE SET NULL,
  account_id uuid REFERENCES accounts(id) ON DELETE SET NULL, name text, contact text, channel text, stage text NOT NULL DEFAULT 'new', score integer NOT NULL DEFAULT 0,
  intent text, assignee_id uuid REFERENCES users(id) ON DELETE SET NULL, next_follow_up_at timestamptz, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS service_cases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), lead_id uuid NOT NULL REFERENCES leads(id) ON DELETE CASCADE, title text NOT NULL, status text NOT NULL DEFAULT 'open',
  priority text NOT NULL DEFAULT 'normal', assignee_id uuid REFERENCES users(id) ON DELETE SET NULL, due_at timestamptz, result text,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS ai_insights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), ip_id uuid NOT NULL REFERENCES ips(id) ON DELETE CASCADE, insight_type text NOT NULL, title text NOT NULL, summary text NOT NULL,
  evidence jsonb, recommendation jsonb, confidence numeric(5,4), model_provider text, model_name text, period_start date, period_end date,
  status text NOT NULL DEFAULT 'new', created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS action_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), ip_id uuid NOT NULL REFERENCES ips(id) ON DELETE CASCADE, insight_id uuid REFERENCES ai_insights(id) ON DELETE SET NULL,
  assignee_id uuid REFERENCES users(id) ON DELETE SET NULL, title text NOT NULL, module text NOT NULL, status text NOT NULL DEFAULT 'todo', priority text NOT NULL DEFAULT 'normal',
  due_at timestamptz, completed_at timestamptz, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS topics_ip_status_idx ON topics(ip_id, status);
CREATE INDEX IF NOT EXISTS assets_ip_kind_idx ON assets(ip_id, kind);
CREATE INDEX IF NOT EXISTS leads_ip_stage_idx ON leads(ip_id, stage);
CREATE INDEX IF NOT EXISTS ai_insights_ip_created_idx ON ai_insights(ip_id, created_at);
CREATE INDEX IF NOT EXISTS action_tasks_ip_status_idx ON action_tasks(ip_id, status);
