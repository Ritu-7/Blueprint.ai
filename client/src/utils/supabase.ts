'use client';

import { createClient } from '@supabase/supabase-js';
import { useSession } from '@clerk/nextjs';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() || 'placeholder-anon-key';

export function createClerkSupabaseClient(session: any) {
  return createClient(supabaseUrl, supabaseAnonKey, {
    async accessToken() {
      return (await session?.getToken()) ?? null;
    },
  });
}

export function useSupabaseClient() {
  const { session } = useSession();
  return createClerkSupabaseClient(session);
}

export function createBrowserSupabaseClient(clerkToken?: string | null) {
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

export const supabase = createBrowserSupabaseClient();
