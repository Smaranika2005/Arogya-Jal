import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function run() {
  const { data: d1, error: e1 } = await supabase.from('municipalities').select('id, name').limit(1);
  console.log('Query (id, name) Error:', e1 ? e1.message : 'None');
  console.log('Query (id, name) Data:', d1);

  const { data: d2, error: e2 } = await supabase.from('municipalities').select('municipality_id, municipality_name').limit(1);
  console.log('Query (municipality_id, municipality_name) Error:', e2 ? e2.message : 'None');
  console.log('Query (municipality_id, municipality_name) Data:', d2);
}

run();
