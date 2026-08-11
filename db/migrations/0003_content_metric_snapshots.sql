ALTER TABLE metrics ADD COLUMN IF NOT EXISTS metric_date date;
UPDATE metrics SET metric_date = captured_at::date WHERE metric_date IS NULL;
ALTER TABLE metrics ALTER COLUMN metric_date SET DEFAULT current_date;
ALTER TABLE metrics ALTER COLUMN metric_date SET NOT NULL;
ALTER TABLE metrics ADD COLUMN IF NOT EXISTS follower_delta integer NOT NULL DEFAULT 0;

DELETE FROM metrics a USING metrics b
WHERE a.id < b.id AND a.content_id = b.content_id AND a.metric_date = b.metric_date;

CREATE UNIQUE INDEX IF NOT EXISTS metrics_content_date_uq ON metrics(content_id, metric_date);
CREATE INDEX IF NOT EXISTS metrics_date_idx ON metrics(metric_date);
CREATE INDEX IF NOT EXISTS contents_account_published_idx ON contents(account_id, published_at);
