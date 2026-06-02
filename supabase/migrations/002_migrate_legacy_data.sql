-- Arogya Jal - Safe migration from legacy surveys/profiles schema
-- Run AFTER 001_arogya_jal_schema.sql on an existing database

-- ============================================================================
-- 1. Preserve legacy survey data
-- ============================================================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'surveys' AND table_schema = 'public') THEN
    INSERT INTO legacy_surveys (
      id, user_id, pincode, municipality, ward_no, booth_no,
      date_of_survey, total_people, survey_data, symptoms,
      water_quality, latitude, longitude, notes, created_at, updated_at
    )
    SELECT
      id, user_id, pincode, municipality, ward_no, booth_no,
      date_of_survey, total_people, survey_data, symptoms,
      water_quality, latitude, longitude, notes, created_at, updated_at
    FROM surveys
    ON CONFLICT (id) DO NOTHING;
  END IF;
END $$;

-- ============================================================================
-- 2. Migrate profile municipality text -> municipality_id
-- ============================================================================
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'municipality'
  ) THEN
    INSERT INTO municipalities (name)
    SELECT DISTINCT TRIM(municipality)
    FROM profiles
    WHERE municipality IS NOT NULL AND TRIM(municipality) <> ''
    ON CONFLICT (name) DO NOTHING;

    INSERT INTO municipalities (name)
    SELECT DISTINCT TRIM(municipality)
    FROM legacy_surveys
    WHERE municipality IS NOT NULL AND TRIM(municipality) <> ''
    ON CONFLICT (name) DO NOTHING;

    UPDATE profiles p
    SET municipality_id = m.id
    FROM municipalities m
    WHERE TRIM(p.municipality) = m.name
      AND p.municipality_id IS NULL;
  END IF;
END $$;

-- ============================================================================
-- 3. Build hierarchy from legacy survey locations
-- ============================================================================
INSERT INTO municipalities (name)
SELECT DISTINCT TRIM(municipality)
FROM legacy_surveys
WHERE municipality IS NOT NULL AND TRIM(municipality) <> ''
ON CONFLICT (name) DO NOTHING;

INSERT INTO wards (municipality_id, ward_number, ward_name)
SELECT DISTINCT
  m.id,
  TRIM(ls.ward_no),
  'Ward ' || TRIM(ls.ward_no)
FROM legacy_surveys ls
JOIN municipalities m ON TRIM(ls.municipality) = m.name
WHERE ls.ward_no IS NOT NULL AND TRIM(ls.ward_no) <> ''
ON CONFLICT (municipality_id, ward_number) DO NOTHING;

INSERT INTO booths (ward_id, booth_number, booth_name)
SELECT DISTINCT
  w.id,
  TRIM(ls.booth_no),
  'Booth ' || TRIM(ls.booth_no)
FROM legacy_surveys ls
JOIN municipalities m ON TRIM(ls.municipality) = m.name
JOIN wards w ON w.municipality_id = m.id AND w.ward_number = TRIM(ls.ward_no)
WHERE ls.booth_no IS NOT NULL AND TRIM(ls.booth_no) <> ''
ON CONFLICT (ward_id, booth_number) DO NOTHING;

-- ============================================================================
-- 4. Create water bodies from survey_data.numberOfWaterBodies / defaults
-- ============================================================================
INSERT INTO water_bodies (booth_id, name, latitude, longitude)
SELECT DISTINCT ON (b.id, wb_idx.n)
  b.id,
  'Water Body ' || wb_idx.n,
  ls.latitude,
  ls.longitude
FROM legacy_surveys ls
JOIN municipalities m ON TRIM(ls.municipality) = m.name
JOIN wards w ON w.municipality_id = m.id AND w.ward_number = TRIM(ls.ward_no)
JOIN booths b ON b.ward_id = w.id AND b.booth_number = TRIM(ls.booth_no)
CROSS JOIN LATERAL generate_series(
  1,
  GREATEST(
    COALESCE((ls.survey_data->>'numberOfWaterBodies')::INT, 1),
    1
  )
) AS wb_idx(n)
WHERE NOT EXISTS (
  SELECT 1 FROM water_bodies wb WHERE wb.booth_id = b.id
);

-- ============================================================================
-- 5. Migrate manual water metrics into water_quality_reports
-- ============================================================================
INSERT INTO water_quality_reports (
  booth_id, water_body_id, avg_ph_used, tds, turbidity,
  ph_score, tds_score, turbidity_score, wqi, water_body_priority, submitted_by, created_at
)
SELECT
  b.id,
  wb.id,
  COALESCE((ls.survey_data->>'avgPH')::DECIMAL, 7.0),
  COALESCE((ls.survey_data->>'avgTDS')::DECIMAL, 0),
  COALESCE((ls.survey_data->>'avgTurbidity')::DECIMAL, 0),
  CASE
    WHEN COALESCE((ls.survey_data->>'avgPH')::DECIMAL, 7) BETWEEN 6.5 AND 8.5 THEN 100
    WHEN COALESCE((ls.survey_data->>'avgPH')::DECIMAL, 7) BETWEEN 6.0 AND 6.5
      OR COALESCE((ls.survey_data->>'avgPH')::DECIMAL, 7) BETWEEN 8.5 AND 9.0 THEN 80
    WHEN COALESCE((ls.survey_data->>'avgPH')::DECIMAL, 7) BETWEEN 5.5 AND 6.0
      OR COALESCE((ls.survey_data->>'avgPH')::DECIMAL, 7) BETWEEN 9.0 AND 9.5 THEN 60
    ELSE 40
  END,
  100,
  100,
  (
    CASE
      WHEN COALESCE((ls.survey_data->>'avgPH')::DECIMAL, 7) BETWEEN 6.5 AND 8.5 THEN 100
      WHEN COALESCE((ls.survey_data->>'avgPH')::DECIMAL, 7) BETWEEN 6.0 AND 6.5
        OR COALESCE((ls.survey_data->>'avgPH')::DECIMAL, 7) BETWEEN 8.5 AND 9.0 THEN 80
      WHEN COALESCE((ls.survey_data->>'avgPH')::DECIMAL, 7) BETWEEN 5.5 AND 6.0
        OR COALESCE((ls.survey_data->>'avgPH')::DECIMAL, 7) BETWEEN 9.0 AND 9.5 THEN 60
      ELSE 40
    END * 0.4 + 100 * 0.3 + 100 * 0.3
  ),
  1,
  ls.user_id,
  COALESCE(ls.created_at, NOW())
FROM legacy_surveys ls
JOIN municipalities m ON TRIM(ls.municipality) = m.name
JOIN wards w ON w.municipality_id = m.id AND w.ward_number = TRIM(ls.ward_no)
JOIN booths b ON b.ward_id = w.id AND b.booth_number = TRIM(ls.booth_no)
JOIN LATERAL (
  SELECT id FROM water_bodies WHERE booth_id = b.id ORDER BY id LIMIT 1
) wb ON true
WHERE (ls.survey_data->>'avgPH') IS NOT NULL
   OR (ls.survey_data->>'avgTurbidity') IS NOT NULL
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 6. Seed demo IoT sensor (optional - comment out in production)
-- ============================================================================
INSERT INTO sensors (sensor_code, sensor_type, water_body_id, status, installed_at)
SELECT 'PH001', 'PH', wb.id, 'active', NOW()
FROM water_bodies wb
ORDER BY wb.id
LIMIT 1
ON CONFLICT (sensor_code) DO NOTHING;

-- Initialize empty summaries for all water bodies
INSERT INTO water_body_summary (water_body_id, total_readings, last_updated)
SELECT id, 0, NOW() FROM water_bodies
ON CONFLICT (water_body_id) DO NOTHING;

COMMENT ON TABLE legacy_surveys IS 'Archived health surveys from pre-Arogya-Jal schema';
