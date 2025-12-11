-- Complete SQL script to set up the access whitelist table and insert the provided users

-- Step 1: Create the access_whitelist table if it doesn't exist
CREATE TABLE IF NOT EXISTS access_whitelist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT UNIQUE NOT NULL, -- Login credential and display name
  name TEXT NOT NULL             -- Backend note only, not displayed to users
);

-- Step 2: Insert the provided whitelist users
INSERT INTO access_whitelist (username, name) VALUES
('CinyaMa', '马鑫悦'),
('蔡云杉', '蔡云杉'),
('Jasin', '郭正忻'),
('灼灼不用cursor', '李子灼'),
('Leung', '梁英琪'),
('猪猪侠', '朱天毅'),
('CHUNLIN', '陈春林')
ON CONFLICT (username) DO NOTHING;

-- Step 3: Verify the insertion
SELECT * FROM access_whitelist;

-- Step 4: Create a row-level security policy for read access
ALTER TABLE access_whitelist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to whitelist" ON access_whitelist
  FOR SELECT
  TO anon
  USING (true);
