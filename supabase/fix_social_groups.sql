-- ===================================================
-- Team Spark - Fix Social Groups Setup
-- ===================================================
-- 这个脚本修复可能导致无法创建小组的问题
-- 1. 启用 pgcrypto 扩展 (用于生成 UUID)
-- 2. 确保 RLS 策略允许创建

-- 1. 启用必要的扩展
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. 确保表存在 (如果之前的脚本失败了)
CREATE TABLE IF NOT EXISTS social_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  created_by text NOT NULL,
  created_at timestamptz DEFAULT now(),
  invite_code text UNIQUE DEFAULT substring(md5(random()::text) from 0 for 7)
);

CREATE TABLE IF NOT EXISTS social_group_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid REFERENCES social_groups(id) ON DELETE CASCADE,
  user_name text NOT NULL,
  role text DEFAULT 'member',
  joined_at timestamptz DEFAULT now(),
  UNIQUE(group_id, user_name)
);

CREATE TABLE IF NOT EXISTS social_group_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid REFERENCES social_groups(id) ON DELETE CASCADE,
  user_name text NOT NULL,
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- 3. 重置 RLS 策略 (确保允许操作)
ALTER TABLE social_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_group_messages ENABLE ROW LEVEL SECURITY;

-- Groups Policies
DROP POLICY IF EXISTS "Anyone can read groups" ON social_groups;
DROP POLICY IF EXISTS "Authenticated users can create groups" ON social_groups;
DROP POLICY IF EXISTS "Anyone can create groups" ON social_groups;

CREATE POLICY "Anyone can read groups" ON social_groups FOR SELECT USING (true);
CREATE POLICY "Anyone can create groups" ON social_groups FOR INSERT WITH CHECK (true);

-- Members Policies
DROP POLICY IF EXISTS "Anyone can read members" ON social_group_members;
DROP POLICY IF EXISTS "Authenticated users can join" ON social_group_members;
DROP POLICY IF EXISTS "Anyone can join" ON social_group_members;

CREATE POLICY "Anyone can read members" ON social_group_members FOR SELECT USING (true);
CREATE POLICY "Anyone can join" ON social_group_members FOR INSERT WITH CHECK (true);

-- Messages Policies
DROP POLICY IF EXISTS "Anyone can read messages" ON social_group_messages;
DROP POLICY IF EXISTS "Authenticated users can send messages" ON social_group_messages;
DROP POLICY IF EXISTS "Anyone can send messages" ON social_group_messages;

CREATE POLICY "Anyone can read messages" ON social_group_messages FOR SELECT USING (true);
CREATE POLICY "Anyone can send messages" ON social_group_messages FOR INSERT WITH CHECK (true);


SELECT '✅ Social Groups Fixed: pgcrypto enabled and permissions relaxed' as status;
