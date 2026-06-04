-- Arogya Jal - Allow authenticated users to view ASHA worker profiles
-- Run this in the Supabase SQL Editor to enable public users to view ASHA worker names in the registry.

DROP POLICY IF EXISTS "Anyone can view ASHA worker profiles" ON profiles;
CREATE POLICY "Anyone can view ASHA worker profiles" ON profiles
  FOR SELECT TO authenticated
  USING (role = 'asha_worker');
