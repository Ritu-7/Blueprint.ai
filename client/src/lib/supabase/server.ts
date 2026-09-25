import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { auth } from '@clerk/nextjs/server';
import { env } from '@/config/env';

/**
 * Creates a server-side Supabase client equipped with Clerk session token integration
 * for native Supabase Third-Party Auth verification and RLS policy enforcement.
 */
export async function createSupabaseServerClient() {
  const cookieStore = await cookies();
  const { getToken } = await auth();
  const token = await getToken();

  return createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      global: {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      },
      accessToken: async () => {
        const { getToken: getClerkToken } = await auth();
        return (await getClerkToken()) ?? null;
      },
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // Server Component cookie mutation catch
          }
        },
      },
    }
  );
}
