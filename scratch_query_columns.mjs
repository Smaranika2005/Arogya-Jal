import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { count: profilesCount, error: err1 } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true });
  console.log('profiles count:', profilesCount, 'Error:', err1);

  const { count: wbCount, error: err2 } = await supabase
    .from('water_bodies')
    .select('*', { count: 'exact', head: true });
  console.log('water_bodies count:', wbCount, 'Error:', err2);

  const { count: surveyCount, error: err3 } = await supabase
    .from('surveys')
    .select('*', { count: 'exact', head: true });
  console.log('surveys count:', surveyCount, 'Error:', err3);
}

run();
