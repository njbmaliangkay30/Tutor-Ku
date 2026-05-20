-- SQL migration for payment system enhancements

-- 1. Create receipts bucket for storing transfer proof images
INSERT INTO storage.buckets (id, name, public) VALUES ('receipts', 'receipts', true) ON CONFLICT (id) DO NOTHING;

-- Receipts bucket access rules
CREATE POLICY "Payment receipts are publicly accessible." ON storage.objects FOR SELECT USING (bucket_id = 'receipts');
CREATE POLICY "Anyone can upload a payment receipt." ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'receipts');
CREATE POLICY "Anyone can update a payment receipt." ON storage.objects FOR UPDATE USING (bucket_id = 'receipts');
CREATE POLICY "Anyone can delete a payment receipt." ON storage.objects FOR DELETE USING (bucket_id = 'receipts');

-- 2. Add columns to transactions table to support proof of payment and linkage
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS proof_url TEXT;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'bank_transfer';
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS session_id UUID REFERENCES sessions(id) ON DELETE SET NULL;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS student_package_id UUID REFERENCES student_packages(id) ON DELETE SET NULL;

-- 3. Ensure student_packages has a 'pending_payment' status option or handle via status
-- Our code can use 'pending_payment' as a text status value for student_packages.status column.
