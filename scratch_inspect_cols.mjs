import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function inspect() {
    const { data: profiles, error: pError } = await supabase.from('profiles').select('*').limit(1);
    console.log('Profiles columns:', profiles ? Object.keys(profiles[0] || {}) : 'No data');
    if (pError) console.error('Profiles error:', pError);

    const { data: municipalities, error: mError } = await supabase.from('municipalities').select('*').limit(1);
    console.log('Municipalities columns:', municipalities ? Object.keys(municipalities[0] || {}) : 'No data');
    if (mError) console.error('Municipalities error:', mError);
}

inspect();
