import { createClient } from '@supabase/supabase-js';

/**
 * Server-side Supabase client for Server Actions and Server Components.
 */
export const createServerSupabaseClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    '';

  return createClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: false,
    },
  });
};
