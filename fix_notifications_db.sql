-- Enable Realtime for notifications table
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;

-- Add INSERT policy so users can notify each other (e.g. Student notifying Tutor)
CREATE POLICY "Authenticated users can insert notifications" 
ON notifications FOR INSERT 
WITH CHECK (auth.role() = 'authenticated');

-- Ensure the existing policies are correct
-- (They should already exist from previous run, but we make sure)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'notifications' AND policyname = 'Users can view their own notifications') THEN
        CREATE POLICY "Users can view their own notifications" ON notifications FOR SELECT USING (auth.uid() = user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'notifications' AND policyname = 'Users can update their own notifications') THEN
        CREATE POLICY "Users can update their own notifications" ON notifications FOR UPDATE USING (auth.uid() = user_id);
    END IF;
END $$;
