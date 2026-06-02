import { createClient } from '@supabase/supabase-js';
import { config } from '../config/env.mjs';

let adminClient = null;

export function supabaseAdmin() {
  if (!adminClient) {
    if (!config.supabaseUrl || !config.supabaseServiceKey) {
      throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    }
    adminClient = createClient(config.supabaseUrl, config.supabaseServiceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return adminClient;
}

export async function verifyUserToken(authHeader) {
  if (!authHeader?.startsWith('Bearer ')) return null;
  const token = authHeader.slice(7);
  const { data, error } = await supabaseAdmin().auth.getUser(token);
  if (error || !data.user) return null;
  return data.user;
}

export async function getUserProfile(userId) {
  const { data, error } = await supabaseAdmin()
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  if (error) return null;
  return data;
}
