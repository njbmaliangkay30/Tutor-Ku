-- Drop existing policy if any
DROP POLICY IF EXISTS "Users can update read status of received messages" ON messages;

-- Allow receiver to update the message
CREATE POLICY "Users can update read status of received messages" ON messages
  FOR UPDATE
  USING (auth.uid() = receiver_id)
  WITH CHECK (auth.uid() = receiver_id);
