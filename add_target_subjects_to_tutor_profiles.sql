ALTER TABLE tutor_profiles ADD COLUMN IF NOT EXISTS target_subjects TEXT[] DEFAULT '{}';
ALTER TABLE tutor_profiles ADD COLUMN IF NOT EXISTS learning_styles TEXT[] DEFAULT '{}';
ALTER TABLE tutor_profiles ADD COLUMN IF NOT EXISTS available_days INTEGER[] DEFAULT '{}';
ALTER TABLE tutor_profiles ADD COLUMN IF NOT EXISTS available_hours TEXT[] DEFAULT '{}';

-- Force schema cache reload for Supabase
NOTIFY pgrst, 'reload schema';
