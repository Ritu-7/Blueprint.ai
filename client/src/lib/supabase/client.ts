import { createBrowserClient } from '@supabase/ssr';
import { env } from '@/config/env';

/**
 * Creates a browser-side Supabase client equipped with Clerk session token integration
 * for native Supabase Third-Party Auth verification and RLS policy enforcement.
 */
export function createSupabaseClient(clerkToken?: string | null) {
  return createBrowserClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      global: {
        headers: clerkToken ? { Authorization: `Bearer ${clerkToken}` } : {},
      },
      accessToken: async () => {
        if (clerkToken) return clerkToken;
        if (typeof window !== 'undefined' && (window as any).Clerk) {
          const token = await (window as any).Clerk.session?.getToken();
          if (token) return token;
        }
        return null;
      },
    }
  );
}

export const supabaseClient = createSupabaseClient();
