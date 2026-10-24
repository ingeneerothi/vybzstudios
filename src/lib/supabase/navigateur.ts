import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { SUPABASE_CLE, SUPABASE_URL } from "../env";

let client: SupabaseClient | undefined;

/** Client Supabase du navigateur (session admin gardée dans des cookies). */
export function supabaseNavigateur(): SupabaseClient {
  client ??= createBrowserClient(SUPABASE_URL, SUPABASE_CLE);
  return client;
}
