-- 最终修复：完全禁用 Journal Club 表的 RLS
-- 因为我们的应用不使用 Supabase Authentication，而是简单的用户名登录
-- 在 Supabase SQL Editor 中执行

-- 禁用所有 Journal Club 相关表的 RLS
ALTER TABLE paper_nominations DISABLE ROW LEVEL SECURITY;
ALTER TABLE paper_votes DISABLE ROW LEVEL SECURITY;
ALTER TABLE reading_sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE reading_members DISABLE ROW LEVEL SECURITY;

-- 验证 RLS 已禁用
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('paper_nominations', 'paper_votes', 'reading_sessions', 'reading_members');

-- 测试插入（应该成功）
INSERT INTO paper_nominations (title, paper_url, nominated_by)
VALUES ('Final Test', 'https://final-test.com', 'mx')
RETURNING *;
