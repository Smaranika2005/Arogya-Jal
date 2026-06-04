import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function run() {
  // Querypg_proc for the trigger function source code
  const { data, error } = await supabase.rpc('inspect_trigger_func', {});
  console.log('RPC Error:', error ? error.message : 'None');
  console.log('Result:', data);

  // If RPC doesn't exist, we can try running a query or check if we can execute SQL
}

run();
