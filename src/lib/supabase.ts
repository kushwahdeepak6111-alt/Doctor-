import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL || '').trim().replace(/\/+$/, '');
const supabasePublishableKey = (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || '').trim();

export function isSupabaseConfigured(): boolean {
  return Boolean(supabaseUrl && supabasePublishableKey);
}

export function getSupabaseProjectHost(): string {
  if (!supabaseUrl) return '';
  try {
    return new URL(supabaseUrl).host;
  } catch {
    return supabaseUrl;
  }
}

let cachedClient: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  if (!isSupabaseConfigured()) return null;
  if (!cachedClient) {
    cachedClient = createClient(supabaseUrl, supabasePublishableKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }
  return cachedClient;
}
