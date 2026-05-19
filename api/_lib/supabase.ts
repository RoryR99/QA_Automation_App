import { createClient } from '@supabase/supabase-js';

type SupabaseEnv = {
  url: string;
  key: string;
};

function readSupabaseEnv(): SupabaseEnv {
  const url = process.env.SUPABASE_URL?.trim() || process.env.VITE_SUPABASE_URL?.trim() || '';
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() || '';

  if (!url || !key) {
    throw new Error('Missing Supabase server environment variables. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.');
  }

  return { url, key };
}

export function getSupabaseServerClient() {
  const { url, key } = readSupabaseEnv();

  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
