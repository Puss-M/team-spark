-- Multi-dimensional Leaderboard SQL

-- RPC: Get Most Active users (most ideas posted)
CREATE OR REPLACE FUNCTION get_most_active(p_limit INTEGER DEFAULT 10)
RETURNS TABLE (
  user_name TEXT,
  idea_count BIGINT,
  rank INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    unnest(i.author_id) as user_name,
    COUNT(*)::BIGINT as idea_count,
    ROW_NUMBER() OVER (ORDER BY COUNT(*) DESC)::INTEGER as rank
  FROM ideas i
  WHERE i.created_at >= NOW() - INTERVAL '7 days'
  GROUP BY unnest(i.author_id)
  ORDER BY idea_count DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- RPC: Get The Debugger (most helpful in comments)
CREATE OR REPLACE FUNCTION get_debuggers(p_limit INTEGER DEFAULT 10)
RETURNS TABLE (
  user_name TEXT,
  helpful_comments BIGINT,
  rank INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.user_name,
    COUNT(*)::BIGINT as helpful_comments,
    ROW_NUMBER() OVER (ORDER BY COUNT(*) DESC)::INTEGER as rank
  FROM comments c
  WHERE c.created_at >= NOW() - INTERVAL '7 days'
    AND LENGTH(c.content) > 50  -- Only count substantial comments
  GROUP BY c.user_name
  ORDER BY helpful_comments DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- RPC: Get Night Owls (late night activity)
CREATE OR REPLACE FUNCTION get_night_owls(p_limit INTEGER DEFAULT 10)
RETURNS TABLE (
  user_name TEXT,
  avg_hour NUMERIC,
  night_posts BIGINT,
  rank INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    unnest(i.author_id) as user_name,
    AVG(EXTRACT(HOUR FROM i.created_at AT TIME ZONE 'Asia/Shanghai'))::NUMERIC(10,2) as avg_hour,
    COUNT(*)::BIGINT as night_posts,
    ROW_NUMBER() OVER (ORDER BY AVG(EXTRACT(HOUR FROM i.created_at)) DESC)::INTEGER as rank
  FROM ideas i
  WHERE i.created_at >= NOW() - INTERVAL '7 days'
    AND EXTRACT(HOUR FROM i.created_at AT TIME ZONE 'Asia/Shanghai') >= 22 
    OR EXTRACT(HOUR FROM i.created_at AT TIME ZONE 'Asia/Shanghai') <= 5
  GROUP BY unnest(i.author_id)
  HAVING COUNT(*) >= 3  -- At least 3 late night posts
  ORDER BY avg_hour DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;
