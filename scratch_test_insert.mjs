import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function test() {
    console.log('Testing Profile insertion...');
    const dummyId = '00000000-0000-0000-0000-000000000000';
    const { error } = await supabase.from('profiles').upsert({
        id: dummyId,
        name: 'Test',
        role: 'public_user',
        municipality_id: 1 // Test if this col exists
    }, { onConflict: 'id' });

    if (error) {
        console.error('Insert Error:', error);
    } else {
        console.log('Insert Success!');
        const { data } = await supabase.from('profiles').select('*').eq('id', dummyId).single();
        console.log('Inserted Data keys:', data ? Object.keys(data) : 'None');
    }
}

test();
