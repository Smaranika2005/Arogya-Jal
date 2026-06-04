import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function inspect() {
    const { data: cols, error } = await supabase.rpc('get_columns', { table_name: 'profiles' });
    if (error) {
        // If RPC fails, try information_schema query via REST (might be blocked by RLS)
        console.error('RPC Error:', error);
        const { data: cols2, error: err2 } = await supabase.from('information_schema.columns').select('column_name').eq('table_name', 'profiles');
        if (err2) {
            console.error('Info Schema Error:', err2);
        } else {
            console.log('Cols:', cols2);
        }
    } else {
        console.log('Cols from RPC:', cols);
    }
}

inspect();
