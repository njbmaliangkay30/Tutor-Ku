-- CREATE PLATFORM SETTINGS TABLE
CREATE TABLE IF NOT EXISTS platform_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ENABLE ROW LEVEL SECURITY
ALTER TABLE platform_settings ENABLE ROW LEVEL SECURITY;

-- 1. Allow everyone (public & authenticated) to read the settings
CREATE POLICY "Allow public read access to platform_settings"
  ON platform_settings
  FOR SELECT
  TO public
  USING (true);

-- 2. Allow write access (INSERT, UPDATE, DELETE) only to Admins
CREATE POLICY "Allow admin write access to platform_settings"
  ON platform_settings
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- INSERT INITIAL PAYMENT SETTINGS DATA
INSERT INTO platform_settings (key, value)
VALUES (
  'payment_settings',
  '{
    "bank_name": "BANK BCA",
    "account_number": "223-0182-991",
    "account_name": "RuangTutor Platform",
    "qris_url": "https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=https://RuangTutorPlatformQRIS"
  }'::jsonb
)
ON CONFLICT (key) DO NOTHING;
