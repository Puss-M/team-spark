-- 检查 ideas 表中哪些记录有 embedding
SELECT 
  id,
  title,
  author_id,
  is_public,
  CASE 
    WHEN embedding IS NULL THEN '❌ 没有'
    ELSE '✅ 有'
  END as embedding_status,
  created_at
FROM ideas
ORDER BY created_at DESC;
