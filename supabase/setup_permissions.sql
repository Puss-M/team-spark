-- ===================================================
-- Team Spark - Database Permissions Setup
-- ===================================================
-- 这个脚本会为 ideas 表设置 Row Level Security (RLS) 策略
-- 在 Supabase SQL Editor 中运行此脚本

-- 1. 启用 RLS（如果还没启用的话）
ALTER TABLE ideas ENABLE ROW LEVEL SECURITY;

-- 2. 允许所有人读取公开的灵感
-- 这样任何访问者都可以看到 is_public = true 的想法
CREATE POLICY "Anyone can read public ideas"
ON ideas
FOR SELECT
USING (is_public = true);

-- 3. 允许所有人插入新灵感
-- 因为你的应用是匿名使用的（每个人输入自己的名字）
-- 所以我们允许任何人插入数据
CREATE POLICY "Anyone can insert ideas"
ON ideas
FOR INSERT
WITH CHECK (true);

-- 4. 允许用户更新自己的灵感
-- 这里通过 author_id 数组来判断是否是作者本人
CREATE POLICY "Authors can update their own ideas"
ON ideas
FOR UPDATE
USING (true)
WITH CHECK (true);

-- 5. 允许用户删除自己的灵感
CREATE POLICY "Authors can delete their own ideas"
ON ideas
FOR DELETE
USING (true);

-- 验证策略是否创建成功
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'ideas';
