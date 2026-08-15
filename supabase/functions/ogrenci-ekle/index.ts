/**
 * ogrenci-ekle — admin, ödemesini yapmış öğrenciyi sisteme kaydeder.
 *
 * Sitede kayıt formu yoktur; hesabı admin açar ve kullanıcı adı/şifreyi
 * öğrenciye iletir. Kullanıcı oluşturmak service_role gerektirdiği için bu
 * iş istemcide yapılamaz — bu fonksiyon çağıranın gerçekten admin olduğunu
 * doğruladıktan sonra Auth Admin API'sini kullanır.
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
  sinif?: string;
  hedefAlan?: string;
  avatarRengi?: string;
  kocId?: string;
  /** Veli hesabı da açılsın mı? */
  veli?: { adSoyad: string; eposta: string; sifre: string; detaySeviyesi?: 'ozet' | 'tam' };
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

  const cagiranIstemci = createClient(url, anon, {
    global: { headers: { Authorization: yetki } },
  });
  const { data: kullanici, error: kullaniciHata } = await cagiranIstemci.auth.getUser();
  if (kullaniciHata || !kullanici.user) return yanit({ hata: 'Oturum geçersiz.' }, 401);

  // 2) Admin mi? (yetki user_roles'tan okunur)
  const yonetim = createClient(url, servis, { auth: { persistSession: false } });
  const { data: roller } = await yonetim
    .from('user_roles')
    .select('rol')
    .eq('user_id', kullanici.user.id);

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

  // 4) Öğrenci hesabı — e-posta doğrulaması istemiyoruz, şifreyi admin veriyor
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

  const ogrenciId = yeni.user.id;

  // 5) Profil alanlarını tamamla (trigger satırı zaten açtı)
  await yonetim
    .from('profiles')
    .update({
      ad_soyad: g.adSoyad.trim(),
      eposta,
      telefon: g.telefon?.trim() || null,
      sinif: g.sinif?.trim() || null,
      hedef_alan: g.hedefAlan?.trim() || null,
      avatar_rengi: g.avatarRengi || null,
    })
    .eq('id', ogrenciId);

  await yonetim.from('user_roles').upsert({ user_id: ogrenciId, rol: 'ogrenci' }, { onConflict: 'user_id,rol' });

  // 6) Koç ataması
  if (g.kocId) {
    await yonetim
      .from('coach_students')
      .upsert({ coach_id: g.kocId, student_id: ogrenciId, aktif: true }, { onConflict: 'coach_id,student_id' });
  }

  // 7) İsteğe bağlı veli hesabı
  let veliId: string | null = null;
  if (g.veli?.eposta && g.veli.sifre) {
    const { data: veliKayit, error: veliHata } = await yonetim.auth.admin.createUser({
      email: g.veli.eposta.trim().toLowerCase(),
      password: g.veli.sifre,
      email_confirm: true,
      user_metadata: { ad_soyad: g.veli.adSoyad?.trim() || 'Veli' },
    });

    if (!veliHata && veliKayit.user) {
      veliId = veliKayit.user.id;
      await yonetim
        .from('profiles')
        .update({ ad_soyad: g.veli.adSoyad?.trim() || 'Veli', eposta: g.veli.eposta.trim().toLowerCase() })
        .eq('id', veliId);
      await yonetim.from('user_roles').upsert({ user_id: veliId, rol: 'veli' }, { onConflict: 'user_id,rol' });
      await yonetim.from('parent_students').upsert(
        { parent_id: veliId, student_id: ogrenciId, detay_seviyesi: g.veli.detaySeviyesi ?? 'ozet' },
        { onConflict: 'parent_id,student_id' },
      );
    }
  }

  // 8) Aktivite akışına düş
  await yonetim.from('activities').insert({
    tur: 'kayit',
    metin: `**${g.adSoyad.trim()}** sisteme eklendi.`,
    aktor_id: kullanici.user.id,
  });

  return yanit({ ogrenciId, veliId, eposta });
});
