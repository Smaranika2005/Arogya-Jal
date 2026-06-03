import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://fabibqkmddcyfgrgyaxa.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZhYmlicWttZGRjeWZncmd5YXhhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk1NDg3NTAsImV4cCI6MjA5NTEyNDc1MH0.1NnMFthy3pfotdbgw5cUi_oW0BMe-E7L-evITIQT8bs';

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log('Testing join: select(*, profiles(name))');
  const { data: d1, error: e1 } = await supabase
    .from('symptom_survey')
    .select('*, profiles(name)')
    .limit(1);
  console.log('Error 1:', e1 ? e1.message : 'None');
  console.log('Data 1:', d1);

  console.log('\nTesting join: select(*, profiles:user_id(name))');
  const { data: d2, error: e2 } = await supabase
    .from('symptom_survey')
    .select('*, profiles:user_id(name)')
    .limit(1);
  console.log('Error 2:', e2 ? e2.message : 'None');
  console.log('Data 2:', d2);
}

run();
