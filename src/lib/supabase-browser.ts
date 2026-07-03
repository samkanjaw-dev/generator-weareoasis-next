"use client";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { isArtworkBrowserAuthConfigured } from "@/lib/artwork-access";

let cachedBrowserClient: SupabaseClient | null = null;

export function getSupabaseBrowserClient() {
  if (cachedBrowserClient) {
    return cachedBrowserClient;
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!isArtworkBrowserAuthConfigured() || !url || !anonKey) {
    throw new Error("Missing Supabase browser configuration.");
  }

  cachedBrowserClient = createClient(url, anonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true
    }
  });

  return cachedBrowserClient;
}
