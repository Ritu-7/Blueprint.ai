import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Debugging Environment Load
if (supabaseUrl) {
  console.log('Supabase URL detected');
} else {
  console.log('Supabase URL MISSING');
}

if (supabaseAnonKey) {
  console.log('Supabase Anon Key detected');
} else {
  console.log('Supabase Anon Key MISSING');
}

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing environment variables for Supabase. ' +
    'Please ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set in your .env.local file.'
  );
}

export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);
