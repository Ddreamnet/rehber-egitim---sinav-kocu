/**
 * kullanici-sil — admin, bir hesabı kalıcı olarak siler.
 *
 * Kullanıcı silmek service_role gerektirir; istemciden yapılamaz. Silme
 * `profiles` üzerinden cascade ile yayılır, yani geri dönüşü yoktur:
 *   * öğrenci silinince soru girişleri, denemeler, planlar, görüşmeler gider,
 *   * koç silinince yaptığı görüşmeler ve notlar gider (öğrencilerin geçmişi de).
 *
 * Bu yüzden fonksiyon üç şeyi engeller: kendini silmek, son admini silmek ve
 * hâlâ öğrencisi olan bir koçu silmek. Kalıcı olarak silmek yerine çoğu durumda
 * hesabı pasife almak yeterli.
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

  // 2) Admin mi?
  const yonetim = createClient(url, servis, { auth: { persistSession: false } });
  const { data: roller } = await yonetim.from('user_roles').select('rol').eq('user_id', kullanici.user.id);
  if (!roller?.some((r: { rol: string }) => r.rol === 'admin')) {
    return yanit({ hata: 'Bu işlem için admin yetkisi gerekiyor.' }, 403);
  }

  // 3) Girdi
  let g: { kisiId?: string };
  try {
    g = await req.json();
  } catch {
    return yanit({ hata: 'Geçersiz istek gövdesi.' }, 400);
  }
  const kisiId = (g.kisiId ?? '').trim();
  if (!kisiId) return yanit({ hata: 'Silinecek hesap belirtilmedi.' }, 400);
  if (kisiId === kullanici.user.id) return yanit({ hata: 'Kendi hesabını silemezsin.' }, 400);

  const { data: kisi } = await yonetim.from('profiles').select('ad_soyad').eq('id', kisiId).maybeSingle();
  if (!kisi) return yanit({ hata: 'Hesap bulunamadı.' }, 404);

  const { data: kisiRolleri } = await yonetim.from('user_roles').select('rol').eq('user_id', kisiId);
  const rolListesi = (kisiRolleri ?? []).map((r: { rol: string }) => r.rol);

  // 4) Son admin silinemez — sistem yönetimsiz kalmasın
  if (rolListesi.includes('admin')) {
    const { count } = await yonetim
      .from('user_roles')
      .select('user_id', { count: 'exact', head: true })
      .eq('rol', 'admin');
    if ((count ?? 0) <= 1) return yanit({ hata: 'Sistemdeki son admin hesabı silinemez.' }, 400);
  }

  // 5) Öğrencisi olan koç silinemez — silinirse öğrencilerin görüşme geçmişi de gider
  if (rolListesi.includes('koc')) {
    const { count } = await yonetim
      .from('coach_students')
      .select('student_id', { count: 'exact', head: true })
      .eq('coach_id', kisiId)
      .eq('aktif', true);
    if ((count ?? 0) > 0) {
      return yanit(
        {
          hata: `Bu koça bağlı ${count} öğrenci var. Önce öğrencileri başka bir koça atamalısın; aksi halde görüşme geçmişleri de silinir.`,
        },
        409,
      );
    }
  }

  // 6) Sil — profiles ve bağlı kayıtlar cascade ile gider
  const { error: silmeHata } = await yonetim.auth.admin.deleteUser(kisiId);
  if (silmeHata) return yanit({ hata: silmeHata.message || 'Hesap silinemedi.' }, 400);

  await yonetim.from('activities').insert({
    tur: 'uyari',
    metin: `**${kisi.ad_soyad}** hesabı kalıcı olarak silindi.`,
    aktor_id: kullanici.user.id,
  });

  return yanit({ silindi: true, adSoyad: kisi.ad_soyad });
});
