import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log('Testing insert into water_bodies...');
  const { data, error } = await supabase
    .from('water_bodies')
    .insert([
      { wid: 1, wname: 'Pond A', municipality_id: 1 },
      { wid: 2, wname: 'Lake B', municipality_id: 1 },
      { wid: 3, wname: 'Canal C', municipality_id: 1 },
      { wid: 4, wname: 'River Point D', municipality_id: 1 }
    ])
    .select();

  if (error) {
    console.error('Insert error:', error);
  } else {
    console.log('Insert success! Seeded water bodies:', data);
  }
}

run();
