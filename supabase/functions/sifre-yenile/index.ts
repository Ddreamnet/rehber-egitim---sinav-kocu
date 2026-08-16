/**
 * sifre-yenile — admin, bir hesaba yeni şifre atar ve bir kez görür.
 *
 * Supabase şifreleri hash'li sakladığı için mevcut şifre hiçbir şekilde geri
 * okunamaz. Admin "kullanıcının şifresini tekrar iletmem gerekiyor" durumunda
 * buradan yeni bir şifre üretir; üretilen şifre yalnız bu yanıtta döner.
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const yanit = (govde: unknown, durum = 200) =>
  new Response(JSON.stringify(govde), {
    status: durum,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  });

/** Okunması kolay, karıştırılabilir karakterler olmadan şifre. */
function sifreUret(): string {
  const harf = 'abcdefghijkmnpqrstuvwxyz';
  const buyuk = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const rakam = '23456789';
  const havuz = harf + buyuk + rakam;
  const rastgele = (k: string) => k[Math.floor(Math.random() * k.length)];
  const govde = Array.from({ length: 7 }, () => rastgele(havuz)).join('');
  return rastgele(buyuk) + govde + rastgele(rakam);
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (req.method !== 'POST') return yanit({ hata: 'Yalnızca POST' }, 405);

  const url = Deno.env.get('SUPABASE_URL')!;
  const servis = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const anon = Deno.env.get('SUPABASE_ANON_KEY')!;

  const yetki = req.headers.get('Authorization') ?? '';
  if (!yetki.startsWith('Bearer ')) return yanit({ hata: 'Oturum bulunamadı.' }, 401);

  const cagiranIstemci = createClient(url, anon, { global: { headers: { Authorization: yetki } } });
  const { data: kullanici, error: kullaniciHata } = await cagiranIstemci.auth.getUser();
  if (kullaniciHata || !kullanici.user) return yanit({ hata: 'Oturum geçersiz.' }, 401);

  const yonetim = createClient(url, servis, { auth: { persistSession: false } });
  const { data: roller } = await yonetim.from('user_roles').select('rol').eq('user_id', kullanici.user.id);
  if (!roller?.some((r: { rol: string }) => r.rol === 'admin')) {
    return yanit({ hata: 'Bu işlem için admin yetkisi gerekiyor.' }, 403);
  }

  let g: { kisiId?: string };
  try {
    g = await req.json();
  } catch {
    return yanit({ hata: 'Geçersiz istek gövdesi.' }, 400);
  }
  const kisiId = (g.kisiId ?? '').trim();
  if (!kisiId) return yanit({ hata: 'Hesap belirtilmedi.' }, 400);

  const { data: kisi } = await yonetim.from('profiles').select('ad_soyad, eposta').eq('id', kisiId).maybeSingle();
  if (!kisi) return yanit({ hata: 'Hesap bulunamadı.' }, 404);

  const sifre = sifreUret();
  const { error } = await yonetim.auth.admin.updateUserById(kisiId, { password: sifre });
  if (error) return yanit({ hata: error.message || 'Şifre değiştirilemedi.' }, 400);

  await yonetim.from('activities').insert({
    tur: 'uyari',
    metin: `**${kisi.ad_soyad}** hesabı için yeni şifre üretildi.`,
    aktor_id: kullanici.user.id,
  });

  return yanit({ eposta: kisi.eposta, sifre });
});
