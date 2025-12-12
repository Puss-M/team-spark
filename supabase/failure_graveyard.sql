-- Add failure tracking to ideas table

-- Add new columns for failure tracking
ALTER TABLE ideas 
ADD COLUMN IF NOT EXISTS is_failed BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS failure_reason TEXT,
ADD COLUMN IF NOT EXISTS failed_at TIMESTAMPTZ;

-- Update transactions type to include failure reward
ALTER TABLE transactions DROP CONSTRAINT IF EXISTS transactions_type_check;
ALTER TABLE transactions ADD CONSTRAINT transactions_type_check 
CHECK (type IN ('bet', 'payout', 'bounty_post', 'bounty_win', 'deposit', 'withdrawal', 'failure_reward'));

-- RPC function to archive idea as failed with double coin reward
CREATE OR REPLACE FUNCTION archive_as_failed(
  p_idea_id UUID,
  p_user_name TEXT,
  p_failure_reason TEXT
)
RETURNS JSONB AS $$
DECLARE
  v_reward_amount INTEGER := 100; -- Double the normal reward
BEGIN
  -- Verify the user is the author
  IF NOT EXISTS (
    SELECT 1 FROM ideas 
    WHERE id = p_idea_id 
    AND p_user_name = ANY(author_id)
  ) THEN
    RETURN jsonb_build_object('success', false, 'message', '只有作者可以归档失败');
  END IF;

  -- Update idea as failed
  UPDATE ideas
  SET is_failed = true,
      failure_reason = p_failure_reason,
      failed_at = NOW(),
      status = 'idea' -- Keep as idea, not project
  WHERE id = p_idea_id;

  -- Initialize wallet if not exists
  INSERT INTO user_wallets (user_name, balance)
  VALUES (p_user_name, 100)
  ON CONFLICT (user_name) DO NOTHING;

  -- Award double coins
  UPDATE user_wallets
  SET balance = balance + v_reward_amount,
      total_earned = total_earned + v_reward_amount,
      updated_at = NOW()
  WHERE user_name = p_user_name;

  -- Log transaction
  INSERT INTO transactions (user_name, type, amount, related_entity_id, description)
  VALUES (p_user_name, 'failure_reward', v_reward_amount, p_idea_id, '失败归档奖励（双倍）');

  RETURN jsonb_build_object(
    'success', true, 
    'rewarded', v_reward_amount,
    'message', '感谢分享失败经验！获得双倍奖励'
  );
END;
$$ LANGUAGE plpgsql;
