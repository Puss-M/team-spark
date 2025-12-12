-- Migration for Prediction Market and Bounty Hunter

-- 1. Update ideas table
ALTER TABLE ideas 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'idea' CHECK (status IN ('idea', 'project')),
ADD COLUMN IF NOT EXISTS is_bounty BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS bounty_amount INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS bounty_winner_id UUID REFERENCES auth.users(id);

-- 2. Ensure user_wallets exists (idempotent from create_idea_market.sql)
CREATE TABLE IF NOT EXISTS user_wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_name TEXT NOT NULL UNIQUE,
  balance INTEGER NOT NULL DEFAULT 100,
  total_earned INTEGER NOT NULL DEFAULT 0,
  total_invested INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Ensure investments table exists (for Bets)
CREATE TABLE IF NOT EXISTS investments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_name TEXT NOT NULL,
  idea_id UUID NOT NULL REFERENCES ideas(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  current_value INTEGER,
  roi DECIMAL(10, 2)
);

-- 4. Create Transaction History Table
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('bet', 'payout', 'bounty_post', 'bounty_win', 'deposit', 'withdrawal')),
  amount INTEGER NOT NULL, -- Positive for income, negative for expense
  related_entity_id UUID, -- idea_id or other reference
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. RLS Policies for Transactions
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own transactions" ON transactions
  FOR SELECT USING (user_name = (select raw_user_meta_data->>'name' from auth.users where id = auth.uid()));

CREATE POLICY "Anyone can insert transactions" ON transactions
  FOR INSERT WITH CHECK (true); -- Ideally should be more restricted or handled via RPC

-- 6. RPC: Place Bet
-- call with: select place_bet('idea_uuid', 50, 'user_name');
CREATE OR REPLACE FUNCTION place_bet(
  p_idea_id UUID, 
  p_amount INTEGER, 
  p_user_name TEXT
) 
RETURNS JSONB AS $$
DECLARE
  v_current_balance INTEGER;
BEGIN
  -- Check balance
  SELECT balance INTO v_current_balance FROM user_wallets WHERE user_name = p_user_name;
  
  IF v_current_balance IS NULL THEN
    -- Initialize if not exists
    INSERT INTO user_wallets (user_name, balance) VALUES (p_user_name, 100) RETURNING balance INTO v_current_balance;
  END IF;

  IF v_current_balance < p_amount THEN
    RETURN jsonb_build_object('success', false, 'message', 'Insufficient balance');
  END IF;

  -- Deduct balance
  UPDATE user_wallets 
  SET balance = balance - p_amount, 
      total_invested = total_invested + p_amount 
  WHERE user_name = p_user_name;

  -- Create Investment Record
  INSERT INTO investments (user_name, idea_id, amount)
  VALUES (p_user_name, p_idea_id, p_amount);

  -- Log Transaction
  INSERT INTO transactions (user_name, type, amount, related_entity_id, description)
  VALUES (p_user_name, 'bet', -p_amount, p_idea_id, 'Bet on idea');

  -- Update Idea stats (optional, if we track total bets on idea)
  -- UPDATE idea_valuations ... 

  RETURN jsonb_build_object('success', true, 'new_balance', v_current_balance - p_amount);
END;
$$ LANGUAGE plpgsql;

-- 7. RPC: Resolve Prediction (Idea -> Project)
CREATE OR REPLACE FUNCTION resolve_prediction(
  p_idea_id UUID
)
RETURNS JSONB AS $$
DECLARE
  v_investment RECORD;
  v_payout INTEGER;
BEGIN
  -- Update Idea Status
  UPDATE ideas SET status = 'project' WHERE id = p_idea_id;

  -- Process Payouts (200% return)
  FOR v_investment IN SELECT * FROM investments WHERE idea_id = p_idea_id LOOP
    v_payout := v_investment.amount * 2;
    
    -- Update Wallet
    UPDATE user_wallets 
    SET balance = balance + v_payout,
        total_earned = total_earned + (v_payout - v_investment.amount)
    WHERE user_name = v_investment.user_name;

    -- Log Transaction
    INSERT INTO transactions (user_name, type, amount, related_entity_id, description)
    VALUES (v_investment.user_name, 'payout', v_payout, p_idea_id, 'Payout for successful project');
  END LOOP;

  RETURN jsonb_build_object('success', true, 'message', 'Prediction resolved and payouts distributed');
END;
$$ LANGUAGE plpgsql;

-- 8. RPC: Post Bounty
CREATE OR REPLACE FUNCTION post_bounty(
  p_idea_id UUID,
  p_amount INTEGER,
  p_user_name TEXT
)
RETURNS JSONB AS $$
DECLARE
  v_current_balance INTEGER;
BEGIN
  -- Check balance
  SELECT balance INTO v_current_balance FROM user_wallets WHERE user_name = p_user_name;
  
  IF v_current_balance < p_amount THEN
    RETURN jsonb_build_object('success', false, 'message', 'Insufficient balance');
  END IF;

  -- Deduct balance
  UPDATE user_wallets 
  SET balance = balance - p_amount 
  WHERE user_name = p_user_name;

  -- Update Idea
  UPDATE ideas 
  SET is_bounty = true, 
      bounty_amount = p_amount 
  WHERE id = p_idea_id;

  -- Log Transaction
  INSERT INTO transactions (user_name, type, amount, related_entity_id, description)
  VALUES (p_user_name, 'bounty_post', -p_amount, p_idea_id, 'Posted bounty');

  RETURN jsonb_build_object('success', true);
END;
$$ LANGUAGE plpgsql;

-- 9. RPC: Claim Bounty (Accept Solution)
CREATE OR REPLACE FUNCTION accept_bounty_solution(
  p_idea_id UUID,
  p_winner_user_name TEXT
)
RETURNS JSONB AS $$
DECLARE
  v_bounty_amount INTEGER;
BEGIN
  -- Get bounty amount
  SELECT bounty_amount INTO v_bounty_amount FROM ideas WHERE id = p_idea_id;
  
  IF v_bounty_amount IS NULL OR v_bounty_amount = 0 THEN
     RETURN jsonb_build_object('success', false, 'message', 'No bounty found');
  END IF;

  -- Transfer to Winner
  UPDATE user_wallets 
  SET balance = balance + v_bounty_amount,
      total_earned = total_earned + v_bounty_amount
  WHERE user_name = p_winner_user_name;

  -- Close Bounty
  UPDATE ideas 
  SET is_bounty = false,
      bounty_winner_id = (SELECT id FROM auth.users WHERE raw_user_meta_data->>'name' = p_winner_user_name LIMIT 1) -- Optional linkage
  WHERE id = p_idea_id;

  -- Log Transaction
  INSERT INTO transactions (user_name, type, amount, related_entity_id, description)
  VALUES (p_winner_user_name, 'bounty_win', v_bounty_amount, p_idea_id, 'Won bounty');

  RETURN jsonb_build_object('success', true);
END;
$$ LANGUAGE plpgsql;
