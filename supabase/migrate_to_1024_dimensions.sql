-- ===================================================
-- 迁移：1536维 → 1024维 (适配 BAAI/bge-large-zh-v1.5)
-- ===================================================

-- 步骤 1：删除旧的 RPC 函数
DROP FUNCTION IF EXISTS match_ideas_by_embedding(vector(1536), float, int, text);

-- 步骤 2：清空现有数据（因为维度不匹配）
TRUNCATE TABLE ideas;

-- 步骤 3：修改 embedding 列的维度
ALTER TABLE ideas
ALTER COLUMN embedding TYPE vector(1024);

-- 步骤 4：重新创建 RPC 函数（使用 1024 维）
CREATE OR REPLACE FUNCTION match_ideas_by_embedding(
  query_embedding vector(1024),
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

-- 步骤 5：验证
SELECT '✅ Migration completed! Now using 1024 dimensions for BAAI/bge-large-zh-v1.5' as status;

-- 检查列类型
SELECT 
  column_name,
  udt_name
FROM information_schema.columns
WHERE table_name = 'ideas' AND column_name = 'embedding';
