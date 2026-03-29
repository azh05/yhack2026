import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!;

// Server-side client with service role — bypasses RLS
// Only use in API routes, never expose to the client
export const supabaseServer = createClient(supabaseUrl, supabaseServiceKey);
