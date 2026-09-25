import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { auth } from '@clerk/nextjs/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() || 'placeholder-anon-key';

export async function createClient() {
  const cookieStore = await cookies();
  const { getToken } = await auth();
  const token = await getToken();

  return createServerClient(
    supabaseUrl,
    supabaseAnonKey,
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
            // Server Components cannot set cookies. Middleware and Route
            // Handlers can, and Supabase will still read existing cookies.
          }
        },
      },
    }
  );
}
