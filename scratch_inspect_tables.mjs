import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://fabibqkmddcyfgrgyaxa.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZhYmlicWttZGRjeWZncmd5YXhhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk1NDg3NTAsImV4cCI6MjA5NTEyNDc1MH0.1NnMFthy3pfotdbgw5cUi_oW0BMe-E7L-evITIQT8bs';

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const t1 = await supabase.from('wards').select('*').limit(1);
  console.log('wards error:', t1.error ? t1.error.message : 'None');
  console.log('wards data:', t1.data);

  const t2 = await supabase.from('booths').select('*').limit(1);
  console.log('booths error:', t2.error ? t2.error.message : 'None');
  console.log('booths data:', t2.data);

  const t3 = await supabase.from('water_bodies').select('*').limit(1);
  console.log('water_bodies error:', t3.error ? t3.error.message : 'None');
  console.log('water_bodies data:', t3.data);
}

run();
