import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function inspect() {
    const { data, error } = await supabase.from('profiles').select().limit(0);
    if (error) {
        console.error('Error:', error);
    } else {
        console.log('Columns:', data);
    }
}

inspect();
