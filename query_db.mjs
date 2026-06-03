import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://fabibqkmddcyfgrgyaxa.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZhYmlicWttZGRjeWZncmd5YXhhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk1NDg3NTAsImV4cCI6MjA5NTEyNDc1MH0.1NnMFthy3pfotdbgw5cUi_oW0BMe-E7L-evITIQT8bs';

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  try {
    const { data: waterBodies, error: wbError } = await supabase
      .from('water_bodies')
      .select('*');
    if (wbError) {
      console.error('Water bodies error:', wbError);
    } else {
      console.log('Water bodies count in DB:', waterBodies.length);
      console.log('Water bodies:', waterBodies);
    }
  } catch (err) {
    console.error('Catch error:', err);
  }
}

run();
