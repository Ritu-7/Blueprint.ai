import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { auth } from '@clerk/nextjs/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() || 'placeholder-anon-key';

export async function createClient() {
  const { getToken } = await auth();

  return createSupabaseClient(supabaseUrl, supabaseAnonKey, {
    async accessToken() {
      return (await getToken()) ?? null;
    },
  });
}
