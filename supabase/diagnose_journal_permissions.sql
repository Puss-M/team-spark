-- 诊断 Journal Club 提名失败问题
-- 在 Supabase SQL Editor 中逐步执行

-- Step 1: 检查当前策略
SELECT schemaname, tablename, policyname, permissive, cmd
FROM pg_policies
WHERE tablename = 'paper_nominations'
ORDER BY policyname;

-- Step 2: 暂时禁用 RLS 来测试（仅用于诊断）
ALTER TABLE paper_nominations DISABLE ROW LEVEL SECURITY;

-- Step 3: 尝试插入测试数据
INSERT INTO paper_nominations (title, authors, paper_url, nominated_by, tags, abstract)
VALUES (
  'Test Paper',
  'Test Author',
  'https://test.com',
  'mx',  -- 改成你的用户名
  ARRAY['test'],
  'This is a test'
)
RETURNING *;

-- Step 4: 如果上一步成功，说明是 RLS 问题。重新启用 RLS：
ALTER TABLE paper_nominations ENABLE ROW LEVEL SECURITY;

-- Step 5: 删除所有现有策略
DROP POLICY IF EXISTS "Anyone can read nominations" ON paper_nominations;
DROP POLICY IF EXISTS "Anyone can nominate papers" ON paper_nominations;
DROP POLICY IF EXISTS "Anyone can update nominations" ON paper_nominations;
DROP POLICY IF EXISTS "Users can insert nominations" ON paper_nominations;
DROP POLICY IF EXISTS "Enable insert for all users" ON paper_nominations;

-- Step 6: 创建最简单的策略
CREATE POLICY "allow_all_operations" ON paper_nominations
  FOR ALL  -- 允许所有操作
  USING (true)
  WITH CHECK (true);

-- Step 7: 再次尝试插入
INSERT INTO paper_nominations (title, authors, paper_url, nominated_by, tags, abstract)
VALUES (
  'Test Paper 2',
  'Test Author 2',
  'https://test2.com',
  'mx',  -- 改成你的用户名
  ARRAY['test2'],
  'This is test 2'
)
RETURNING *;

-- Step 8: 验证数据
SELECT * FROM paper_nominations ORDER BY created_at DESC LIMIT 5;
