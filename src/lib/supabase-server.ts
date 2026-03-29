import { createClient, SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

// Server-side client with service role — bypasses RLS
// Only use in API routes, never expose to the client
// Returns null if credentials are missing so routes can degrade gracefully
export const supabaseServer: SupabaseClient | null =
  supabaseUrl && supabaseServiceKey
    ? createClient(supabaseUrl, supabaseServiceKey)
    : (() => {
        console.warn(
          "[supabase-server] Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_KEY — server Supabase client is disabled",
        );
        return null;
      })();
