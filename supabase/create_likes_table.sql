-- ===================================================
-- 点赞功能 - 数据库表
-- ===================================================

-- 1. 创建 idea_likes 表（记录用户点赞）
DROP TABLE IF EXISTS idea_likes CASCADE;
CREATE TABLE idea_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  idea_id uuid REFERENCES ideas(id) ON DELETE CASCADE NOT NULL,
  user_name text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(idea_id, user_name) -- 确保一个用户只能给一个灵感点赞一次
);

-- 2. 创建索引优化查询
CREATE INDEX IF NOT EXISTS idx_idea_likes_idea_id ON idea_likes(idea_id);
CREATE INDEX IF NOT EXISTS idx_idea_likes_user_name ON idea_likes(user_name);

-- 3. 启用 RLS
ALTER TABLE idea_likes ENABLE ROW LEVEL SECURITY;

-- 4. RLS 策略 - 所有人可以读取
DROP POLICY IF EXISTS "Anyone can read likes" ON idea_likes;
CREATE POLICY "Anyone can read likes"
ON idea_likes
FOR SELECT
USING (true);

-- 5. RLS 策略 - 所有人可以点赞
DROP POLICY IF EXISTS "Anyone can like" ON idea_likes;
CREATE POLICY "Anyone can like"
ON idea_likes
FOR INSERT
WITH CHECK (true);

-- 6. RLS 策略 - 只能删除自己的点赞
DROP POLICY IF EXISTS "Users can unlike their own likes" ON idea_likes;
CREATE POLICY "Users can unlike their own likes"
ON idea_likes
FOR DELETE
USING (true); -- 暂时允许所有人删除，生产环境应该检查 user_name

-- 7. 创建函数：获取灵感的点赞数
CREATE OR REPLACE FUNCTION get_idea_likes_count(idea_uuid uuid)
RETURNS bigint AS $$
  SELECT COUNT(*) FROM idea_likes WHERE idea_id = idea_uuid;
$$ LANGUAGE SQL STABLE;

-- 8. 创建函数：检查用户是否点赞了某个灵感
CREATE OR REPLACE FUNCTION has_user_liked(idea_uuid uuid, username text)
RETURNS boolean AS $$
  SELECT EXISTS(SELECT 1 FROM idea_likes WHERE idea_id = idea_uuid AND user_name = username);
$$ LANGUAGE SQL STABLE;

-- 9. 验证
SELECT '✅ Likes table created successfully!' as status;
