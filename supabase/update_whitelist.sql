-- Add missing users to whitelist
-- Source: User provided image

INSERT INTO access_whitelist (username, name) VALUES
('Sophie', '周佳怡'),
('Evewang', '王嘉嘉')
ON CONFLICT (username) DO NOTHING;

-- Verify
SELECT * FROM access_whitelist ORDER BY id DESC LIMIT 5;
