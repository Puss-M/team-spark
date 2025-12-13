-- Step 1: 检查 transactions 表是否存在
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'transactions';

-- 如果上面返回空结果，说明表不存在，请执行下面的建表 SQL：
-- （如果表已存在，跳过这部分）

/*
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_name TEXT NOT NULL,
  type TEXT NOT NULL, -- 'deposit', 'withdraw', 'transfer'
  amount INTEGER NOT NULL,
  related_entity_id UUID, -- 关联的 idea_id 或其他实体
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_transactions_user_name ON transactions(user_name);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at);

ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read transactions" ON transactions
  FOR SELECT USING (true);

CREATE POLICY "Anyone can insert transactions" ON transactions
  FOR INSERT WITH CHECK (true);
*/

-- Step 2: 测试 RPC 函数
-- 用你的真实用户名替换 '你的用户名'
SELECT award_archaeology_coins(
  '你的用户名',  -- 替换成你的实际用户名
  50,
  '00000000-0000-0000-0000-000000000000'::uuid
);

-- Step 3: 验证结果
-- 检查钱包余额（用你的真实用户名）
SELECT * FROM user_wallets WHERE user_name = '你的用户名';

-- 检查交易记录（用你的真实用户名）
SELECT * FROM transactions WHERE user_name = '你的用户名' ORDER BY created_at DESC LIMIT 5;
