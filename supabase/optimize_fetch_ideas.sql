-- Performance Optimization: Fetch Ideas with Likes in Single Query
-- This RPC eliminates the N+2 query problem by using JOINs and aggregation

CREATE OR REPLACE FUNCTION fetch_ideas_optimized(
  p_user_name TEXT DEFAULT NULL,
  p_search_query TEXT DEFAULT NULL,
  p_is_public_only BOOLEAN DEFAULT false
)
RETURNS TABLE (
  id UUID,
  author_id TEXT[],
  title TEXT,
  content TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  is_public BOOLEAN,
  tags TEXT[],
  comments_count INTEGER,
  embedding vector(384),
  status TEXT,
  is_bounty BOOLEAN,
  bounty_amount INTEGER,
  bounty_winner_id UUID,
  stock_price NUMERIC,
  likes_count BIGINT,
  liked_by_user BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    i.id,
    i.author_id,
    i.title,
    i.content,
    i.created_at,
    i.updated_at,
    i.is_public,
    i.tags,
    i.comments_count,
    i.embedding,
    COALESCE(i.status, 'idea') as status,
    COALESCE(i.is_bounty, false) as is_bounty,
    COALESCE(i.bounty_amount, 0) as bounty_amount,
    i.bounty_winner_id,
    NULL::NUMERIC as stock_price, -- Placeholder, calculated from investments if needed
    COUNT(DISTINCT il.id)::BIGINT as likes_count,
    COALESCE(
      CASE 
        WHEN p_user_name IS NOT NULL THEN
          EXISTS(
            SELECT 1 FROM idea_likes 
            WHERE idea_likes.idea_id = i.id 
            AND idea_likes.user_name = p_user_name
          )
        ELSE false
      END,
      false
    ) as liked_by_user
  FROM ideas i
  LEFT JOIN idea_likes il ON i.id = il.idea_id
  WHERE 
    -- Visibility filter
    (
      (p_is_public_only = true AND i.is_public = true)
      OR
      (p_is_public_only = false AND p_user_name IS NOT NULL AND (i.is_public = true OR i.author_id @> ARRAY[p_user_name]))
      OR
      (p_is_public_only = false AND p_user_name IS NULL AND i.is_public = true)
    )
    -- Search filter
    AND (
      p_search_query IS NULL 
      OR i.title ILIKE '%' || p_search_query || '%' 
      OR i.content ILIKE '%' || p_search_query || '%'
    )
  GROUP BY i.id, i.author_id, i.title, i.content, i.created_at, i.updated_at, 
           i.is_public, i.tags, i.comments_count, i.embedding, i.status, 
           i.is_bounty, i.bounty_amount, i.bounty_winner_id
  ORDER BY i.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION fetch_ideas_optimized TO anon, authenticated;

-- Test query (you can run this after creating the function)
-- SELECT * FROM fetch_ideas_optimized('CinyaMa', NULL, false);
