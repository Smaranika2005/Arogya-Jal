import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function inspect() {
  console.log("URL:", process.env.VITE_SUPABASE_URL);

  // 1. Inspect sensors table
  const { data: sensors, error: sError } = await supabase.from('sensors').select('*').limit(5);
  console.log('Sensors error:', sError ? sError.message : 'None');
  console.log('Sensors data:', sensors);

  // 2. Inspect ph_readings or ph_reading or sensor_readings
  const { data: phReadings, error: phError } = await supabase.from('ph_readings').select('*').limit(5);
  console.log('ph_readings error:', phError ? phError.message : 'None');
  console.log('ph_readings data:', phReadings);

  // If ph_readings failed, check sensor_readings or other reading tables
  const { data: sensorReadings, error: srError } = await supabase.from('sensor_readings').select('*').limit(5);
  console.log('sensor_readings error:', srError ? srError.message : 'None');
  console.log('sensor_readings data:', sensorReadings);

  // 3. Inspect water_bodies table
  const { data: wb, error: wbError } = await supabase.from('water_bodies').select('*').limit(5);
  console.log('water_bodies error:', wbError ? wbError.message : 'None');
  console.log('water_bodies data:', wb);
}

inspect();
