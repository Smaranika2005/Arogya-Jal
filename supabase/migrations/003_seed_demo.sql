-- Demo seed data for hackathon MVP
-- Run after 001_arogya_jal_schema.sql

INSERT INTO municipalities (name) VALUES ('Demo Municipality')
ON CONFLICT (name) DO NOTHING;

INSERT INTO wards (municipality_id, ward_number, ward_name)
SELECT id, '1', 'Ward 1' FROM municipalities WHERE name = 'Demo Municipality'
ON CONFLICT (municipality_id, ward_number) DO NOTHING;

INSERT INTO wards (municipality_id, ward_number, ward_name)
SELECT id, '2', 'Ward 2' FROM municipalities WHERE name = 'Demo Municipality'
ON CONFLICT (municipality_id, ward_number) DO NOTHING;

INSERT INTO booths (ward_id, booth_number, booth_name)
SELECT w.id, '101', 'Booth 101'
FROM wards w JOIN municipalities m ON w.municipality_id = m.id
WHERE m.name = 'Demo Municipality' AND w.ward_number = '1'
ON CONFLICT (ward_id, booth_number) DO NOTHING;

INSERT INTO booths (ward_id, booth_number, booth_name)
SELECT w.id, '102', 'Booth 102'
FROM wards w JOIN municipalities m ON w.municipality_id = m.id
WHERE m.name = 'Demo Municipality' AND w.ward_number = '1'
ON CONFLICT (ward_id, booth_number) DO NOTHING;

INSERT INTO booths (ward_id, booth_number, booth_name)
SELECT w.id, '201', 'Booth 201'
FROM wards w JOIN municipalities m ON w.municipality_id = m.id
WHERE m.name = 'Demo Municipality' AND w.ward_number = '2'
ON CONFLICT (ward_id, booth_number) DO NOTHING;

INSERT INTO water_bodies (booth_id, name, description, latitude, longitude)
SELECT b.id, 'Community Pond', 'Main community water source', 28.6139, 77.2090
FROM booths b JOIN wards w ON b.ward_id = w.id
WHERE b.booth_number = '101'
AND NOT EXISTS (SELECT 1 FROM water_bodies wb WHERE wb.booth_id = b.id AND wb.name = 'Community Pond');

INSERT INTO water_bodies (booth_id, name, description, latitude, longitude)
SELECT b.id, 'Hand Pump Well', 'Primary drinking water', 28.6145, 77.2095
FROM booths b JOIN wards w ON b.ward_id = w.id
WHERE b.booth_number = '101'
AND NOT EXISTS (SELECT 1 FROM water_bodies wb WHERE wb.booth_id = b.id AND wb.name = 'Hand Pump Well');

INSERT INTO water_bodies (booth_id, name, description, latitude, longitude)
SELECT b.id, 'Storage Tank', 'Overhead tank supply', 28.6150, 77.2100
FROM booths b JOIN wards w ON b.ward_id = w.id
WHERE b.booth_number = '102'
AND NOT EXISTS (SELECT 1 FROM water_bodies wb WHERE wb.booth_id = b.id AND wb.name = 'Storage Tank');

INSERT INTO sensors (sensor_code, sensor_type, water_body_id, status, installed_at)
SELECT 'PH001', 'PH', wb.id, 'active', NOW()
FROM water_bodies wb WHERE wb.name = 'Community Pond'
ON CONFLICT (sensor_code) DO NOTHING;

INSERT INTO water_body_summary (water_body_id, current_ph, avg_ph_7_days, avg_ph_30_days, total_readings, last_updated)
SELECT wb.id, 7.2, 7.3, 7.2, 0, NOW()
FROM water_bodies wb WHERE wb.name = 'Community Pond'
ON CONFLICT (water_body_id) DO UPDATE SET
  current_ph = 7.2, avg_ph_7_days = 7.3, avg_ph_30_days = 7.2, last_updated = NOW();

INSERT INTO water_body_summary (water_body_id, total_readings, last_updated)
SELECT id, 0, NOW() FROM water_bodies
ON CONFLICT (water_body_id) DO NOTHING;
