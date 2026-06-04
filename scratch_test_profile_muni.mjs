import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function run() {
  const { data, error } = await supabase
    .from('profiles')
    .select('*, municipalities(municipality_name)')
    .limit(1);
  console.log('Error:', error ? error.message : 'None');
  console.log('Sample Row:', data);
}

run();
