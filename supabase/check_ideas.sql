-- 检查数据库中的灵感记录（修复版）
-- 在 Supabase SQL Editor 运行这个：

SELECT 
  id, 
  title, 
  author_id, 
  is_public,
  embedding IS NOT NULL as has_embedding,
  created_at
FROM ideas
ORDER BY created_at DESC
LIMIT 10;
