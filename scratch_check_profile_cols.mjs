import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function run() {
  const { data: d1, error: e1 } = await supabase.from('profiles').select('municipality_id').limit(1);
  console.log('Query profiles(municipality_id) Error:', e1 ? e1.message : 'None');
  console.log('Query profiles(municipality_id) Data:', d1);

  const { data: d2, error: e2 } = await supabase.from('profiles').select('id, name, role').limit(1);
  console.log('Query profiles(id, name, role) Error:', e2 ? e2.message : 'None');
  console.log('Query profiles(id, name, role) Data:', d2);
}

run();
