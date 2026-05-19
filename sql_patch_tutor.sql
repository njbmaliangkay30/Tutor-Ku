ALTER TABLE tutor_profiles ADD COLUMN IF NOT EXISTS university TEXT;
ALTER TABLE tutor_profiles ADD COLUMN IF NOT EXISTS schedule JSONB;
ALTER TABLE tutor_verifications ADD COLUMN IF NOT EXISTS achievements TEXT;
ALTER TABLE tutor_verifications ADD COLUMN IF NOT EXISTS supporting_docs_url TEXT[];

-- Force schema cache reload for Supabase
NOTIFY pgrst, 'reload schema';
