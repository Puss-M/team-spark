-- 最简单的测试：直接在 Supabase SQL Editor 测试插入
-- 模拟前端会做的操作

-- 1. 先查看表结构
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'paper_nominations'
ORDER BY ordinal_position;

-- 2. 检查 RLS 状态
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'paper_nominations';

-- 3. 尝试插入（和前端一模一样的数据结构）
INSERT INTO paper_nominations (
  title,
  authors,
  paper_url,
  nominated_by,
  tags,
  abstract
) VALUES (
  '测试论文标题',
  '测试作者',
  'https://test.com',
  'mx',  -- 改成你的用户名
  ARRAY['测试标签'],
  '这是测试摘要'
)
RETURNING *;

-- 4. 查看刚插入的数据
SELECT * FROM paper_nominations 
ORDER BY created_at DESC 
LIMIT 3;
