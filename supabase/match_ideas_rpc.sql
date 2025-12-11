-- RPC function for semantic similarity search using vector embeddings
-- This function finds ideas similar to a query embedding using cosine similarity

CREATE OR REPLACE FUNCTION match_ideas_by_embedding(
  query_embedding vector(384),
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 10,
  current_author text DEFAULT '',
  match_idea_id uuid DEFAULT NULL
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
    AND ideas.is_public = true
    AND (match_idea_id IS NULL OR ideas.id != match_idea_id)
    -- Optional: Uncomment if you strictly want to exclude user's own ideas from matching
    -- AND (current_author = '' OR NOT (current_author = ANY(ideas.author_id)))
  ORDER BY similarity DESC
  LIMIT match_count;
END;
$$;
