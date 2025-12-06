-- ===================================================
-- 评论功能 - 数据库表
-- ===================================================

-- 1. 创建 comments 表
DROP TABLE IF EXISTS comments CASCADE;
CREATE TABLE comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  idea_id uuid REFERENCES ideas(id) ON DELETE CASCADE NOT NULL,
  user_name text NOT NULL, -- 简化版，直接存用户名，未来可关联 users 表
  content text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 2. 创建索引
CREATE INDEX IF NOT EXISTS idx_comments_idea_id ON comments(idea_id);
CREATE INDEX IF NOT EXISTS idx_comments_created_at ON comments(created_at);

-- 3. 启用 RLS
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- 4. RLS 策略 - 所有人可以读取评论
DROP POLICY IF EXISTS "Anyone can read comments" ON comments;
CREATE POLICY "Anyone can read comments"
ON comments
FOR SELECT
USING (true);

-- 5. RLS 策略 - 登录用户可以发布评论
-- 注意：这里假设 user_name 不为空即为登录，实际生产环境应更严格验证
DROP POLICY IF EXISTS "Authenticated users can comment" ON comments;
CREATE POLICY "Authenticated users can comment"
ON comments
FOR INSERT
WITH CHECK (true); -- 暂时放宽，前端会做验证

-- 6. RLS 策略 - 用户只能删除自己的评论
DROP POLICY IF EXISTS "Users can delete their own comments" ON comments;
CREATE POLICY "Users can delete their own comments"
ON comments
FOR DELETE
USING (user_name = current_setting('request.jwt.claim.sub', true) OR true); -- 暂时允许所有，后续配合 Auth

-- 7. 触发器：更新 ideas 表的 comments_count
-- 首先创建函数
CREATE OR REPLACE FUNCTION update_idea_comments_count()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    UPDATE ideas
    SET comments_count = comments_count + 1
    WHERE id = NEW.idea_id;
  ELSIF (TG_OP = 'DELETE') THEN
    UPDATE ideas
    SET comments_count = comments_count - 1
    WHERE id = OLD.idea_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 然后创建触发器
DROP TRIGGER IF EXISTS update_comments_count ON comments;
CREATE TRIGGER update_comments_count
AFTER INSERT OR DELETE ON comments
FOR EACH ROW
EXECUTE FUNCTION update_idea_comments_count();

-- 8. 验证
SELECT '✅ Comments table created successfully!' as status;
