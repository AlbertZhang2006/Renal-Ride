import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;

export const isDemoMode = !supabaseUrl || !supabaseKey;

let supabase: SupabaseClient | null = null;

if (isDemoMode) {
  console.log(
    '[Renal Ride] No Supabase credentials found — running in demo mode with mock data.',
  );
} else {
  supabase = createClient(supabaseUrl!, supabaseKey!);
}

export { supabase };
