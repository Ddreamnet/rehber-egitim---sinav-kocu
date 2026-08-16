/**
 * koc-ekle — admin, koç hesabı açar.
 *
 * Eskiden koç eklemek için "önce /giris üzerinden kayıt olsun, sonra e-postasını
 * gir" akışı vardı; ama sitede kayıt formu yok, dolayısıyla o hesap hiç
 * oluşamıyordu ve koç eklemek imkânsızdı. Öğrenci akışında olduğu gibi hesabı
 * admin açar, kullanıcı adı/şifre koça iletilir.
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

interface Istek {
  adSoyad: string;
  eposta: string;
  sifre: string;
  telefon?: string;
  avatarRengi?: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (req.method !== 'POST') return yanit({ hata: 'Yalnızca POST' }, 405);

  const url = Deno.env.get('SUPABASE_URL')!;
  const servis = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const anon = Deno.env.get('SUPABASE_ANON_KEY')!;

  // 1) Çağıranı kimliklendir
  const yetki = req.headers.get('Authorization') ?? '';
  if (!yetki.startsWith('Bearer ')) return yanit({ hata: 'Oturum bulunamadı.' }, 401);

  const cagiranIstemci = createClient(url, anon, { global: { headers: { Authorization: yetki } } });
  const { data: kullanici, error: kullaniciHata } = await cagiranIstemci.auth.getUser();
  if (kullaniciHata || !kullanici.user) return yanit({ hata: 'Oturum geçersiz.' }, 401);

  // 2) Admin mi? (yetki user_roles'tan okunur)
  const yonetim = createClient(url, servis, { auth: { persistSession: false } });
  const { data: roller } = await yonetim.from('user_roles').select('rol').eq('user_id', kullanici.user.id);

  if (!roller?.some((r: { rol: string }) => r.rol === 'admin')) {
    return yanit({ hata: 'Bu işlem için admin yetkisi gerekiyor.' }, 403);
  }

  // 3) Girdi doğrulama
  let g: Istek;
  try {
    g = await req.json();
  } catch {
    return yanit({ hata: 'Geçersiz istek gövdesi.' }, 400);
  }

  const eposta = (g.eposta ?? '').trim().toLowerCase();
  if (!g.adSoyad?.trim()) return yanit({ hata: 'Ad soyad zorunlu.' }, 400);
  if (!/^\S+@\S+\.\S+$/.test(eposta)) return yanit({ hata: 'Geçerli bir e-posta gir.' }, 400);
  if (!g.sifre || g.sifre.length < 8) return yanit({ hata: 'Şifre en az 8 karakter olmalı.' }, 400);

  // 4) Hesap — e-posta doğrulaması istemiyoruz, şifreyi admin veriyor
  const { data: yeni, error: olusturmaHata } = await yonetim.auth.admin.createUser({
    email: eposta,
    password: g.sifre,
    email_confirm: true,
    user_metadata: { ad_soyad: g.adSoyad.trim() },
  });

  if (olusturmaHata || !yeni.user) {
    const m = olusturmaHata?.message ?? '';
    if (/already been registered|already exists/i.test(m)) {
      return yanit({ hata: 'Bu e-posta zaten kayıtlı.' }, 409);
    }
    return yanit({ hata: m || 'Kullanıcı oluşturulamadı.' }, 400);
  }

  const kocId = yeni.user.id;

  // 5) Profil alanlarını tamamla (trigger satırı zaten açtı)
  await yonetim
    .from('profiles')
    .update({
      ad_soyad: g.adSoyad.trim(),
      eposta,
      telefon: g.telefon?.trim() || null,
      avatar_rengi: g.avatarRengi || null,
    })
    .eq('id', kocId);

  await yonetim.from('user_roles').upsert({ user_id: kocId, rol: 'koc' }, { onConflict: 'user_id,rol' });
  // `yeni_kullanici` tetikleyicisi her hesaba 'ogrenci' rolü veriyor; kalırsa
  // koç, admin panelindeki öğrenci listesinde ve sayaçlarda görünüyor.
  await yonetim.from('user_roles').delete().eq('user_id', kocId).eq('rol', 'ogrenci');

  // 6) Aktivite akışına düş
  await yonetim.from('activities').insert({
    tur: 'kayit',
    metin: `**${g.adSoyad.trim()}** koç olarak eklendi.`,
    aktor_id: kullanici.user.id,
  });

  return yanit({ kocId, eposta });
});
