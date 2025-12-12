-- Archaeology Mission: Award coins for completing daily task

CREATE OR REPLACE FUNCTION award_archaeology_coins(
  p_user_name TEXT,
  p_amount INTEGER,
  p_idea_id UUID
)
RETURNS JSONB AS $$
BEGIN
  -- Initialize wallet if not exists
  INSERT INTO user_wallets (user_name, balance)
  VALUES (p_user_name, 100)
  ON CONFLICT (user_name) DO NOTHING;

  -- Add coins to balance
  UPDATE user_wallets
  SET balance = balance + p_amount,
      total_earned = total_earned + p_amount,
      updated_at = NOW()
  WHERE user_name = p_user_name;

  -- Log transaction
  INSERT INTO transactions (user_name, type, amount, related_entity_id, description)
  VALUES (p_user_name, 'deposit', p_amount, p_idea_id, '考古任务奖励');

  RETURN jsonb_build_object('success', true, 'awarded', p_amount);
END;
$$ LANGUAGE plpgsql;
