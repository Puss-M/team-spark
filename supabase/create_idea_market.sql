-- 1. 用户钱包表
CREATE TABLE IF NOT EXISTS user_wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_name TEXT NOT NULL UNIQUE,
  balance INTEGER NOT NULL DEFAULT 100,  -- 初始100 coins
  total_earned INTEGER NOT NULL DEFAULT 0,
  total_invested INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. 投资记录表
CREATE TABLE IF NOT EXISTS investments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_name TEXT NOT NULL,
  idea_id UUID NOT NULL REFERENCES ideas(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,  -- 投资金额
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  current_value INTEGER,    -- 当前价值（可null，后续计算）
  roi DECIMAL(10, 2)        -- 投资回报率
);

-- 3. 灵感估值表（缓存表，避免重复计算）
CREATE TABLE IF NOT EXISTS idea_valuations (
  idea_id UUID PRIMARY KEY REFERENCES ideas(id) ON DELETE CASCADE,
  current_price INTEGER NOT NULL DEFAULT 10,  -- 当前估值
  total_investment INTEGER NOT NULL DEFAULT 0, -- 总投资额
  investor_count INTEGER NOT NULL DEFAULT 0,   -- 投资人数
  last_updated TIMESTAMPTZ DEFAULT NOW()
);

-- 4. 索引
CREATE INDEX IF NOT EXISTS idx_user_wallets_user_name ON user_wallets(user_name);
CREATE INDEX IF NOT EXISTS idx_investments_user_name ON investments(user_name);
CREATE INDEX IF NOT EXISTS idx_investments_idea_id ON investments(idea_id);

-- 5. RLS 策略
ALTER TABLE user_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE investments ENABLE ROW LEVEL SECURITY;
ALTER TABLE idea_valuations ENABLE ROW LEVEL SECURITY;

-- 允许所有人读取（公开排行榜）
CREATE POLICY "Anyone can read wallets" ON user_wallets
  FOR SELECT USING (true);

CREATE POLICY "Anyone can read investments" ON investments
  FOR SELECT USING (true);

CREATE POLICY "Anyone can read valuations" ON idea_valuations
  FOR SELECT USING (true);

-- 允许所有人插入和更新（简化版，后续可加强）
CREATE POLICY "Anyone can insert wallets" ON user_wallets
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update wallets" ON user_wallets
  FOR UPDATE USING (true);

CREATE POLICY "Anyone can insert investments" ON investments
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update investments" ON investments
  FOR UPDATE USING (true);

CREATE POLICY "Anyone can insert valuations" ON idea_valuations
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update valuations" ON idea_valuations
  FOR UPDATE USING (true);

-- 6. 初始化函数：给新用户发钱
CREATE OR REPLACE FUNCTION initialize_user_wallet(p_user_name TEXT)
RETURNS void AS $$
BEGIN
  INSERT INTO user_wallets (user_name, balance)
  VALUES (p_user_name, 100)
  ON CONFLICT (user_name) DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- 7. 测试查询
SELECT * FROM user_wallets;
SELECT * FROM investments;
SELECT * FROM idea_valuations;
