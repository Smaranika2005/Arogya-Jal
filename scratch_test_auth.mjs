import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const email = `test_asha_${Math.floor(Math.random() * 100000)}@gmail.com`;
  const password = 'Password123!';

  console.log(`Signing up as ${email}...`);
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
  });

  if (signUpError) {
    console.error("Sign up error:", signUpError);
    return;
  }

  const session = signUpData.session;
  const user = signUpData.user;
  console.log("Sign up success, user ID:", user?.id);

  // Sign in to get session
  console.log("Signing in...");
  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (signInError) {
    console.error("Sign in error:", signInError);
    return;
  }

  console.log("Inserting profile manually...");
  const { data: profile, error: profileErr } = await supabase
    .from('profiles')
    .insert([
      {
        id: user?.id,
        name: 'Test ASHA Worker',
        role: 'asha_worker'
      }
    ])
    .select();

  console.log("Profile insert result:", profile, "Error:", profileErr);

  console.log("Querying municipalities as ASHA worker...");
  const { data: municipalities, error: muniError } = await supabase
    .from('municipalities')
    .select('*');
  console.log("Municipalities retrieved:", municipalities, "Error:", muniError);
}

run();
