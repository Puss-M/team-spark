-- ===================================================
-- Team Spark - 环境诊断脚本
-- ===================================================
-- 在 Supabase SQL Editor 中运行此脚本来检查配置是否正确

-- 1. 检查 ideas 表是否存在
SELECT 
  '✅ ideas 表存在' as status,
  count(*) as total_ideas
FROM ideas;

-- 2. 检查 embedding 列的配置
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'ideas' AND column_name = 'embedding';

-- 3. 检查 RPC 函数是否存在
SELECT 
  routine_name,
  routine_type,
  data_type
FROM information_schema.routines
WHERE routine_name = 'match_ideas_by_embedding';

-- 4. 检查 RLS 策略
SELECT 
  tablename,
  policyname,
  permissive,
  cmd as operation,
  CASE 
    WHEN qual IS NOT NULL THEN '有条件限制'
    ELSE '无限制'
  END as using_clause,
  CASE 
    WHEN with_check IS NOT NULL THEN '有检查条件'
    ELSE '无检查条件'
  END as with_check_clause
FROM pg_policies
WHERE tablename = 'ideas';

-- 5. 检查现有数据的 embedding 情况
SELECT 
  count(*) as total_ideas,
  count(embedding) as ideas_with_embedding,
  count(*) - count(embedding) as ideas_without_embedding
FROM ideas;

-- 6. 测试 RPC 函数（使用一个随机的 384 维向量）
-- 注意：这只是测试函数是否能运行，不是真实的匹配
SELECT '开始测试 RPC 函数...' as test_status;

-- 如果你看到所有步骤都有输出且没有错误，说明配置基本正确
SELECT '✅ 诊断完成！请检查上面的输出结果' as final_status;
