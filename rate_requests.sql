CREATE TABLE rate_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tutor_id UUID REFERENCES tutor_profiles(id) ON DELETE CASCADE,
  current_rate INTEGER NOT NULL,
  requested_rate INTEGER NOT NULL,
  reason TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE rate_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tutors can view own rate requests"
ON rate_requests FOR SELECT
USING (auth.uid() = tutor_id);

CREATE POLICY "Tutors can insert own rate requests"
ON rate_requests FOR INSERT
WITH CHECK (auth.uid() = tutor_id);

CREATE POLICY "Admin full access to rate requests"
ON rate_requests FOR ALL
USING (EXISTS (
  SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
));
