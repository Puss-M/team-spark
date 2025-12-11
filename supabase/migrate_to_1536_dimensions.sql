-- ===================================================
-- Migration: Update embedding dimension from 384 to 1536
-- ===================================================
-- 运行此脚本以支持 OpenAI text-embedding-3-small 的 1536 维向量

-- 1. 删除旧的 RPC 函数（因为它依赖 vector(384)）
DROP FUNCTION IF EXISTS match_ideas_by_embedding(vector(384), float, int, text);

-- 2. 修改 embedding 列的维度
ALTER TABLE ideas
ALTER COLUMN embedding TYPE vector(1536);

-- 3. 重新创建 RPC 函数（使用新的维度）
CREATE OR REPLACE FUNCTION match_ideas_by_embedding(
  query_embedding vector(1536),
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

-- 4. 验证更新
SELECT 
  column_name,
  data_type,
  udt_name
FROM information_schema.columns
WHERE table_name = 'ideas' AND column_name = 'embedding';

-- 应该显示 vector 类型且维度为 1536

SELECT '✅ Migration completed! Embedding dimension updated to 1536' as status;
