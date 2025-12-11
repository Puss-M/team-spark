-- ===================================================
-- 安全迁移：384维 → 1536维（会删除现有数据）
-- ===================================================
-- ⚠️ 警告：此脚本会删除 ideas 表中的所有现有数据！
-- 如果你的数据库里有重要数据，请先备份！

-- 步骤 1：删除旧的 RPC 函数
DROP FUNCTION IF EXISTS match_ideas_by_embedding(vector(384), float, int, text);

-- 步骤 2：删除所有现有数据（因为旧数据是 384 维的）
TRUNCATE TABLE ideas;

-- 步骤 3：修改 embedding 列的维度
ALTER TABLE ideas
ALTER COLUMN embedding TYPE vector(1536);

-- 步骤 4：重新创建 RPC 函数（使用 1536 维）
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

-- 步骤 5：验证
SELECT '✅ Migration completed! Table is now empty and ready for 1536-dim embeddings' as status;

-- 检查列类型
SELECT 
  column_name,
  data_type,
  udt_name
FROM information_schema.columns
WHERE table_name = 'ideas' AND column_name = 'embedding';

-- 检查 RPC 函数
SELECT 
  routine_name,
  data_type
FROM information_schema.routines
WHERE routine_name = 'match_ideas_by_embedding';
