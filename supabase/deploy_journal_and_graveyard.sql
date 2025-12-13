-- ============================================
-- Journal Club & Failure Graveyard 数据库部署脚本
-- 请在 Supabase SQL Editor 中执行本文件的全部内容
-- ============================================

-- ============================================
-- PART 1: Journal Club Manager
-- ============================================

-- 1. Papers nomination pool
CREATE TABLE IF NOT EXISTS paper_nominations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  authors TEXT,
  paper_url TEXT NOT NULL,
  nominated_by TEXT NOT NULL,
  votes INTEGER DEFAULT 0,
  tags TEXT[] DEFAULT '{}',
  abstract TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  is_scheduled BOOLEAN DEFAULT false
);

-- 2. Reading sessions schedule
CREATE TABLE IF NOT EXISTS reading_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  paper_id UUID REFERENCES paper_nominations(id) ON DELETE CASCADE,
  presenter_name TEXT NOT NULL,
  scheduled_date DATE NOT NULL,
  status TEXT DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'completed', 'cancelled')),
  slides_url TEXT,
  notes TEXT,
  recording_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- 3. Team members rotation list
CREATE TABLE IF NOT EXISTS reading_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_name TEXT NOT NULL UNIQUE,
  last_presented_at TIMESTAMPTZ,
  total_presentations INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  joined_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Paper votes tracking
CREATE TABLE IF NOT EXISTS paper_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  paper_id UUID REFERENCES paper_nominations(id) ON DELETE CASCADE,
  user_name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(paper_id, user_name)
);

-- RLS Policies for Journal Club
ALTER TABLE paper_nominations ENABLE ROW LEVEL SECURITY;
ALTER TABLE reading_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE reading_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE paper_votes ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Anyone can read nominations" ON paper_nominations;
DROP POLICY IF EXISTS "Anyone can read sessions" ON reading_sessions;
DROP POLICY IF EXISTS "Anyone can read members" ON reading_members;
DROP POLICY IF EXISTS "Anyone can read votes" ON paper_votes;
DROP POLICY IF EXISTS "Anyone can nominate papers" ON paper_nominations;
DROP POLICY IF EXISTS "Anyone can vote" ON paper_votes;
DROP POLICY IF EXISTS "Anyone can join rotation" ON reading_members;

-- Allow all authenticated users to read
CREATE POLICY "Anyone can read nominations" ON paper_nominations FOR SELECT USING (true);
CREATE POLICY "Anyone can read sessions" ON reading_sessions FOR SELECT USING (true);
CREATE POLICY "Anyone can read members" ON reading_members FOR SELECT USING (true);
CREATE POLICY "Anyone can read votes" ON paper_votes FOR SELECT USING (true);

-- Allow insert/update
CREATE POLICY "Anyone can nominate papers" ON paper_nominations FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can vote" ON paper_votes FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can join rotation" ON reading_members FOR INSERT WITH CHECK (true);

-- RPC: Vote for a paper
CREATE OR REPLACE FUNCTION vote_for_paper(
  p_paper_id UUID,
  p_user_name TEXT
)
RETURNS JSONB AS $$
BEGIN
  -- Insert vote (will fail if already voted due to UNIQUE constraint)
  INSERT INTO paper_votes (paper_id, user_name)
  VALUES (p_paper_id, p_user_name)
  ON CONFLICT (paper_id, user_name) DO NOTHING;

  -- Update vote count
  UPDATE paper_nominations
  SET votes = (SELECT COUNT(*) FROM paper_votes WHERE paper_id = p_paper_id)
  WHERE id = p_paper_id;

  RETURN jsonb_build_object('success', true);
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql;

-- RPC: Get next presenter (round-robin)
CREATE OR REPLACE FUNCTION get_next_presenter()
RETURNS TEXT AS $$
DECLARE
  v_presenter TEXT;
BEGIN
  -- Find active member who presented longest ago (or never presented)
  SELECT user_name INTO v_presenter
  FROM reading_members
  WHERE is_active = true
  ORDER BY 
    CASE WHEN last_presented_at IS NULL THEN '1900-01-01'::TIMESTAMPTZ 
         ELSE last_presented_at END ASC,
    total_presentations ASC
  LIMIT 1;

  RETURN v_presenter;
END;
$$ LANGUAGE plpgsql;

-- RPC: Schedule next session
CREATE OR REPLACE FUNCTION schedule_next_session(
  p_scheduled_date DATE
)
RETURNS JSONB AS $$
DECLARE
  v_paper_id UUID;
  v_presenter TEXT;
  v_session_id UUID;
BEGIN
  -- Get top voted unscheduled paper
  SELECT id INTO v_paper_id
  FROM paper_nominations
  WHERE is_scheduled = false
  ORDER BY votes DESC, created_at ASC
  LIMIT 1;

  IF v_paper_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'message', '没有可安排的论文');
  END IF;

  -- Get next presenter
  v_presenter := get_next_presenter();

  IF v_presenter IS NULL THEN
    RETURN jsonb_build_object('success', false, 'message', '没有可用的主讲人');
  END IF;

  -- Create session
  INSERT INTO reading_sessions (paper_id, presenter_name, scheduled_date)
  VALUES (v_paper_id, v_presenter, p_scheduled_date)
  RETURNING id INTO v_session_id;

  -- Mark paper as scheduled
  UPDATE paper_nominations SET is_scheduled = true WHERE id = v_paper_id;

  RETURN jsonb_build_object(
    'success', true,
    'session_id', v_session_id,
    'presenter', v_presenter,
    'paper_id', v_paper_id
  );
END;
$$ LANGUAGE plpgsql;

-- RPC: Complete session with materials
CREATE OR REPLACE FUNCTION complete_session(
  p_session_id UUID,
  p_slides_url TEXT,
  p_notes TEXT DEFAULT NULL,
  p_recording_url TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_presenter TEXT;
BEGIN
  -- Get presenter
  SELECT presenter_name INTO v_presenter
  FROM reading_sessions
  WHERE id = p_session_id;

  -- Update session
  UPDATE reading_sessions
  SET status = 'completed',
      slides_url = p_slides_url,
      notes = p_notes,
      recording_url = p_recording_url,
      completed_at = NOW()
  WHERE id = p_session_id;

  -- Update presenter stats
  UPDATE reading_members
  SET last_presented_at = NOW(),
      total_presentations = total_presentations + 1
  WHERE user_name = v_presenter;

  RETURN jsonb_build_object('success', true);
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- PART 2: Failure Graveyard
-- ============================================

-- Add failure tracking columns to ideas table
ALTER TABLE ideas 
ADD COLUMN IF NOT EXISTS is_failed BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS failure_reason TEXT,
ADD COLUMN IF NOT EXISTS failed_at TIMESTAMPTZ;

-- Update transactions type constraint
ALTER TABLE transactions DROP CONSTRAINT IF EXISTS transactions_type_check;
ALTER TABLE transactions ADD CONSTRAINT transactions_type_check 
CHECK (type IN ('bet', 'payout', 'bounty_post', 'bounty_win', 'deposit', 'withdrawal', 'failure_reward'));

-- RPC: Archive idea as failed with double coin reward
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

-- ============================================
-- Verification Queries (Optional - for testing)
-- ============================================

-- Check all tables created
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('paper_nominations', 'reading_sessions', 'reading_members', 'paper_votes')
ORDER BY table_name;

-- Check all RPC functions created
SELECT routine_name FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN ('vote_for_paper', 'get_next_presenter', 'schedule_next_session', 'complete_session', 'archive_as_failed')
ORDER BY routine_name;

-- Check ideas table columns
SELECT column_name, data_type FROM information_schema.columns 
WHERE table_name = 'ideas' 
AND column_name IN ('is_failed', 'failure_reason', 'failed_at')
ORDER BY column_name;
