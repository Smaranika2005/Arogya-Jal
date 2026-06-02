import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://fabibqkmddcyfgrgyaxa.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZhYmlicWttZGRjeWZncmd5YXhhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk1NDg3NTAsImV4cCI6MjA5NTEyNDc1MH0.1NnMFthy3pfotdbgw5cUi_oW0BMe-E7L-evITIQT8bs';

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .insert([{ id: '00000000-0000-0000-0000-000000000000', name: 'Test', role: 'public_user' }])
      .select();
    
    if (error) {
      console.error('Profiles insert error:', error);
    } else {
      console.log('Profiles insert success:', data);
    }
  } catch (err) {
    console.error('Catch error:', err);
  }
}

run();
