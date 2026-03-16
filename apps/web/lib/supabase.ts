import "server-only";

import { createClient } from "@supabase/supabase-js";

import { assertConfigured, env } from "./env";

let adminClient: any = null;

export function getSupabaseAdmin(): any {
  if (!adminClient) {
    adminClient = createClient(assertConfigured("SUPABASE_URL", env.supabaseUrl), assertConfigured("SUPABASE_SERVICE_ROLE_KEY", env.supabaseServiceRoleKey), {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }

  return adminClient;
}
