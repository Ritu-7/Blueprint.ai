import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() || 'placeholder-anon-key';

export function createBrowserSupabaseClient(clerkToken?: string | null) {
  return createBrowserClient(supabaseUrl, supabaseAnonKey, {
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
  });
}

export const supabase = createBrowserSupabaseClient();
