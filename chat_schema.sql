-- Chats and Messages Schema

CREATE TABLE IF NOT EXISTS messages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  sender_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  receiver_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS policies
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert their own messages" ON messages
  FOR INSERT TO public
  WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can read their own messages" ON messages
  FOR SELECT TO public
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- Update trigger for updated_at? Not needed.
