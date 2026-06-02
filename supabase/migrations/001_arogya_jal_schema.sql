-- Arogya Jal - Water Quality Monitoring Platform
-- PostgreSQL / Supabase schema (MVP + IoT-ready)

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- PROFILES (extends auth.users)
-- ============================================================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'asha_worker'
    CHECK (role IN ('asha_worker', 'government', 'public_user', 'iot_service')),
  municipality_id BIGINT,
  ward_id BIGINT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_municipality ON profiles(municipality_id);

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS municipality_id BIGINT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS ward_id BIGINT;

-- ============================================================================
-- GEOGRAPHIC HIERARCHY
-- ============================================================================
CREATE TABLE IF NOT EXISTS municipalities (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS wards (
  id BIGSERIAL PRIMARY KEY,
  municipality_id BIGINT NOT NULL REFERENCES municipalities(id) ON DELETE CASCADE,
  ward_number VARCHAR(50),
  ward_name VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (municipality_id, ward_number)
);

CREATE INDEX IF NOT EXISTS idx_wards_municipality ON wards(municipality_id);

CREATE TABLE IF NOT EXISTS booths (
  id BIGSERIAL PRIMARY KEY,
  ward_id BIGINT NOT NULL REFERENCES wards(id) ON DELETE CASCADE,
  booth_number VARCHAR(50),
  booth_name VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (ward_id, booth_number)
);

CREATE INDEX IF NOT EXISTS idx_booths_ward ON booths(ward_id);

CREATE TABLE IF NOT EXISTS water_bodies (
  id BIGSERIAL PRIMARY KEY,
  booth_id BIGINT NOT NULL REFERENCES booths(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  latitude DECIMAL(10, 7),
  longitude DECIMAL(10, 7),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_water_bodies_booth ON water_bodies(booth_id);

-- ============================================================================
-- SENSORS & READINGS
-- ============================================================================
CREATE TABLE IF NOT EXISTS sensors (
  id BIGSERIAL PRIMARY KEY,
  sensor_code VARCHAR(100) UNIQUE NOT NULL,
  sensor_type VARCHAR(50) NOT NULL
    CHECK (sensor_type IN ('PH', 'TDS', 'TURBIDITY', 'TEMPERATURE', 'DISSOLVED_OXYGEN')),
  water_body_id BIGINT NOT NULL REFERENCES water_bodies(id) ON DELETE CASCADE,
  status VARCHAR(50) DEFAULT 'active',
  installed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sensors_water_body ON sensors(water_body_id);
CREATE INDEX IF NOT EXISTS idx_sensors_code ON sensors(sensor_code);

CREATE TABLE IF NOT EXISTS sensor_readings (
  id BIGSERIAL PRIMARY KEY,
  sensor_id BIGINT NOT NULL REFERENCES sensors(id) ON DELETE CASCADE,
  raw_adc_value INTEGER,
  voltage DECIMAL(10, 4),
  sensor_value DECIMAL(10, 4) NOT NULL,
  recorded_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sensor_readings_sensor ON sensor_readings(sensor_id);
CREATE INDEX IF NOT EXISTS idx_sensor_readings_recorded ON sensor_readings(recorded_at DESC);

-- ============================================================================
-- PRECOMPUTED SUMMARIES & REPORTS
-- ============================================================================
CREATE TABLE IF NOT EXISTS water_body_summary (
  water_body_id BIGINT PRIMARY KEY REFERENCES water_bodies(id) ON DELETE CASCADE,
  current_ph DECIMAL(5, 2),
  avg_ph_7_days DECIMAL(5, 2),
  avg_ph_30_days DECIMAL(5, 2),
  total_readings BIGINT DEFAULT 0,
  last_updated TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS water_quality_reports (
  id BIGSERIAL PRIMARY KEY,
  booth_id BIGINT NOT NULL REFERENCES booths(id) ON DELETE CASCADE,
  water_body_id BIGINT NOT NULL REFERENCES water_bodies(id) ON DELETE CASCADE,
  avg_ph_used DECIMAL(5, 2) NOT NULL,
  tds DECIMAL(10, 2) NOT NULL,
  turbidity DECIMAL(10, 2) NOT NULL,
  ph_score DECIMAL(10, 2) NOT NULL,
  tds_score DECIMAL(10, 2) NOT NULL,
  turbidity_score DECIMAL(10, 2) NOT NULL,
  wqi DECIMAL(10, 2) NOT NULL,
  water_body_priority INTEGER NOT NULL DEFAULT 1,
  submitted_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_wqr_booth ON water_quality_reports(booth_id);
CREATE INDEX IF NOT EXISTS idx_wqr_water_body ON water_quality_reports(water_body_id);
CREATE INDEX IF NOT EXISTS idx_wqr_created ON water_quality_reports(created_at DESC);

CREATE TABLE IF NOT EXISTS booth_reports (
  id BIGSERIAL PRIMARY KEY,
  booth_id BIGINT NOT NULL REFERENCES booths(id) ON DELETE CASCADE,
  booth_score DECIMAL(10, 2) NOT NULL,
  generated_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  generated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_booth_reports_booth ON booth_reports(booth_id);
CREATE INDEX IF NOT EXISTS idx_booth_reports_generated ON booth_reports(generated_at DESC);

CREATE TABLE IF NOT EXISTS ward_reports (
  id BIGSERIAL PRIMARY KEY,
  ward_id BIGINT NOT NULL REFERENCES wards(id) ON DELETE CASCADE,
  ward_score DECIMAL(10, 2) NOT NULL,
  generated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ward_reports_ward ON ward_reports(ward_id);
CREATE INDEX IF NOT EXISTS idx_ward_reports_generated ON ward_reports(generated_at DESC);

CREATE TABLE IF NOT EXISTS municipality_reports (
  id BIGSERIAL PRIMARY KEY,
  municipality_id BIGINT NOT NULL REFERENCES municipalities(id) ON DELETE CASCADE,
  municipality_score DECIMAL(10, 2) NOT NULL,
  generated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_municipality_reports_muni ON municipality_reports(municipality_id);
CREATE INDEX IF NOT EXISTS idx_municipality_reports_generated ON municipality_reports(generated_at DESC);

-- Legacy surveys preserved for historical health data
CREATE TABLE IF NOT EXISTS legacy_surveys (
  id UUID PRIMARY KEY,
  user_id UUID,
  pincode TEXT,
  municipality TEXT,
  ward_no TEXT,
  booth_no TEXT,
  date_of_survey DATE,
  total_people INTEGER,
  survey_data JSONB,
  symptoms TEXT[],
  water_quality TEXT,
  latitude NUMERIC(10, 8),
  longitude NUMERIC(11, 8),
  notes TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  migrated_at TIMESTAMPTZ DEFAULT NOW()
);

-- FK profiles -> municipalities (after municipalities exists)
ALTER TABLE profiles
  DROP CONSTRAINT IF EXISTS profiles_municipality_id_fkey;
ALTER TABLE profiles
  ADD CONSTRAINT profiles_municipality_id_fkey
  FOREIGN KEY (municipality_id) REFERENCES municipalities(id) ON DELETE SET NULL;

-- ============================================================================
-- TRIGGERS
-- ============================================================================
CREATE OR REPLACE FUNCTION update_profiles_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_profiles_updated_at ON profiles;
CREATE TRIGGER trigger_profiles_updated_at
BEFORE UPDATE ON profiles
FOR EACH ROW EXECUTE FUNCTION update_profiles_timestamp();

CREATE OR REPLACE FUNCTION create_profile_on_auth()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'role', 'asha_worker')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_create_profile_on_auth ON auth.users;
CREATE TRIGGER trigger_create_profile_on_auth
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION create_profile_on_auth();

CREATE OR REPLACE FUNCTION get_user_role(user_id UUID)
RETURNS TEXT AS $$
  SELECT role FROM profiles WHERE id = user_id LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE municipalities ENABLE ROW LEVEL SECURITY;
ALTER TABLE wards ENABLE ROW LEVEL SECURITY;
ALTER TABLE booths ENABLE ROW LEVEL SECURITY;
ALTER TABLE water_bodies ENABLE ROW LEVEL SECURITY;
ALTER TABLE sensors ENABLE ROW LEVEL SECURITY;
ALTER TABLE sensor_readings ENABLE ROW LEVEL SECURITY;
ALTER TABLE water_body_summary ENABLE ROW LEVEL SECURITY;
ALTER TABLE water_quality_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE booth_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE ward_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE municipality_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE legacy_surveys ENABLE ROW LEVEL SECURITY;

-- Profiles policies
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
DROP POLICY IF EXISTS "Government can read all profiles" ON profiles;
CREATE POLICY "Government can read all profiles" ON profiles FOR SELECT USING (get_user_role(auth.uid()) = 'government');
DROP POLICY IF EXISTS "Service role full profiles" ON profiles;
CREATE POLICY "Service role full profiles" ON profiles FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Hierarchy read policies (authenticated users)
DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'municipalities', 'wards', 'booths', 'water_bodies', 'sensors',
    'water_body_summary', 'water_quality_reports', 'booth_reports',
    'ward_reports', 'municipality_reports'
  ] LOOP
    EXECUTE format('DROP POLICY IF EXISTS "Authenticated read %s" ON %I', t, t);
    EXECUTE format(
      'CREATE POLICY "Authenticated read %s" ON %I FOR SELECT TO authenticated USING (true)',
      t, t
    );
    EXECUTE format('DROP POLICY IF EXISTS "Service role full %s" ON %I', t, t);
    EXECUTE format(
      'CREATE POLICY "Service role full %s" ON %I FOR ALL TO service_role USING (true) WITH CHECK (true)',
      t, t
    );
  END LOOP;
END $$;

-- ASHA workers can insert water quality reports
DROP POLICY IF EXISTS "ASHA insert water quality reports" ON water_quality_reports;
CREATE POLICY "ASHA insert water quality reports" ON water_quality_reports
  FOR INSERT TO authenticated
  WITH CHECK (get_user_role(auth.uid()) = 'asha_worker' AND submitted_by = auth.uid());

DROP POLICY IF EXISTS "ASHA read own reports" ON water_quality_reports;
CREATE POLICY "ASHA read own reports" ON water_quality_reports
  FOR SELECT TO authenticated
  USING (get_user_role(auth.uid()) = 'asha_worker' AND submitted_by = auth.uid());

-- Public users: municipality-scoped read
DROP POLICY IF EXISTS "Public read municipality data" ON municipalities;
CREATE POLICY "Public read municipality data" ON municipalities FOR SELECT TO authenticated
  USING (
    get_user_role(auth.uid()) IN ('government', 'public_user', 'asha_worker')
  );

-- Sensor readings: read for gov/asha; writes via service role only
DROP POLICY IF EXISTS "Authenticated read sensor_readings" ON sensor_readings;
CREATE POLICY "Authenticated read sensor_readings" ON sensor_readings
  FOR SELECT TO authenticated USING (get_user_role(auth.uid()) IN ('government', 'asha_worker', 'public_user'));
DROP POLICY IF EXISTS "Service role full sensor_readings" ON sensor_readings;
CREATE POLICY "Service role full sensor_readings" ON sensor_readings
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Legacy surveys
DROP POLICY IF EXISTS "Legacy surveys read" ON legacy_surveys;
CREATE POLICY "Legacy surveys read" ON legacy_surveys FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Service role legacy surveys" ON legacy_surveys;
CREATE POLICY "Service role legacy surveys" ON legacy_surveys FOR ALL TO service_role USING (true) WITH CHECK (true);
