-- Step 1: 删除旧的策略和表（如果存在）
DROP POLICY IF EXISTS "Users can read their own interests" ON user_interests;
DROP POLICY IF EXISTS "Users can insert their own interests" ON user_interests;
DROP POLICY IF EXISTS "Users can update their own interests" ON user_interests;
DROP INDEX IF EXISTS idx_user_interests_user_name;
DROP TABLE IF EXISTS user_interests;

-- Step 2: 创建用户兴趣标签表
CREATE TABLE user_interests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_name TEXT NOT NULL UNIQUE,
  interests TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 3: 创建索引以提高查询性能
CREATE INDEX idx_user_interests_user_name ON user_interests(user_name);

-- Step 4: 启用 RLS
ALTER TABLE user_interests ENABLE ROW LEVEL SECURITY;

-- Step 5: 创建 RLS 策略
-- 允许所有人读取（因为我们使用简单的用户名认证）
CREATE POLICY "Users can read interests" ON user_interests
  FOR SELECT
  USING (true);

-- 允许所有人插入
CREATE POLICY "Users can insert interests" ON user_interests
  FOR INSERT
  WITH CHECK (true);

-- 允许所有人更新
CREATE POLICY "Users can update interests" ON user_interests
  FOR UPDATE
  USING (true);

-- Step 6: 验证
SELECT * FROM user_interests;
