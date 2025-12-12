-- Journal Club Manager Database Schema

-- 1. Papers nomination pool
CREATE TABLE IF NOT EXISTS paper_nominations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  authors TEXT,
  paper_url TEXT NOT NULL, -- arXiv or other link
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

-- RLS Policies
ALTER TABLE paper_nominations ENABLE ROW LEVEL SECURITY;
ALTER TABLE reading_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE reading_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE paper_votes ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to read
CREATE POLICY "Anyone can read nominations" ON paper_nominations FOR SELECT USING (true);
CREATE POLICY "Anyone can read sessions" ON reading_sessions FOR SELECT USING (true);
CREATE POLICY "Anyone can read members" ON reading_members FOR SELECT USING (true);
CREATE POLICY "Anyone can read votes" ON paper_votes FOR SELECT USING (true);

-- Allow insert/update with authentication
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
