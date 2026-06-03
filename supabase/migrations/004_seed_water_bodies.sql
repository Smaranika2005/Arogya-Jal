-- Seed water bodies by dynamically resolving the municipality_id from the municipality name
-- Run this in your Supabase SQL Editor to populate the dropdown data!

INSERT INTO water_bodies (wid, wname, municipality_id) VALUES
(1, 'Rabindra Sarobar Lake', (SELECT municipality_id FROM municipalities WHERE municipality_name = 'Kolkata Municipal Corporation' LIMIT 1)),
(2, 'Subhash Sarobar Lake', (SELECT municipality_id FROM municipalities WHERE municipality_name = 'Kolkata Municipal Corporation' LIMIT 1)),
(3, 'East Kolkata Wetlands', (SELECT municipality_id FROM municipalities WHERE municipality_name = 'Kolkata Municipal Corporation' LIMIT 1)),
(4, 'Santragachi Jheel', (SELECT municipality_id FROM municipalities WHERE municipality_name = 'Howrah Municipal Corporation' LIMIT 1)),
(5, 'Mirik Lake', (SELECT municipality_id FROM municipalities WHERE municipality_name = 'Siliguri Municipal Corporation' LIMIT 1)),
(6, 'Senchal Lake', (SELECT municipality_id FROM municipalities WHERE municipality_name = 'Siliguri Municipal Corporation' LIMIT 1)),
(7, 'Amrita Bandh', (SELECT municipality_id FROM municipalities WHERE municipality_name = 'Asansol Municipal Corporation' LIMIT 1)),
(8, 'Kalyani Lake Park', (SELECT municipality_id FROM municipalities WHERE municipality_name = 'Kalyani Municipality' LIMIT 1)),
(9, 'Barasat Dighi', (SELECT municipality_id FROM municipalities WHERE municipality_name = 'Barasat Municipality' LIMIT 1)),
(10, 'Bally Khal Point', (SELECT municipality_id FROM municipalities WHERE municipality_name = 'Bally Municipality' LIMIT 1))
ON CONFLICT (wid) DO UPDATE SET
  wname = EXCLUDED.wname,
  municipality_id = EXCLUDED.municipality_id;
