import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://fabibqkmddcyfgrgyaxa.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZhYmlicWttZGRjeWZncmd5YXhhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk1NDg3NTAsImV4cCI6MjA5NTEyNDc1MH0.1NnMFthy3pfotdbgw5cUi_oW0BMe-E7L-evITIQT8bs';

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log('Testing select(id, name) on water_bodies:');
  const r1 = await supabase.from('water_bodies').select('id, name').limit(1);
  console.log('Error 1:', r1.error ? r1.error.message : 'None');

  console.log('\nTesting select(wid, wname) on water_bodies:');
  const r2 = await supabase.from('water_bodies').select('wid, wname').limit(1);
  console.log('Error 2:', r2.error ? r2.error.message : 'None');
}

run();
