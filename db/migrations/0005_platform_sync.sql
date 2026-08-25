DELETE FROM platform_connections a USING platform_connections b
WHERE a.created_at < b.created_at AND a.account_id = b.account_id;

CREATE UNIQUE INDEX IF NOT EXISTS platform_connections_account_uq ON platform_connections(account_id);
CREATE UNIQUE INDEX IF NOT EXISTS contents_account_platform_content_uq
  ON contents(account_id, platform_content_id);
