import { createClient, type SupabaseClient } from '@supabase/supabase-js';

export const supabaseUrl = 'https://wuevhosbpxoainntibpu.supabase.co';
export const supabaseAnonKey = 'sb_publishable_K7yBgkKPCGmZGAS2ncyFjA_ferFkQ_T';

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

export function isSupabaseConfigured(): boolean {
  return Boolean(supabaseUrl && supabaseAnonKey);
}

export function getSupabaseProjectHost(): string {
  try {
    return new URL(supabaseUrl).host;
  } catch {
    return supabaseUrl;
  }
}

export function getSupabaseClient(): SupabaseClient {
  return supabase;
}
