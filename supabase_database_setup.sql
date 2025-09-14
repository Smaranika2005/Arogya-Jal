-- =====================================================
-- ASHA Guard Dashboard - Complete Supabase Database Setup
-- =====================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. PROFILES TABLE
-- =====================================================
-- This table stores user profiles linked to Supabase Auth
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('asha', 'government')),
  phone TEXT UNIQUE,
  email TEXT UNIQUE,
  is_active BOOLEAN DEFAULT true,
  last_login TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 2. AUTHENTICATION SETUP
-- =====================================================

-- Enable email authentication
-- This is handled by Supabase Auth automatically, but we can configure it

-- =====================================================
-- 3. SURVEYS TABLE
-- =====================================================
-- This table stores all health surveys submitted by ASHA workers
CREATE TABLE surveys (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  asha_worker_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  
  -- Survey form data (stored as JSONB for flexibility)
  survey_data JSONB NOT NULL,
  
  -- Specific fields for easy querying
  survey_date DATE NOT NULL,
  booth_number TEXT NOT NULL,
  age_group_affected TEXT NOT NULL CHECK (age_group_affected IN ('children', 'adults', 'elderly')),
  symptom_duration TEXT,
  
  -- Water quality data
  water_bodies_count INTEGER,
  avg_ph NUMERIC(4,2),
  avg_turbidity NUMERIC(6,2),
  
  -- Symptoms array
  symptoms TEXT[] NOT NULL DEFAULT '{}',
  
  -- Location data
  latitude NUMERIC(10, 7),
  longitude NUMERIC(10, 7),
  
  -- Additional information
  water_quality TEXT,
  notes TEXT,
  
  -- Metadata
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 4. ADDITIONAL TABLES
-- =====================================================

-- BOOTHS TABLE - For managing ASHA worker booth assignments
CREATE TABLE booths (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  booth_number TEXT UNIQUE NOT NULL,
  booth_name TEXT,
  location TEXT,
  latitude NUMERIC(10, 7),
  longitude NUMERIC(10, 7),
  assigned_asha_worker_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT true,
  notes TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- HEALTH ALERTS TABLE - For tracking critical health situations
CREATE TABLE health_alerts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  survey_id UUID REFERENCES surveys(id) ON DELETE CASCADE,
  asha_worker_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  alert_type TEXT NOT NULL CHECK (alert_type IN ('critical', 'warning', 'info')),
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  title TEXT NOT NULL,
  description TEXT,
  symptoms TEXT[],
  affected_count INTEGER,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'investigating', 'resolved', 'closed')),
  assigned_to UUID REFERENCES profiles(id) ON DELETE SET NULL,
  resolved_at TIMESTAMPTZ,
  resolution_notes TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- NOTIFICATIONS TABLE - For system notifications
CREATE TABLE notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('info', 'warning', 'error', 'success')),
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,
  action_url TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- AUDIT LOG TABLE - For tracking important actions
CREATE TABLE audit_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  table_name TEXT,
  record_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT
);

-- =====================================================
-- 5. INDEXES FOR PERFORMANCE
-- =====================================================
-- Create indexes for better query performance
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_profiles_created_at ON profiles(created_at);

CREATE INDEX idx_surveys_asha_worker_id ON surveys(asha_worker_id);
CREATE INDEX idx_surveys_created_at ON surveys(created_at);
CREATE INDEX idx_surveys_survey_date ON surveys(survey_date);
CREATE INDEX idx_surveys_age_group ON surveys(age_group_affected);
CREATE INDEX idx_surveys_symptoms ON surveys USING GIN(symptoms);
CREATE INDEX idx_surveys_location ON surveys(latitude, longitude) WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

-- Indexes for new tables
CREATE INDEX idx_booths_asha_worker ON booths(assigned_asha_worker_id);
CREATE INDEX idx_booths_active ON booths(is_active) WHERE is_active = true;

CREATE INDEX idx_health_alerts_survey ON health_alerts(survey_id);
CREATE INDEX idx_health_alerts_asha_worker ON health_alerts(asha_worker_id);
CREATE INDEX idx_health_alerts_status ON health_alerts(status);
CREATE INDEX idx_health_alerts_severity ON health_alerts(severity);

CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(is_read);
CREATE INDEX idx_notifications_type ON notifications(type);

CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_table ON audit_logs(table_name);

-- =====================================================
-- 6. ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE surveys ENABLE ROW LEVEL SECURITY;
ALTER TABLE booths ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- PROFILES TABLE POLICIES
-- =====================================================

-- Users can view their own profile
CREATE POLICY "Users can view their own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Users can insert their own profile (during signup)
CREATE POLICY "Users can insert their own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Government users can view all profiles
CREATE POLICY "Government users can view all profiles" ON profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'government'
    )
  );

-- Government users can update any profile
CREATE POLICY "Government users can update any profile" ON profiles
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'government'
    )
  );

-- =====================================================
-- SURVEYS TABLE POLICIES
-- =====================================================

-- ASHA workers can view their own surveys
CREATE POLICY "ASHA workers can view their own surveys" ON surveys
  FOR SELECT USING (asha_worker_id = auth.uid());

-- ASHA workers can create surveys
CREATE POLICY "ASHA workers can create surveys" ON surveys
  FOR INSERT WITH CHECK (asha_worker_id = auth.uid());

-- ASHA workers can update their own surveys
CREATE POLICY "ASHA workers can update their own surveys" ON surveys
  FOR UPDATE USING (asha_worker_id = auth.uid());

-- ASHA workers can delete their own surveys
CREATE POLICY "ASHA workers can delete their own surveys" ON surveys
  FOR DELETE USING (asha_worker_id = auth.uid());

-- Government users can view all surveys
CREATE POLICY "Government users can view all surveys" ON surveys
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'government'
    )
  );

-- Government users can delete any survey
CREATE POLICY "Government users can delete any survey" ON surveys
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'government'
    )
  );

-- =====================================================
-- BOOTHS TABLE POLICIES
-- =====================================================

-- ASHA workers can view their assigned booth
CREATE POLICY "ASHA workers can view their assigned booth" ON booths
  FOR SELECT USING (assigned_asha_worker_id = auth.uid());

-- Government users can manage all booths
CREATE POLICY "Government users can manage all booths" ON booths
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'government'
    )
  );

-- =====================================================
-- HEALTH ALERTS TABLE POLICIES
-- =====================================================

-- ASHA workers can view alerts from their surveys
CREATE POLICY "ASHA workers can view their alerts" ON health_alerts
  FOR SELECT USING (asha_worker_id = auth.uid());

-- Government users can manage all alerts
CREATE POLICY "Government users can manage all alerts" ON health_alerts
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'government'
    )
  );

-- =====================================================
-- NOTIFICATIONS TABLE POLICIES
-- =====================================================

-- Users can view their own notifications
CREATE POLICY "Users can view their own notifications" ON notifications
  FOR SELECT USING (user_id = auth.uid());

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update their own notifications" ON notifications
  FOR UPDATE USING (user_id = auth.uid());

-- System can create notifications for any user
CREATE POLICY "System can create notifications" ON notifications
  FOR INSERT WITH CHECK (true);

-- =====================================================
-- AUDIT LOGS TABLE POLICIES
-- =====================================================

-- Government users can view all audit logs
CREATE POLICY "Government users can view audit logs" ON audit_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'government'
    )
  );

-- System can create audit logs
CREATE POLICY "System can create audit logs" ON audit_logs
  FOR INSERT WITH CHECK (true);

-- =====================================================
-- 7. FUNCTIONS AND TRIGGERS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers to automatically update updated_at
CREATE TRIGGER update_profiles_updated_at 
  BEFORE UPDATE ON profiles 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_surveys_updated_at 
  BEFORE UPDATE ON surveys 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_booths_updated_at 
  BEFORE UPDATE ON booths 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_health_alerts_updated_at 
  BEFORE UPDATE ON health_alerts 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notifications_updated_at 
  BEFORE UPDATE ON notifications 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to automatically create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, role)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'name', NEW.email, NEW.raw_user_meta_data->>'role');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile when user signs up
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to log user login
CREATE OR REPLACE FUNCTION public.log_user_login()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.profiles 
  SET last_login = NOW() 
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 8. HELPFUL VIEWS
-- =====================================================

-- View for survey data with profile information
CREATE VIEW survey_details AS
SELECT 
  s.*,
  p.name as asha_worker_name,
  p.role as asha_worker_role,
  p.phone as asha_worker_phone
FROM surveys s
JOIN profiles p ON s.asha_worker_id = p.id;

-- View for dashboard statistics
CREATE VIEW dashboard_stats AS
SELECT 
  (SELECT COUNT(*) FROM profiles WHERE role = 'asha' AND is_active = true) as total_asha_workers,
  (SELECT COUNT(*) FROM profiles WHERE role = 'government' AND is_active = true) as total_government_users,
  (SELECT COUNT(*) FROM surveys) as total_surveys,
  (SELECT COUNT(*) FROM surveys WHERE created_at >= NOW() - INTERVAL '7 days') as surveys_this_week,
  (SELECT COUNT(*) FROM surveys WHERE created_at >= NOW() - INTERVAL '30 days') as surveys_this_month,
  (SELECT COUNT(*) FROM surveys WHERE symptoms && ARRAY['Diarrhoea', 'Vomiting']) as critical_alerts,
  (SELECT COUNT(*) FROM health_alerts WHERE status = 'open') as open_alerts,
  (SELECT COUNT(*) FROM booths WHERE is_active = true) as total_booths,
  (SELECT COUNT(*) FROM notifications WHERE is_read = false) as unread_notifications;

-- View for ASHA worker dashboard
CREATE VIEW asha_worker_stats AS
SELECT 
  p.id as worker_id,
  p.name as worker_name,
  COUNT(s.id) as total_surveys,
  COUNT(CASE WHEN s.created_at >= NOW() - INTERVAL '7 days' THEN 1 END) as surveys_this_week,
  COUNT(CASE WHEN s.created_at >= NOW() - INTERVAL '30 days' THEN 1 END) as surveys_this_month,
  COUNT(ha.id) as total_alerts,
  COUNT(CASE WHEN ha.status = 'open' THEN 1 END) as open_alerts,
  COUNT(n.id) as unread_notifications
FROM profiles p
LEFT JOIN surveys s ON p.id = s.asha_worker_id
LEFT JOIN health_alerts ha ON p.id = ha.asha_worker_id
LEFT JOIN notifications n ON p.id = n.user_id AND n.is_read = false
WHERE p.role = 'asha' AND p.is_active = true
GROUP BY p.id, p.name;

-- View for booth assignments
CREATE VIEW booth_assignments AS
SELECT 
  b.*,
  p.name as assigned_worker_name,
  p.phone as assigned_worker_phone,
  p.email as assigned_worker_email,
  COUNT(s.id) as total_surveys,
  MAX(s.created_at) as last_survey_date
FROM booths b
LEFT JOIN profiles p ON b.assigned_asha_worker_id = p.id
LEFT JOIN surveys s ON p.id = s.asha_worker_id
WHERE b.is_active = true
GROUP BY b.id, p.name, p.phone, p.email;

-- =====================================================
-- 7. SAMPLE DATA (OPTIONAL)
-- =====================================================

-- Insert sample ASHA worker (you'll need to create this user in Supabase Auth first)
-- INSERT INTO profiles (id, name, role, phone, email) VALUES 
-- ('00000000-0000-0000-0000-000000000001', 'Sample ASHA Worker', 'asha', '+1234567890', 'asha@example.com');

-- Insert sample government user
-- INSERT INTO profiles (id, name, role, phone, email) VALUES 
-- ('00000000-0000-0000-0000-000000000002', 'Government Official', 'government', '+1234567891', 'gov@example.com');

-- =====================================================
-- 8. USEFUL QUERIES FOR TESTING
-- =====================================================

-- Get all surveys with worker details
-- SELECT * FROM survey_details ORDER BY created_at DESC;

-- Get dashboard statistics
-- SELECT * FROM dashboard_stats;

-- Get surveys by symptom
-- SELECT * FROM surveys WHERE 'Diarrhoea' = ANY(symptoms);

-- Get surveys by age group
-- SELECT * FROM surveys WHERE age_group_affected = 'children';

-- Get surveys by date range
-- SELECT * FROM surveys WHERE survey_date BETWEEN '2024-01-01' AND '2024-12-31';

-- Get water quality data
-- SELECT booth_number, avg_ph, avg_turbidity, created_at 
-- FROM surveys 
-- WHERE avg_ph IS NOT NULL AND avg_turbidity IS NOT NULL
-- ORDER BY created_at DESC;

-- =====================================================
-- 9. AUTHENTICATION CONFIGURATION
-- =====================================================

-- Note: These settings need to be configured in Supabase Dashboard
-- Go to Authentication > Settings and configure:

-- 1. Enable Email Authentication
-- 2. Set Site URL: http://localhost:5173 (for development)
-- 3. Add Redirect URLs: http://localhost:5173/**
-- 4. Configure Email Templates (optional)
-- 5. Set up SMTP (optional, for custom emails)

-- =====================================================
-- 10. CLEANUP (if needed)
-- =====================================================

-- To drop everything (use with caution):
-- DROP VIEW IF EXISTS booth_assignments;
-- DROP VIEW IF EXISTS asha_worker_stats;
-- DROP VIEW IF EXISTS dashboard_stats;
-- DROP VIEW IF EXISTS survey_details;
-- DROP TABLE IF EXISTS audit_logs CASCADE;
-- DROP TABLE IF EXISTS notifications CASCADE;
-- DROP TABLE IF EXISTS health_alerts CASCADE;
-- DROP TABLE IF EXISTS booths CASCADE;
-- DROP TABLE IF EXISTS surveys CASCADE;
-- DROP TABLE IF EXISTS profiles CASCADE;
-- DROP FUNCTION IF EXISTS log_user_login();
-- DROP FUNCTION IF EXISTS handle_new_user();
-- DROP FUNCTION IF EXISTS update_updated_at_column();

-- =====================================================
-- END OF COMPLETE SETUP
-- =====================================================
