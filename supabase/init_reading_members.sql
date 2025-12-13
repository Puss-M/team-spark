-- ============================================
-- 初始化脚本：添加团队成员到轮值列表
-- 在部署主脚本后执行此文件
-- ============================================

-- 添加你的用户名和团队成员
-- 请修改下面的用户名为实际的团队成员名称

INSERT INTO reading_members (user_name, is_active) 
VALUES 
  ('mx', true)  -- 替换为你的用户名
  -- 取消注释并添加更多成员：
  -- ,('成员2', true)
  -- ,('成员3', true)
ON CONFLICT (user_name) DO NOTHING;

-- 验证成员已添加
SELECT * FROM reading_members;
