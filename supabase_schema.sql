-- Enable uuid-ossp just in case, though gen_random_uuid() is built-in for newer Postgres
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table handled by Supabase Auth (auth.users), we create a profiles table

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
    CREATE TYPE user_role AS ENUM ('student', 'tutor', 'admin');
  END IF;
END$$;

-- PROFILES
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  role user_role NOT NULL DEFAULT 'student',
  full_name TEXT NOT NULL,
  avatar_url TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- TUTOR PROFILES
CREATE TABLE tutor_profiles (
  id UUID REFERENCES profiles(id) ON DELETE CASCADE PRIMARY KEY,
  bio TEXT,
  hourly_rate INTEGER NOT NULL DEFAULT 0,
  rating DECIMAL(3,2) DEFAULT 0.0,
  total_reviews INTEGER DEFAULT 0,
  gender TEXT,
  is_verified BOOLEAN DEFAULT FALSE,
  address TEXT,
  target_subjects TEXT[],
  learning_styles TEXT[],
  available_days INTEGER[], -- e.g., [1,3,5] for Mon, Wed, Fri
  available_hours TEXT[]
);

-- TUTOR SUBJECTS
CREATE TABLE tutor_subjects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tutor_id UUID REFERENCES tutor_profiles(id) ON DELETE CASCADE,
  subject_name TEXT NOT NULL,
  level TEXT -- e.g., 'SMA', 'Kuliah'
);

-- STUDENT PROFILES
CREATE TABLE student_profiles (
  id UUID REFERENCES profiles(id) ON DELETE CASCADE PRIMARY KEY,
  school_level TEXT,
  preferences JSONB -- e.g., preferred learning style
);

-- PACKAGES / BUNDLES
CREATE TABLE packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  session_count INTEGER NOT NULL,
  price INTEGER NOT NULL,
  description TEXT
);

-- STUDENT PACKAGES (Purchased)
CREATE TABLE student_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES student_profiles(id) ON DELETE CASCADE,
  package_id UUID REFERENCES packages(id) ON DELETE RESTRICT,
  remaining_sessions INTEGER,
  valid_until TIMESTAMPTZ,
  status TEXT DEFAULT 'active' -- active, expired, empty
);

-- BOOKINGS / SESSIONS
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES student_profiles(id) ON DELETE CASCADE,
  tutor_id UUID REFERENCES tutor_profiles(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  session_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  material_notes TEXT, -- Notes from student before session
  status TEXT DEFAULT 'pending', -- pending, accepted, completed, cancelled
  payment_status TEXT DEFAULT 'unpaid', -- unpaid, paid, refunded
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- SESSION REPORTS (From Tutor)
CREATE TABLE session_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  tutor_id UUID REFERENCES tutor_profiles(id) ON DELETE CASCADE,
  summary TEXT NOT NULL,
  student_understanding_level INTEGER CHECK (student_understanding_level BETWEEN 1 AND 5),
  homework TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- REVIEWS (From Student)
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  student_id UUID REFERENCES student_profiles(id) ON DELETE CASCADE,
  tutor_id UUID REFERENCES tutor_profiles(id) ON DELETE CASCADE,
  rating INTEGER CHECK (rating BETWEEN 1 AND 5) NOT NULL,
  review_text TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- STUDENT PROGRESS (Tracker per subject)
CREATE TABLE student_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES student_profiles(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  mastery_level INTEGER DEFAULT 1, -- e.g. 1-100
  sessions_attended INTEGER DEFAULT 0,
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_id, subject)
);

-- PAYMENTS / TRANSACTIONS
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  transaction_type TEXT, -- session_booking, bundle_purchase, withdrawal
  status TEXT DEFAULT 'pending', -- pending, success, failed
  reference_id TEXT, -- For external gateways (Midtrans, etc)
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- TUTOR VERIFICATIONS
CREATE TABLE tutor_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tutor_id UUID REFERENCES tutor_profiles(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending', -- pending, approved, rejected
  ktp_url TEXT,
  ijazah_url TEXT,
  bidang_mengajar TEXT,
  pengalaman_mengajar TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- CREATE BUCKET AND SET POLICIES FOR 'Data Verifikasi Tutor'
INSERT INTO storage.buckets (id, name, public) 
VALUES ('Data Verifikasi Tutor', 'Data Verifikasi Tutor', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Allow public uploads to Data Verifikasi Tutor" ON storage.objects;
DROP POLICY IF EXISTS "Allow public reading Data Verifikasi Tutor" ON storage.objects;
DROP POLICY IF EXISTS "Allow public update to Data Verifikasi Tutor" ON storage.objects;

CREATE POLICY "Allow public uploads to Data Verifikasi Tutor" ON storage.objects
FOR INSERT TO public WITH CHECK (bucket_id = 'Data Verifikasi Tutor');

CREATE POLICY "Allow public reading Data Verifikasi Tutor" ON storage.objects
FOR SELECT TO public USING (bucket_id = 'Data Verifikasi Tutor');

CREATE POLICY "Allow public update to Data Verifikasi Tutor" ON storage.objects
FOR UPDATE TO public USING (bucket_id = 'Data Verifikasi Tutor');


