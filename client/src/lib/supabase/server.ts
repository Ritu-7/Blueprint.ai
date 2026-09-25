import { createClient } from '@supabase/supabase-js';
import { auth } from '@clerk/nextjs/server';
import { env } from '@/config/env';

/**
 * Creates a server-side Supabase client equipped with Clerk session token integration
 * using `auth()` from `@clerk/nextjs/server` via the `accessToken` option for native RLS verification.
 * Created fresh per-request.
 */
export async function createServerSupabaseClient() {
  const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
  const supabaseAnonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key';

  const { getToken } = await auth();

  return createClient(supabaseUrl, supabaseAnonKey, {
    async accessToken() {
      return (await getToken()) ?? null;
    },
  });
}
