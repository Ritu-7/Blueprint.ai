import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

function assertSupabaseEnv() {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      `Missing Supabase environment variables.\n` +
      `Found URL: ${!!supabaseUrl}, Found Key: ${!!supabaseAnonKey}\n` +
      `Please check your .env.local file.`
    );
  }

  return { supabaseUrl, supabaseAnonKey };
}

export function createBrowserSupabaseClient() {
  const env = assertSupabaseEnv();
  return createBrowserClient(env.supabaseUrl, env.supabaseAnonKey);
}

export const supabase = createBrowserSupabaseClient();
