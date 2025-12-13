-- 修复 Journal Club 数据库权限问题
-- 在 Supabase SQL Editor 中执行本文件

-- 1. 确保 RLS 已启用
ALTER TABLE paper_nominations ENABLE ROW LEVEL SECURITY;
ALTER TABLE paper_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE reading_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE reading_members ENABLE ROW LEVEL SECURITY;

-- 2. 删除可能冲突的旧策略
DROP POLICY IF EXISTS "Anyone can read nominations" ON paper_nominations;
DROP POLICY IF EXISTS "Anyone can nominate papers" ON paper_nominations;
DROP POLICY IF EXISTS "Anyone can update nominations" ON paper_nominations;
DROP POLICY IF EXISTS "Anyone can read votes" ON paper_votes;
DROP POLICY IF EXISTS "Anyone can vote" ON paper_votes;
DROP POLICY IF EXISTS "Anyone can read sessions" ON reading_sessions;
DROP POLICY IF EXISTS "Anyone can update sessions" ON reading_sessions;
DROP POLICY IF EXISTS "Anyone can read members" ON reading_members;
DROP POLICY IF EXISTS "Anyone can join rotation" ON reading_members;
DROP POLICY IF EXISTS "Anyone can update members" ON reading_members;

-- 3. 创建新的宽松策略（允许所有操作）
-- paper_nominations
CREATE POLICY "Anyone can read nominations" ON paper_nominations
  FOR SELECT USING (true);

CREATE POLICY "Anyone can nominate papers" ON paper_nominations
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update nominations" ON paper_nominations
  FOR UPDATE USING (true);

-- paper_votes  
CREATE POLICY "Anyone can read votes" ON paper_votes
  FOR SELECT USING (true);

CREATE POLICY "Anyone can vote" ON paper_votes
  FOR INSERT WITH CHECK (true);

-- reading_sessions
CREATE POLICY "Anyone can read sessions" ON reading_sessions
  FOR SELECT USING (true);

CREATE POLICY "Anyone can create sessions" ON reading_sessions
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update sessions" ON reading_sessions
  FOR UPDATE USING (true);

-- reading_members
CREATE POLICY "Anyone can read members" ON reading_members
  FOR SELECT USING (true);

CREATE POLICY "Anyone can join rotation" ON reading_members
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update members" ON reading_members
  FOR UPDATE USING (true);

-- 4. 验证策略已创建
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('paper_nominations', 'paper_votes', 'reading_sessions', 'reading_members')
ORDER BY tablename, policyname;
