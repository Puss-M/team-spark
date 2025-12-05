-- ===================================================
-- 灵感小组功能 - 数据库表
-- ===================================================

-- 1. 创建 idea_groups 表
CREATE TABLE IF NOT EXISTS idea_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 2. 创建 group_idea_members 关联表
CREATE TABLE IF NOT EXISTS group_idea_members (
  group_id uuid REFERENCES idea_groups(id) ON DELETE CASCADE,
  idea_id uuid REFERENCES ideas(id) ON DELETE CASCADE,
  added_at timestamptz DEFAULT now(),
  PRIMARY KEY (group_id, idea_id)
);

-- 3. 为 idea_groups 启用 RLS
ALTER TABLE idea_groups ENABLE ROW LEVEL SECURITY;

-- 4. 创建 RLS 策略 - 所有人可以读取
DROP POLICY IF EXISTS "Anyone can read groups" ON idea_groups;
CREATE POLICY "Anyone can read groups"
ON idea_groups
FOR SELECT
USING (true);

-- 5. 创建 RLS 策略 - 所有人可以创建小组
DROP POLICY IF EXISTS "Anyone can create groups" ON idea_groups;
CREATE POLICY "Anyone can create groups"
ON idea_groups
FOR INSERT
WITH CHECK (true);

-- 6. 为 group_idea_members 启用 RLS
ALTER TABLE group_idea_members ENABLE ROW LEVEL SECURITY;

-- 7. 创建 RLS 策略 - 所有人可以读取成员关系
DROP POLICY IF EXISTS "Anyone can read group members" ON group_idea_members;
CREATE POLICY "Anyone can read group members"
ON group_idea_members
FOR SELECT
USING (true);

-- 8. 创建 RLS 策略 - 所有人可以添加成员
DROP POLICY IF EXISTS "Anyone can add group members" ON group_idea_members;
CREATE POLICY "Anyone can add group members"
ON group_idea_members
FOR INSERT
WITH CHECK (true);

-- 9. 创建索引优化查询
CREATE INDEX IF NOT EXISTS idx_group_members_group_id ON group_idea_members(group_id);
CREATE INDEX IF NOT EXISTS idx_group_members_idea_id ON group_idea_members(idea_id);

-- 10. 验证
SELECT '✅ Group tables created successfully!' as status;

-- 查看表结构
SELECT 
  table_name,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_name IN ('idea_groups', 'group_idea_members')
ORDER BY table_name, ordinal_position;
