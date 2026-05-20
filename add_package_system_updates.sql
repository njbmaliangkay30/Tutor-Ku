-- Add tutor_id column to student_packages as bundles are for specific tutors
ALTER TABLE student_packages ADD COLUMN IF NOT EXISTS tutor_id UUID REFERENCES tutor_profiles(id) DEFAULT NULL;

-- Enable Row Level Security (RLS) if not already, or make sure correct access is given
-- Generally under the existing setup, tables are fully bypassable or open, but let's notify schema reload.

-- Force schema cache reload for Supabase
NOTIFY pgrst, 'reload schema';
