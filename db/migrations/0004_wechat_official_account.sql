UPDATE accounts a
SET platform = 'wechat_official',
    display_name = CASE WHEN a.display_name IS NULL OR a.display_name IN ('其他', 'other') THEN '微信公众号' ELSE a.display_name END,
    updated_at = now()
FROM ips i
JOIN users u ON u.id = i.owner_id
WHERE a.ip_id = i.id
  AND u.name = '云熙AI'
  AND a.platform = 'other';
