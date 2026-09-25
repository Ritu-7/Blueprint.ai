'use client';

import { createClient } from '@supabase/supabase-js';
import { useSession } from '@clerk/nextjs';
import { env } from '@/config/env';

/**
 * Creates a client-side Supabase client equipped with Clerk session token integration
 * using the `accessToken` option for native Supabase Third-Party Auth & RLS.
 */
export function createClerkSupabaseClient(session: any) {
  const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
  const supabaseAnonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key';

  return createClient(supabaseUrl, supabaseAnonKey, {
    async accessToken() {
      return (await session?.getToken()) ?? null;
    },
  });
}

/**
 * React hook to get a fresh authenticated Supabase client using the active Clerk session.
 */
export function useSupabaseClient() {
  const { session } = useSession();
  return createClerkSupabaseClient(session);
}

/**
 * Fallback browser client initializer.
 */
export function createSupabaseClient(clerkToken?: string | null) {
  const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
  const supabaseAnonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key';

  return createClient(supabaseUrl, supabaseAnonKey, {
    async accessToken() {
      if (clerkToken) return clerkToken;
      if (typeof window !== 'undefined' && (window as any).Clerk) {
        const token = await (window as any).Clerk.session?.getToken();
        if (token) return token;
      }
      return null;
    },
  });
}

export const supabaseClient = createSupabaseClient();
