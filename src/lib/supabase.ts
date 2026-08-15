import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

/** Supabase yapılandırılmadıysa uygulama demo veriyle çalışır. */
export const supabaseVar = Boolean(url && anon);

export const supabase: SupabaseClient | null = supabaseVar
  ? createClient(url!, anon!, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
    })
  : null;

/**
 * Sorgu hatalarını tek yerden yüzeye çıkarır.
 * `maybeSingle()` gibi boş dönebilen sorgularda çağıran tarafın null kontrolü yapması gerekir.
 */
export function kontrol<T>(sonuc: { data: T; error: { message: string } | null }): NonNullable<T> {
  if (sonuc.error) throw new Error(sonuc.error.message);
  return sonuc.data as NonNullable<T>;
}
