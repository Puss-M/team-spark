-- 步骤 1: 检查 RPC 函数是否存在
-- 在 Supabase SQL Editor 运行这个：

SELECT routine_name, routine_type
FROM information_schema.routines 
WHERE routine_name = 'match_ideas_by_embedding'
AND routine_schema = 'public';

-- 如果上面返回空，说明 RPC 函数没创建成功
-- 那就运行下面的完整创建脚本：

-- ============================================
-- 步骤 2: 创建/替换 RPC 函数
-- ============================================

CREATE OR REPLACE FUNCTION match_ideas_by_embedding(
  query_embedding vector(384),
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 10,
  current_author text DEFAULT ''
)
RETURNS TABLE (
  id uuid,
  title text,
  content text,
  author_id text[],
  tags text[],
  created_at timestamptz,
  updated_at timestamptz,
  is_public boolean,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    ideas.id,
    ideas.title,
    ideas.content,
    ideas.author_id,
    ideas.tags,
    ideas.created_at,
    ideas.updated_at,
    ideas.is_public,
    1 - (ideas.embedding <=> query_embedding) as similarity
  FROM ideas
  WHERE 
    1 - (ideas.embedding <=> query_embedding) > match_threshold
    AND NOT (current_author = ANY(ideas.author_id))
    AND ideas.is_public = true
  ORDER BY similarity DESC
  LIMIT match_count;
END;
$$;

-- ============================================
-- 步骤 3: 测试 RPC 函数
-- ============================================

-- 首先检查是否有可用的 embedding 用于测试
SELECT COUNT(*), 
       SUM(CASE WHEN embedding IS NOT NULL THEN 1 ELSE 0 END) as with_embedding
FROM ideas;

-- 如果有 embedding，运行这个测试（会找到相似的灵感）
DO $$
DECLARE
  test_emb vector(384);
BEGIN
  -- 获取第一个 embedding 作为测试
  SELECT embedding INTO test_emb FROM ideas WHERE embedding IS NOT NULL LIMIT 1;
  
  IF test_emb IS NOT NULL THEN
    RAISE NOTICE '测试 RPC 函数...';
    PERFORM * FROM match_ideas_by_embedding(test_emb, 0.5, 5, 'test_user');
    RAISE NOTICE 'RPC 函数工作正常！';
  ELSE
    RAISE NOTICE '没有 embedding 可供测试';
  END IF;
END $$;
