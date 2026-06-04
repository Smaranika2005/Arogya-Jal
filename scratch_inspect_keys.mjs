import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function inspect() {
    const { data: muni, error: mError } = await supabase.from('municipalities').select('*').limit(1);
    if (mError) {
        console.error('Error:', mError);
    } else {
        console.log('Muni keys:', Object.keys(muni[0] || {}));
    }

    const { data: profiles, error: pError } = await supabase.from('profiles').select('*').limit(1);
    if (pError) {
        console.error('Error:', pError);
    } else {
        console.log('Profiles keys:', Object.keys(profiles[0] || {}));
    }
}

inspect();
