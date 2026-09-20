import { z } from 'zod';

const envSchema = z.object({
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().optional().default(''),
  CLERK_SECRET_KEY: z.string().optional().default(''),
  NEXT_PUBLIC_SUPABASE_URL: z.string().optional().default('https://placeholder.supabase.co'),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().optional().default('placeholder-anon-key'),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional().default(''),
  GOOGLE_GENERATIVE_AI_API_KEY: z.string().optional().default(''),
  GITHUB_TOKEN: z.string().optional().default(''),
  GITHUB_USERNAME: z.string().optional().default(''),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
});

function parseEnv() {
  const result = envSchema.safeParse({
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
    CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    GOOGLE_GENERATIVE_AI_API_KEY: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
    GITHUB_TOKEN: process.env.GITHUB_TOKEN,
    GITHUB_USERNAME: process.env.GITHUB_USERNAME,
    NODE_ENV: process.env.NODE_ENV,
  });

  if (!result.success) {
    console.warn('[config/env] Environment validation warning:', result.error.flatten().fieldErrors);
    return envSchema.parse({});
  }

  return result.data;
}

export const env = parseEnv();
