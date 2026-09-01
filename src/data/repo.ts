/**
 * Veri erişim katmanı.
 *
 * Supabase yapılandırılmışsa (`VITE_SUPABASE_URL`) gerçek sorgular çalışır;
 * yapılandırılmamışsa aynı imzalar demo veriyle karşılanır. Ekranlar hangi
 * kaynağın açık olduğunu bilmez.
 */

import { supabase, supabaseVar, kontrol } from '@/lib/supabase';
import {
  BASVURU_ALANLARI,
  BASVURU_FORM_ENDPOINT,
  BASVURU_PROGRAMLARI,
  BASVURU_SINIFLARI,
  basvuruEtiketi,
  basvuruPaketSecenekleri,
  dersRengi,
  oturumSuz,
  PUAN_TURU_OTURUMLARI,
  PUAN_VERISI_YILI,
  type PuanTuru,
} from '@/config/site';
import { netHesapla, telefonGoster } from '@/lib/format';
import {
  hedefePuanDagit,
  siralamadanPuan,
  type DersNeti,
  type PuanModeli,
} from '@/lib/netDenge';
import { gomuluPuanModeli } from '@/data/puanVerisi';

/** Yeni hedeflerin başlangıç sıralaması. */
const VARSAYILAN_HEDEF = 100000;
import * as demo from './demo';
import type {
  Aktivite,
  Basvuru,
  Deneme,
  Ders,
  DersDagilimi,
  Gorusme,
  GorusmeNotu,
  HaftalikPlan,
  HaftalikSeri,
  KocOdemesi,
  KocOzeti,
  Konu,
  KonuDurumu,
  NetHedefi,
  OgrenciOzeti,
  Oturum,
  Profil,
  Rol,
  SoruGirisi,
  Yazi,
} from './tipler';

// ============================================================
// Demo modunda mutasyonların tutulduğu bellek içi depo
// ============================================================

const depo = {
  girisler: [...demo.GIRISLER],
  notlar: [...demo.KOC_NOTLARI],
  plan: { ...demo.HAFTA_PLANI, maddeler: demo.HAFTA_PLANI.maddeler.map((m) => ({ ...m })) },
  netHedefi: {
    ...demo.NET_HEDEFI,
    dagilim: demo.NET_HEDEFI.dagilim.map((d) => ({ ...d })),
  },
  basvurular: [] as Basvuru[],
};

const yeniId = () => Math.random().toString(36).slice(2, 10);

/**
 * Yerel gün (YYYY-MM-DD).
 *
 * `toISOString()` UTC'ye çeviriyor; Türkiye UTC+3 olduğu için gece yarısı ile
 * 03:00 arasında "bugün" bir gün geriye kayıyordu — plan maddeleri o saatlerde
 * yanlış güne düşüyordu.
 */
export function yerelGun(d: Date = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Verilen tarihin içinde bulunduğu haftanın pazartesisi (YYYY-MM-DD). */
export function haftaBasi(d: Date = new Date()): string {
  const t = new Date(d);
  const gun = t.getDay() || 7; // pazar = 7
  t.setDate(t.getDate() - (gun - 1));
  return yerelGun(t);
}

/** `haftaBasi`'na hafta ekler/çıkarır. */
export function haftaKaydir(haftaBaslangic: string, adim: number): string {
  const t = new Date(`${haftaBaslangic}T00:00:00`);
  t.setDate(t.getDate() + adim * 7);
  return yerelGun(t);
}

/**
 * Demo depodan okurken kopya döndürürüz: aksi halde yerinde yapılan mutasyon
 * önbellekteki nesneyi de değiştirir, TanStack Query "veri değişmedi" sanar ve
 * ekran tazelenmez.
 */
const kopya = <T>(deger: T): T => structuredClone(deger);

function planOrani(maddeler: { tamamlandi: boolean }[]): number {
  if (!maddeler.length) return 0;
  return maddeler.filter((m) => m.tamamlandi).length / maddeler.length;
}

// ============================================================
// Profil / kişiler
// ============================================================

/** Rol öncelik sırası: birden fazla rol atanmışsa en yetkilisi kazanır. */
const ROL_SIRASI: Rol[] = ['admin', 'koc', 'veli', 'ogrenci'];

function enYetkiliRol(satirlar: Array<{ rol: Rol }> | null | undefined): Rol {
  const roller = (satirlar ?? []).map((s) => s.rol);
  return ROL_SIRASI.find((r) => roller.includes(r)) ?? 'ogrenci';
}

/** Pasife alınmış hesapla girildiğinde fırlatılır. */
export const PASIF_HESAP = 'Hesabın şu anda kapalı. Koçunla ya da bizimle iletişime geçebilirsin.';

export async function mevcutProfil(): Promise<Profil | null> {
  if (!supabaseVar) return null;
  const { data: oturum } = await supabase!.auth.getUser();
  if (!oturum.user) return null;

  // Yetki profilde değil user_roles'ta tutulur (EWD kalıbı).
  const [profilSonuc, rolSonuc] = await Promise.all([
    supabase!
      .from('profiles')
      .select('id, ad_soyad, eposta, sinif, hedef_alan, hedef, avatar_rengi, avatar_url, aktif')
      .eq('id', oturum.user.id)
      .single(),
    supabase!.from('user_roles').select('rol').eq('user_id', oturum.user.id),
  ]);

  const satir = kontrol(profilSonuc);

  // `aktif` hiçbir yerde kontrol edilmiyordu: pasife alınan hesap normal giriş
  // yapıp panelini kullanmaya devam ediyordu. Oturumu burada kapatıyoruz ki
  // hem yeni giriş hem de açık kalmış eski oturum düşsün.
  if (satir.aktif === false) {
    // Giriş akışı ve onAuthStateChange bu noktaya iki kez geliyor; ilk çıkış
    // oturumu zaten sildiği için ikincisi "session_not_found" ile 403 veriyordu.
    // Oturum duruyorsa çıkıyoruz, durmuyorsa istek hiç atılmıyor.
    const { data: mevcut } = await supabase!.auth.getSession();
    if (mevcut.session) await supabase!.auth.signOut();
    throw new Error(PASIF_HESAP);
  }

  return {
    id: satir.id,
    rol: enYetkiliRol(kontrol(rolSonuc) as Array<{ rol: Rol }>),
    adSoyad: satir.ad_soyad,
    eposta: satir.eposta,
    sinif: satir.sinif,
    hedefAlan: satir.hedef_alan,
    hedef: satir.hedef,
    avatarRengi: satir.avatar_rengi,
    avatarUrl: satir.avatar_url,
  };
}

/** Koçun öğrenci listesi (koç paneli tablosu). */
export async function ogrencilerim(kocId: string): Promise<OgrenciOzeti[]> {
  if (!supabaseVar) return demo.KOC_OGRENCILERI;

  const tumBaglar = kontrol(
    await supabase!
      .from('coach_students')
      .select('student_id, profiles:student_id (id, ad_soyad, hedef_alan, avatar_rengi, avatar_url, aktif)')
      .eq('coach_id', kocId)
      .eq('aktif', true),
  ) as Array<{ student_id: string; profiles: any }>;

  // `coach_students.aktif` bağın durumu; öğrencinin hesabı pasife alındığında
  // (`profiles.aktif`) koçun listesinde kalmaya devam ediyordu.
  const baglar = tumBaglar.filter((b) => b.profiles?.aktif !== false);

  const ogrenciIdler = baglar.map((b) => b.student_id);
  if (!ogrenciIdler.length) return [];

  const [denemeler, planlar, gorusmeler] = await Promise.all([
    supabase!
      .from('mock_exams')
      .select('student_id, net, tarih')
      .in('student_id', ogrenciIdler)
      .order('tarih', { ascending: true }),
    supabase!
      .from('weekly_plans')
      .select('id, student_id, plan_items (tamamlandi)')
      .in('student_id', ogrenciIdler)
      .order('hafta_baslangic', { ascending: false }),
    supabase!
      .from('meetings')
      .select('student_id, baslangic')
      .in('student_id', ogrenciIdler)
      .eq('durum', 'planlandi')
      .gte('baslangic', new Date().toISOString())
      .order('baslangic', { ascending: true }),
  ]);

  return baglar.map((b) => {
    const p = b.profiles;
    const netler = ((denemeler.data ?? []) as any[])
      .filter((d) => d.student_id === b.student_id)
      .map((d) => Number(d.net));
    const plan = ((planlar.data ?? []) as any[]).find((x) => x.student_id === b.student_id);
    const oran = plan ? planOrani(plan.plan_items ?? []) : 0;
    const gorusme = ((gorusmeler.data ?? []) as any[]).find((g) => g.student_id === b.student_id);
    const sonNet = netler.length ? netler[netler.length - 1] : null;
    const oncekiNet = netler.length > 1 ? netler[netler.length - 2] : null;

    let durum: OgrenciOzeti['durum'] = 'yolunda';
    if (!netler.length && oran < 0.2) durum = 'yeni';
    else if (oran < 0.2 || (oncekiNet !== null && sonNet !== null && sonNet < oncekiNet - 2))
      durum = 'riskli';
    else if (oran < 0.5) durum = 'gecikti';

    return {
      id: b.student_id,
      adSoyad: p?.ad_soyad ?? '—',
      avatarRengi: p?.avatar_rengi ?? dersRengi(p?.hedef_alan),
      avatarUrl: p?.avatar_url,
      sinav: p?.hedef_alan ?? '—',
      planOrani: oran,
      netTrendi: netler.slice(-6),
      sonNet,
      sonrakiGorusme: gorusme?.baslangic ?? null,
      durum,
    };
  });
}

/** Velinin bağlı olduğu öğrenci + detay seviyesi. */
export async function cocugum(
  veliId: string,
): Promise<{ ogrenci: Profil; detaySeviyesi: 'ozet' | 'tam'; kocAdi: string } | null> {
  if (!supabaseVar) {
    return { ogrenci: demo.OGRENCI, detaySeviyesi: demo.VELI_RAPORU.detaySeviyesi, kocAdi: demo.KOC.adSoyad };
  }
  const bag = kontrol(
    await supabase!
      .from('parent_students')
      .select(
        'student_id, detay_seviyesi, profiles:student_id (id, ad_soyad, sinif, hedef_alan, hedef, avatar_rengi, avatar_url)',
      )
      .eq('parent_id', veliId)
      .limit(1)
      .maybeSingle(),
  ) as any;
  if (!bag) return null;

  const koc = kontrol(
    await supabase!
      .from('coach_students')
      .select('profiles:coach_id (ad_soyad)')
      .eq('student_id', bag.student_id)
      .eq('aktif', true)
      .limit(1)
      .maybeSingle(),
  ) as any;

  return {
    ogrenci: {
      id: bag.profiles.id,
      rol: 'ogrenci',
      adSoyad: bag.profiles.ad_soyad,
      sinif: bag.profiles.sinif,
      hedefAlan: bag.profiles.hedef_alan,
      hedef: bag.profiles.hedef,
      avatarRengi: bag.profiles.avatar_rengi,
      avatarUrl: bag.profiles.avatar_url,
    },
    detaySeviyesi: bag.detay_seviyesi,
    kocAdi: koc?.profiles?.ad_soyad ?? '—',
  };
}

// ============================================================
// Müfredat
// ============================================================

export async function oturumlar(): Promise<Oturum[]> {
  if (!supabaseVar) return demo.OTURUMLAR;
  const satirlar = kontrol(
    await supabase!
      .from('exam_sessions')
      .select('id, kod, ad, sira, exams:exam_id (kod, tur)')
      .order('sira'),
  ) as any[];
  return satirlar.map((s) => ({
    id: s.id,
    kod: s.kod,
    ad: s.ad,
    sinavKodu: s.exams?.kod ?? '',
    tur: s.exams?.tur === 'duzey' ? 'duzey' : 'sinav',
  }));
}

/**
 * Öğrencinin programına uyan oturum.
 *
 * Varsayılan olarak `oturumlar()[0]` (yani TYT) kullanılıyordu: LGS öğrencisi
 * müfredatta, ilerlemede ve koçun konu seçicisinde TYT derslerini görüyordu.
 * Sınava hazırlanmayan öğrenci ise kendi sınıf düzeyinin müfredatına gider.
 */
export async function ogrenciOturumu(ogrenciId: string): Promise<Oturum | undefined> {
  const hepsi = await oturumlar();
  if (!hepsi.length) return undefined;
  if (!supabaseVar) return hepsi[0];

  const kisi = kontrol(
    await supabase!.from('profiles').select('hedef_alan, sinif').eq('id', ogrenciId).maybeSingle(),
  ) as any;
  return oturumSuz(hepsi, { hedefAlan: kisi?.hedef_alan, sinif: kisi?.sinif })[0] ?? hepsi[0];
}

export async function varsayilanOturumId(ogrenciId: string): Promise<string | undefined> {
  return (await ogrenciOturumu(ogrenciId))?.id;
}


/**
 * Bir puan türünün netlerini besleyen tüm dersler (Sayısal → TYT + AYT Sayısal).
 *
 * Landing'deki deneme kutusu ve yeni hedef kurulumu bunu kullanır: sıralama TYT
 * ve AYT'nin birlikte hesabından çıktığı için tek oturumun dersleri yetmez.
 */
export async function puanTuruDersleri(
  puanTuru: string,
): Promise<Array<{ id: string; ad: string; oturumKod: string; oturumAd: string; renk: string; maxNet: number }>> {
  const kodlar = PUAN_TURU_OTURUMLARI[puanTuru as PuanTuru] ?? [];
  if (!kodlar.length) return [];

  if (!supabaseVar) {
    return kodlar.flatMap((kod) =>
      (demo.MUFREDAT[kod] ?? []).map((d) => ({
        id: `${kod}:${d.id}`,
        ad: d.ad,
        oturumKod: kod,
        oturumAd: demo.OTURUM_ADLARI?.[kod] ?? kod.toLocaleUpperCase('tr-TR'),
        renk: d.renk,
        maxNet: d.soruSayisi,
      })),
    );
  }

  const oturumSatirlari = kontrol(
    await supabase!.from('exam_sessions').select('id, kod, ad, sira').in('kod', kodlar),
  ) as any[];
  if (!oturumSatirlari.length) return [];

  const satirlar = kontrol(
    await supabase!
      .from('subjects')
      .select('id, ad, soru_sayisi, sira, session_id')
      .in('session_id', oturumSatirlari.map((o) => o.id))
      .order('sira'),
  ) as any[];

  const oturumu = (id: string) => oturumSatirlari.find((o) => o.id === id);
  return satirlar
    .map((d) => {
      const o = oturumu(d.session_id);
      return {
        id: d.id,
        ad: d.ad,
        oturumKod: o?.kod ?? '',
        oturumAd: o?.ad ?? '',
        renk: dersRengi(d.ad),
        maxNet: d.soru_sayisi ?? 40,
        _sira: (o?.sira ?? 0) * 100 + (d.sira ?? 0),
      };
    })
    .sort((a, b) => a._sira - b._sira)
    .map(({ _sira, ...d }) => d);
}

/**
 * Müfredat ağacı. `buHaftaIsaretle` yalnız müfredat ekranında gerekir —
 * varsayılan olarak kapalı, çünkü haftalık planı ayrıca çekmeyi gerektiriyor.
 */
export async function mufredat(
  oturumId: string,
  ogrenciId: string,
  buHaftaIsaretle = false,
): Promise<Ders[]> {
  if (!supabaseVar) return kopya(demo.MUFREDAT[oturumId] ?? []);

  const dersler = kontrol(
    await supabase!
      .from('subjects')
      .select(
        'id, ad, renk, soru_sayisi, sira, topics (id, ad, sira, question_avg, past_questions_url, topic_resources (baslik, url, sira))',
      )
      .eq('session_id', oturumId)
      .order('sira'),
  ) as any[];

  const ilerleme = kontrol(
    await supabase!
      .from('topic_progress')
      .select('topic_id, durum, cozulen, hedef')
      .eq('student_id', ogrenciId),
  ) as any[];
  const ilerlemeHaritasi = new Map(ilerleme.map((i) => [i.topic_id, i]));

  const buHaftaKonular = buHaftaIsaretle ? await buHaftakiKonuIdleri(ogrenciId) : new Set<string>();

  return dersler.map((d) => {
    const konular: Konu[] = (d.topics ?? [])
      .sort((a: any, b: any) => a.sira - b.sira)
      .map((t: any) => {
        const p = ilerlemeHaritasi.get(t.id);
        return {
          id: t.id,
          ad: t.ad,
          soruOrtalamasi: Number(t.question_avg ?? 0),
          cikmisSorularUrl: t.past_questions_url,
          kaynaklar: ((t.topic_resources ?? []) as any[])
            .sort((a, b) => a.sira - b.sira)
            .map((k) => ({ ad: k.baslik, url: k.url })),
          durum: p?.durum ?? 'baslanmadi',
          cozulen: p?.cozulen ?? 0,
          hedef: p?.hedef ?? 40,
          buHafta: buHaftaKonular.has(t.id),
        };
      });
    return {
      id: d.id,
      ad: d.ad,
      renk: dersRengi(d.renk === 'dil' ? 'Yabancı Dil' : d.ad),
      soruSayisi: d.soru_sayisi,
      konular,
      tamamlanan: konular.filter((k) => k.durum === 'tamam').length,
      toplamKonu: konular.length,
    };
  });
}

async function buHaftakiKonuIdleri(ogrenciId: string): Promise<Set<string>> {
  const plan = await haftaPlani(ogrenciId);
  return new Set(plan?.maddeler.map((m) => m.konuId).filter(Boolean) as string[]);
}

// ============================================================
// Haftalık plan
// ============================================================

/**
 * Haftalık plan.
 *
 * `hafta` verilmezse içinde bulunduğumuz hafta gösterilir. Koç gelecek haftayı
 * hazırlamışsa "en son plan"ı almak öğrenciye yanlış haftayı gösteriyordu;
 * bu yüzden önce bu hafta, yoksa en yakın geçmiş hafta, o da yoksa en yakın
 * gelecek hafta seçilir.
 */
export async function haftaPlani(ogrenciId: string, hafta?: string): Promise<HaftalikPlan | null> {
  if (!supabaseVar) return kopya({ ...depo.plan, oran: planOrani(depo.plan.maddeler) });

  const secim =
    'id, hafta_baslangic, plan_items (id, baslik, topic_id, tamamlandi, gun, baslangic, bitis, sira, not_metni, topics:topic_id (question_avg, subjects:subject_id (ad, renk)))';

  let plan: any = null;
  if (hafta) {
    plan = kontrol(
      await supabase!.from('weekly_plans').select(secim).eq('student_id', ogrenciId).eq('hafta_baslangic', hafta).maybeSingle(),
    );
  } else {
    const buHafta = haftaBasi();
    const satirlar = kontrol(
      await supabase!
        .from('weekly_plans')
        .select(secim)
        .eq('student_id', ogrenciId)
        .order('hafta_baslangic', { ascending: false })
        .limit(8),
    ) as any[];
    plan =
      satirlar.find((p) => p.hafta_baslangic === buHafta) ??
      satirlar.find((p) => p.hafta_baslangic < buHafta) ??
      satirlar[satirlar.length - 1] ??
      null;
  }
  if (!plan) return null;

  const bugun = yerelGun();
  const maddeler = (plan.plan_items ?? [])
    .sort((a: any, b: any) => a.sira - b.sira)
    .map((m: any) => ({
      id: m.id,
      baslik: m.baslik,
      konuId: m.topic_id,
      dersAdi: m.topics?.subjects?.ad ?? null,
      renk: dersRengi(m.topics?.subjects?.ad ?? m.baslik),
      tamamlandi: m.tamamlandi,
      soruOrtalamasi: m.topics?.question_avg ? Number(m.topics.question_avg) : null,
      gun: m.gun,
      baslangicSaat: m.baslangic,
      bitisSaat: m.bitis,
      not: m.not_metni,
      bugun: m.gun === bugun,
    }));

  return { id: plan.id, haftaBaslangic: plan.hafta_baslangic, maddeler, oran: planOrani(maddeler) };
}

export async function planMaddesiIsaretle(maddeId: string, tamamlandi: boolean): Promise<void> {
  if (!supabaseVar) {
    const m = depo.plan.maddeler.find((x) => x.id === maddeId);
    if (m) m.tamamlandi = tamamlandi;
    return;
  }
  kontrol(await supabase!.from('plan_items').update({ tamamlandi }).eq('id', maddeId).select('id'));
}

/** "Bugünün akışı" saat çizelgesi blokları. */
export async function bugununAkisi(
  ogrenciId: string,
): Promise<Array<{ baslik: string; renk: string; baslangic: string; bitis: string }>> {
  if (!supabaseVar) return kopya(demo.BUGUN_AKISI);

  const plan = await haftaPlani(ogrenciId);
  const bugun = yerelGun();
  return (plan?.maddeler ?? [])
    .filter((m) => m.gun === bugun && m.baslangicSaat && m.bitisSaat)
    .map((m) => ({
      baslik: m.baslik,
      renk: m.renk,
      baslangic: m.baslangicSaat!.slice(0, 5),
      bitis: m.bitisSaat!.slice(0, 5),
    }));
}

/** Üst üste giriş yapılan gün sayısı (seri). */
export async function girisSerisi(ogrenciId: string): Promise<number> {
  // Yalnız tarih sütunu yeterli; konu/ders join'i seri hesabı için gereksiz.
  const gunler = new Set<string>();
  if (!supabaseVar) {
    depo.girisler.forEach((g) => gunler.add(new Date(g.tarih).toISOString().slice(0, 10)));
  } else {
    const satirlar = kontrol(
      await supabase!
        .from('question_entries')
        .select('created_at')
        .eq('student_id', ogrenciId)
        .gte('created_at', new Date(Date.now() - 120 * 86400000).toISOString())
        .order('created_at', { ascending: false }),
    ) as Array<{ created_at: string }>;
    satirlar.forEach((g) => gunler.add(new Date(g.created_at).toISOString().slice(0, 10)));
  }
  if (!gunler.size) return 0;
  let seri = 0;
  const imlec = new Date();
  // Bugün giriş yoksa dünden başla — gün içinde seri bozulmuş sayılmaz.
  if (!gunler.has(imlec.toISOString().slice(0, 10))) imlec.setDate(imlec.getDate() - 1);
  while (gunler.has(imlec.toISOString().slice(0, 10))) {
    seri += 1;
    imlec.setDate(imlec.getDate() - 1);
  }
  return seri;
}

export interface AtanabilirKonu {
  id: string;
  ad: string;
  dersAdi: string;
  renk: string;
  durum: Konu['durum'];
  soruOrtalamasi: number;
  /** Öğrencinin o konuda şimdiye kadar çözdüğü soru */
  cozulen: number;
  hedef: number;
}

/** Koçun plan kurarken seçebileceği konular (tamamlananlar hariç). */
export async function atanabilirKonular(ogrenciId: string, oturumId?: string): Promise<AtanabilirKonu[]> {
  const secilen = oturumId ?? (await varsayilanOturumId(ogrenciId));
  if (!secilen) return [];
  const dersler = await mufredat(secilen, ogrenciId);
  return dersler.flatMap((d) =>
    d.konular
      .filter((k) => k.durum !== 'tamam')
      .map((k) => ({
        id: k.id,
        ad: k.ad,
        dersAdi: d.ad,
        renk: d.renk,
        durum: k.durum,
        soruOrtalamasi: k.soruOrtalamasi,
        cozulen: k.cozulen,
        hedef: k.hedef,
      })),
  );
}

export interface PlanMaddesiGirdi {
  /** Mevcut madde güncelleniyorsa id verilir — "tamamlandı" bilgisi korunur. */
  id?: string;
  baslik: string;
  konuId?: string | null;
  /** YYYY-MM-DD; boşsa madde haftaya serbest atanmıştır */
  gun?: string | null;
  /** Koçun o maddeye yazdığı yönerge — öğrenci panelinde görünür */
  not?: string | null;
}

/**
 * Koç: bir haftanın ders programını kaydeder.
 *
 * Gönderilen liste o haftanın tamamıdır — listede olmayan eski maddeler silinir,
 * id'si gelenler güncellenir (öğrencinin işaretlediği "tamamlandı" korunur),
 * yenileri eklenir. Eskiden her gönderim satırları yeniden eklediği için plan
 * kopyalanıyordu.
 */
export async function planKaydet(
  ogrenciId: string,
  kocId: string,
  haftaBaslangic: string,
  maddeler: PlanMaddesiGirdi[],
): Promise<void> {
  if (!supabaseVar) {
    depo.plan = {
      ...depo.plan,
      haftaBaslangic,
      maddeler: maddeler.map((m) => {
        const eski = depo.plan.maddeler.find((x) => x.id === m.id);
        return {
          id: m.id ?? yeniId(),
          baslik: m.baslik,
          konuId: m.konuId ?? null,
          dersAdi: eski?.dersAdi ?? null,
          renk: eski?.renk ?? dersRengi(m.baslik),
          tamamlandi: eski?.tamamlandi ?? false,
          soruOrtalamasi: eski?.soruOrtalamasi ?? null,
          gun: m.gun ?? null,
          baslangicSaat: eski?.baslangicSaat ?? null,
          bitisSaat: eski?.bitisSaat ?? null,
          not: m.not ?? null,
          bugun: m.gun === yerelGun(),
        };
      }),
    };
    return;
  }

  const plan = kontrol(
    await supabase!
      .from('weekly_plans')
      .upsert(
        { student_id: ogrenciId, coach_id: kocId, hafta_baslangic: haftaBaslangic, gonderildi: true },
        { onConflict: 'student_id,hafta_baslangic' },
      )
      .select('id')
      .single(),
  ) as any;

  const mevcut = kontrol(await supabase!.from('plan_items').select('id').eq('plan_id', plan.id)) as Array<{ id: string }>;
  const kalanlar = new Set(maddeler.map((m) => m.id).filter(Boolean) as string[]);
  const silinecek = mevcut.filter((m) => !kalanlar.has(m.id)).map((m) => m.id);

  if (silinecek.length) {
    kontrol(await supabase!.from('plan_items').delete().in('id', silinecek).select('id'));
  }

  const satir = (m: PlanMaddesiGirdi, i: number) => ({
    plan_id: plan.id,
    baslik: m.baslik,
    topic_id: m.konuId ?? null,
    gun: m.gun || null,
    not_metni: m.not?.trim() || null,
    sira: i,
  });

  const yeniler = maddeler.map(satir).filter((_, i) => !maddeler[i].id);
  if (yeniler.length) kontrol(await supabase!.from('plan_items').insert(yeniler).select('id'));

  for (const [i, m] of maddeler.entries()) {
    if (!m.id) continue;
    kontrol(await supabase!.from('plan_items').update(satir(m, i)).eq('id', m.id).select('id'));
  }
}

// ============================================================
// Soru girişi ve ilerleme
// ============================================================

export async function girisler(ogrenciId: string, limit = 20): Promise<SoruGirisi[]> {
  if (!supabaseVar) return kopya(depo.girisler.slice(0, limit));

  const satirlar = kontrol(
    await supabase!
      .from('question_entries')
      .select('id, topic_id, dogru, yanlis, bos, net, created_at, topics:topic_id (ad, subjects:subject_id (ad))')
      .eq('student_id', ogrenciId)
      .order('created_at', { ascending: false })
      .limit(limit),
  ) as any[];

  return satirlar.map((s) => ({
    id: s.id,
    konuId: s.topic_id,
    konuAdi: s.topics?.ad ?? 'Konu',
    renk: dersRengi(s.topics?.subjects?.ad ?? s.topics?.ad),
    dogru: s.dogru,
    yanlis: s.yanlis,
    bos: s.bos,
    net: Number(s.net),
    tarih: s.created_at,
  }));
}

export async function girisEkle(
  ogrenciId: string,
  giris: { konuId: string | null; konuAdi: string; dogru: number; yanlis: number; bos: number },
): Promise<SoruGirisi> {
  const net = netHesapla(giris.dogru, giris.yanlis);

  if (!supabaseVar) {
    const kayit: SoruGirisi = {
      id: yeniId(),
      konuId: giris.konuId,
      konuAdi: giris.konuAdi,
      renk: dersRengi(giris.konuAdi),
      dogru: giris.dogru,
      yanlis: giris.yanlis,
      bos: giris.bos,
      net,
      tarih: new Date().toISOString(),
    };
    depo.girisler.unshift(kayit);
    return kayit;
  }

  const satir = kontrol(
    await supabase!
      .from('question_entries')
      .insert({
        student_id: ogrenciId,
        topic_id: giris.konuId,
        dogru: giris.dogru,
        yanlis: giris.yanlis,
        bos: giris.bos,
      })
      .select('id, created_at')
      .single(),
  ) as any;

  return {
    id: satir.id,
    konuId: giris.konuId,
    konuAdi: giris.konuAdi,
    renk: dersRengi(giris.konuAdi),
    dogru: giris.dogru,
    yanlis: giris.yanlis,
    bos: giris.bos,
    net,
    tarih: satir.created_at,
  };
}

/**
 * Konu ilerlemesini artırır (soru girişi sonrası çağrılır).
 * Hedefe ulaşıldığında konu "tamam" sayılır.
 */
export async function konuIlerlemesiArtir(
  ogrenciId: string,
  konuId: string,
  cozulenEk: number,
): Promise<void> {
  if (!supabaseVar) {
    for (const dersler of Object.values(demo.MUFREDAT)) {
      for (const ders of dersler) {
        const konu = ders.konular.find((k) => k.id === konuId);
        if (konu) {
          // Hedef bir üst sınır değil, "konu kapandı" eşiği: 40'ı geçen girişler
          // tavana takılıp yok sayılıyordu.
          konu.cozulen += cozulenEk;
          if (konu.cozulen >= konu.hedef) konu.durum = 'tamam';
          else if (konu.durum === 'baslanmadi') konu.durum = 'devam';
          return;
        }
      }
    }
    return;
  }

  const mevcut = kontrol(
    await supabase!
      .from('topic_progress')
      .select('cozulen, hedef, durum')
      .eq('student_id', ogrenciId)
      .eq('topic_id', konuId)
      .maybeSingle(),
  ) as any;

  const hedef = mevcut?.hedef ?? 40;
  // Çözülen soru sayısı hedefle sınırlanıyordu: 40'a ulaşan konuda sonraki
  // girişler kaydediliyor ama ilerlemeye yansımıyordu.
  const cozulen = (mevcut?.cozulen ?? 0) + cozulenEk;
  const durum = cozulen >= hedef ? 'tamam' : 'devam';

  kontrol(
    await supabase!
      .from('topic_progress')
      .upsert(
        { student_id: ogrenciId, topic_id: konuId, cozulen, hedef, durum, updated_at: new Date().toISOString() },
        { onConflict: 'student_id,topic_id' },
      )
      .select('topic_id'),
  );
}

/**
 * Konunun durumunu doğrudan ayarlar (öğrencinin "tamamlandı" işareti).
 *
 * Soru girişi ilerlemeyi otomatik yürütüyor ama hedefe ulaşmadan biten konular
 * da var; işaretleme olmadan konu hiç kapanmıyordu.
 */
export async function konuDurumuAyarla(
  ogrenciId: string,
  konuId: string,
  durum: KonuDurumu,
): Promise<void> {
  if (!supabaseVar) {
    for (const dersler of Object.values(demo.MUFREDAT)) {
      for (const ders of dersler) {
        const konu = ders.konular.find((k) => k.id === konuId);
        if (konu) {
          konu.durum = durum;
          if (durum === 'tamam') konu.cozulen = Math.max(konu.cozulen, konu.hedef);
          if (durum === 'baslanmadi') konu.cozulen = 0;
          return;
        }
      }
    }
    return;
  }

  const mevcut = kontrol(
    await supabase!
      .from('topic_progress')
      .select('cozulen, hedef')
      .eq('student_id', ogrenciId)
      .eq('topic_id', konuId)
      .maybeSingle(),
  ) as any;

  const hedef = mevcut?.hedef ?? 40;
  const cozulen =
    durum === 'tamam' ? Math.max(mevcut?.cozulen ?? 0, hedef) : durum === 'baslanmadi' ? 0 : (mevcut?.cozulen ?? 0);

  kontrol(
    await supabase!
      .from('topic_progress')
      .upsert(
        { student_id: ogrenciId, topic_id: konuId, cozulen, hedef, durum, updated_at: new Date().toISOString() },
        { onConflict: 'student_id,topic_id' },
      )
      .select('topic_id'),
  );
}

export interface DersBazliOzet {
  dersId: string;
  ad: string;
  renk: string;
  /** Sınavda o dersten çıkan soru sayısı */
  soruSayisi: number;
  /** Başlangıçtan bugüne çözülen toplam soru */
  toplam: number;
  dogru: number;
  yanlis: number;
  bos: number;
  net: number;
  /** doğru / çözülen */
  basari: number;
  buHafta: number;
  sonDortHafta: number;
  konuTamam: number;
  konuToplam: number;
  sonGiris: string | null;
}

/**
 * Ders bazlı toplam tablo.
 *
 * Paneller yalnız "bu hafta" ve yüzde gösteriyordu; öğrencinin başlangıçtan
 * bugüne hangi dersten kaç soru çözdüğü hiçbir yerde toplu görünmüyordu.
 * Öğrenci ve koç panelleri aynı tabloyu bu fonksiyondan besliyor.
 */
export async function dersBazliOzet(ogrenciId: string, oturumId?: string): Promise<DersBazliOzet[]> {
  const secilen = oturumId ?? (await varsayilanOturumId(ogrenciId));
  if (!secilen) return [];
  const dersler = await mufredat(secilen, ogrenciId);

  const haftaOnce = Date.now() - 7 * 86400000;
  const dortHaftaOnce = Date.now() - 28 * 86400000;

  // konu id → ders id eşlemesi
  const konuDers = new Map<string, string>();
  for (const d of dersler) for (const k of d.konular) konuDers.set(k.id, d.id);

  type Giris = { topic_id: string | null; dogru: number; yanlis: number; bos: number; net: number; created_at: string };
  let girisler: Giris[];

  if (!supabaseVar) {
    girisler = depo.girisler.map((g) => ({
      topic_id: g.konuId,
      dogru: g.dogru,
      yanlis: g.yanlis,
      bos: g.bos,
      net: g.net,
      created_at: g.tarih,
    }));
  } else {
    girisler = kontrol(
      await supabase!
        .from('question_entries')
        .select('topic_id, dogru, yanlis, bos, net, created_at')
        .eq('student_id', ogrenciId)
        .order('created_at', { ascending: false }),
    ) as Giris[];
  }

  return dersler.map((d) => {
    const kendi = girisler.filter((g) => g.topic_id && konuDers.get(g.topic_id) === d.id);
    const say = (liste: Giris[]) => liste.reduce((a, g) => a + g.dogru + g.yanlis + g.bos, 0);
    const toplam = say(kendi);
    const dogru = kendi.reduce((a, g) => a + g.dogru, 0);

    return {
      dersId: d.id,
      ad: d.ad,
      renk: d.renk,
      soruSayisi: d.soruSayisi,
      toplam,
      dogru,
      yanlis: kendi.reduce((a, g) => a + g.yanlis, 0),
      bos: kendi.reduce((a, g) => a + g.bos, 0),
      net: Number(kendi.reduce((a, g) => a + Number(g.net), 0).toFixed(1)),
      basari: toplam ? dogru / toplam : 0,
      buHafta: say(kendi.filter((g) => new Date(g.created_at).getTime() >= haftaOnce)),
      sonDortHafta: say(kendi.filter((g) => new Date(g.created_at).getTime() >= dortHaftaOnce)),
      konuTamam: d.tamamlanan,
      konuToplam: d.toplamKonu,
      sonGiris: kendi[0]?.created_at ?? null,
    };
  });
}

/** Haftalık çözülen soru + ortalama net serisi (bar + çizgi kombosu). */
export async function haftalikSeri(ogrenciId: string, hafta = 8): Promise<HaftalikSeri[]> {
  if (!supabaseVar) return demo.HAFTALIK_SERI;

  const baslangic = new Date();
  baslangic.setDate(baslangic.getDate() - hafta * 7);

  const satirlar = kontrol(
    await supabase!
      .from('question_entries')
      .select('dogru, yanlis, bos, net, created_at')
      .eq('student_id', ogrenciId)
      .gte('created_at', baslangic.toISOString())
      .order('created_at'),
  ) as any[];

  const kovalar: Array<{ soru: number; net: number; adet: number }> = Array.from(
    { length: hafta },
    () => ({ soru: 0, net: 0, adet: 0 }),
  );

  for (const s of satirlar) {
    const fark = Math.floor((Date.now() - new Date(s.created_at).getTime()) / (7 * 86400000));
    const idx = hafta - 1 - Math.min(hafta - 1, fark);
    kovalar[idx].soru += s.dogru + s.yanlis + s.bos;
    kovalar[idx].net += Number(s.net);
    kovalar[idx].adet += 1;
  }

  return kovalar.map((k, i) => ({
    etiket: `H${i + 1}`,
    cozulenSoru: k.soru,
    ortalamaNet: k.adet ? Number((k.net / k.adet).toFixed(1)) : 0,
  }));
}

/** Ders dağılımı donut'u — son 30 gün. */
export async function dersDagilimi(ogrenciId: string): Promise<DersDagilimi[]> {
  if (!supabaseVar) return demo.DERS_DAGILIMI;

  const otuzGun = new Date(Date.now() - 30 * 86400000).toISOString();
  const satirlar = kontrol(
    await supabase!
      .from('question_entries')
      .select('dogru, yanlis, bos, topics:topic_id (subjects:subject_id (ad))')
      .eq('student_id', ogrenciId)
      .gte('created_at', otuzGun),
  ) as any[];

  const toplamlar = new Map<string, number>();
  for (const s of satirlar) {
    const ad = s.topics?.subjects?.ad ?? 'Diğer';
    toplamlar.set(ad, (toplamlar.get(ad) ?? 0) + s.dogru + s.yanlis + s.bos);
  }
  const genelToplam = [...toplamlar.values()].reduce((a, b) => a + b, 0) || 1;

  return [...toplamlar.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([ad, soru]) => ({ ad, renk: dersRengi(ad), soru, oran: soru / genelToplam }));
}

export async function denemeler(ogrenciId: string): Promise<Deneme[]> {
  if (!supabaseVar) return demo.DENEMELER;

  const satirlar = kontrol(
    await supabase!
      .from('mock_exams')
      .select('id, ad, tarih, net')
      .eq('student_id', ogrenciId)
      .order('tarih'),
  ) as any[];

  return satirlar.map((s, i) => ({
    id: s.id,
    ad: s.ad,
    tarih: s.tarih,
    net: Number(s.net),
    degisim: i === 0 ? null : Number((Number(s.net) - Number(satirlar[i - 1].net)).toFixed(1)),
  }));
}

/**
 * Deneme sonucu ekler.
 *
 * Net gelişimi grafikleri bu tablodan besleniyor ama sisteme deneme girecek
 * hiçbir ekran yoktu — grafikler kalıcı olarak boş kalıyordu.
 */
export async function denemeEkle(
  ogrenciId: string,
  giris: { ad: string; tarih: string; net: number },
): Promise<void> {
  if (!supabaseVar) {
    demo.DENEMELER.push({ id: yeniId(), ad: giris.ad, tarih: giris.tarih, net: giris.net, degisim: null });
    return;
  }
  kontrol(
    await supabase!
      .from('mock_exams')
      .insert({ student_id: ogrenciId, ad: giris.ad, tarih: giris.tarih, net: giris.net })
      .select('id'),
  );
}

export async function denemeSil(denemeId: string): Promise<void> {
  if (!supabaseVar) {
    const i = demo.DENEMELER.findIndex((d) => d.id === denemeId);
    if (i >= 0) demo.DENEMELER.splice(i, 1);
    return;
  }
  kontrol(await supabase!.from('mock_exams').delete().eq('id', denemeId).select('id'));
}

/** Ders bazlı müfredat ilerlemesi (koç/veli panelindeki barlar). */
export async function dersIlerlemesi(
  ogrenciId: string,
  oturumId?: string,
): Promise<Array<{ ad: string; renk: string; oran: number }>> {
  if (!supabaseVar) return demo.DERS_ILERLEMESI;

  const secilen = oturumId ?? (await varsayilanOturumId(ogrenciId));
  if (!secilen) return [];
  const dersler = await mufredat(secilen, ogrenciId);
  return dersler.map((d) => ({
    ad: d.ad,
    renk: d.renk,
    oran: d.toplamKonu ? d.tamamlanan / d.toplamKonu : 0,
  }));
}

export async function mufredatOrani(ogrenciId: string, oturumId?: string): Promise<number> {
  if (!supabaseVar) return demo.MUFREDAT_ORANI;
  const secilen = oturumId ?? (await varsayilanOturumId(ogrenciId));
  if (!secilen) return 0;
  const dersler = await mufredat(secilen, ogrenciId);
  const toplam = dersler.reduce((a, d) => a + d.toplamKonu, 0);
  const tamam = dersler.reduce((a, d) => a + d.tamamlanan, 0);
  return toplam ? tamam / toplam : 0;
}

// ============================================================
// Net Denge
// ============================================================

/**
 * Puan modeli — net katsayıları ve resmî yığınsal dağılım.
 *
 * DB'de o yılın satırı varsa oradan (admin güncelleyebilsin diye), yoksa pakete
 * gömülü gerçek veriden okunur. İkisi de aynı kaynaktan gelir; bkz.
 * `src/data/puanVerisi.ts` ve `0020_gercek_puan_verisi.sql`.
 */
export async function puanModeli(puanTuru: string, yil = PUAN_VERISI_YILI): Promise<PuanModeli | null> {
  const gomulu = gomuluPuanModeli(puanTuru);
  if (!supabaseVar) return gomulu;

  const model = (await supabase!
    .from('puan_modeli')
    .select('yil, puan_turu, ad, sinav_kod, taban_puan, tavan_puan, obp_katsayi, guven, kaynak, kaynak_url')
    .eq('yil', yil)
    .eq('puan_turu', puanTuru)
    .maybeSingle()).data as any;
  if (!model) return gomulu;

  const [katsayilar, dagilim] = await Promise.all([
    supabase!
      .from('puan_katsayilari')
      .select('oturum_kod, ders_ad, katsayi')
      .eq('yil', yil)
      .eq('puan_turu', puanTuru),
    supabase!
      .from('puan_dagilimi')
      .select('obp_dahil, puan, kumulatif_aday')
      .eq('yil', yil)
      .eq('puan_turu', puanTuru)
      .order('puan', { ascending: false }),
  ]);

  const k = (katsayilar.data ?? []) as any[];
  const d = (dagilim.data ?? []) as any[];
  // Katsayı ya da dağılım eksikse hesap sessizce bozulur; gömülü veriye düşüyoruz.
  if (!k.length || !d.length) return gomulu;

  const noktalar = (obpDahil: boolean) =>
    d
      .filter((x) => Boolean(x.obp_dahil) === obpDahil)
      .map((x) => ({ puan: Number(x.puan), kumulatifAday: Number(x.kumulatif_aday) }));

  return {
    yil: Number(model.yil),
    puanTuru: model.puan_turu,
    ad: model.ad,
    sinavKod: model.sinav_kod,
    tabanPuan: Number(model.taban_puan),
    tavanPuan: Number(model.tavan_puan),
    obpKatsayi: Number(model.obp_katsayi),
    guven: model.guven === 'turetilmis' ? 'turetilmis' : 'resmi',
    kaynak: model.kaynak,
    kaynakUrl: model.kaynak_url ?? null,
    katsayilar: k.map((x) => ({
      oturumKod: x.oturum_kod,
      dersAd: x.ders_ad,
      katsayi: Number(x.katsayi),
    })),
    sinavDagilimi: noktalar(false),
    yerlestirmeDagilimi: noktalar(true),
  };
}

/** Hedef satırını `NetHedefi`ye çevirir — dağılım birden çok oturumun dersini taşır. */
function hedefiCevir(hedef: any): NetHedefi {
  return {
    id: hedef.id,
    puanTuru: hedef.puan_turu ?? 'tyt',
    sinavKodu: hedef.exam_sessions?.exams?.kod ?? 'yks',
    tip: hedef.tip,
    hedefPuan: hedef.hedef_puan === null || hedef.hedef_puan === undefined ? null : Number(hedef.hedef_puan),
    hedefSiralama: hedef.hedef_siralama,
    obp: hedef.obp === null || hedef.obp === undefined ? null : Number(hedef.obp),
    dagilim: (hedef.net_allocations ?? [])
      .map((a: any) => {
        const oturum = a.subjects?.exam_sessions;
        return {
          dersId: a.subject_id,
          ad: a.subjects?.ad ?? '—',
          oturumKod: oturum?.kod ?? '',
          oturumAd: oturum?.ad ?? '',
          renk: dersRengi(a.subjects?.ad),
          net: a.net,
          maxNet: a.max_net,
          kilitli: a.locked,
          _sira: (oturum?.sira ?? 0) * 100 + (a.subjects?.sira ?? 0),
        };
      })
      .sort((a: any, b: any) => a._sira - b._sira)
      .map(({ _sira, ...d }: any) => d),
  };
}

const HEDEF_ALANLARI =
  'id, tip, hedef_puan, hedef_siralama, obp, puan_turu, session_id, ' +
  'exam_sessions:session_id (exams:exam_id (kod)), ' +
  'net_allocations (subject_id, net, max_net, locked, ' +
  'subjects:subject_id (ad, sira, exam_sessions:session_id (kod, ad, sira)))';

/**
 * Öğrencinin Net Denge hedefi.
 *
 * Hedef puan türü başına tektir: Sayısal öğrencisinin TYT ve AYT netleri tek
 * hedefte durur, çünkü sıralama ikisinin toplamından çıkar.
 */
export async function netHedefi(ogrenciId: string, puanTuru: string): Promise<NetHedefi | null> {
  // Demo hedefi tek örnek; istenen puan türüyle uyumlu dönmezse ekran onu
  // "başka türün hedefi" sayıp sürekli sıfırlıyordu.
  if (!supabaseVar) return { ...kopya(depo.netHedefi), puanTuru };

  const hedef = kontrol(
    await supabase!
      .from('net_targets')
      .select(HEDEF_ALANLARI)
      .eq('student_id', ogrenciId)
      .eq('puan_turu', puanTuru)
      .eq('guncel', true)
      .limit(1)
      .maybeSingle(),
  ) as any;
  if (!hedef) return null;
  return hedefiCevir(hedef);
}

/**
 * Öğrenciye ilk Net Denge hedefini açar.
 *
 * Dersler, puan türünün beslendiği tüm oturumlardan gelir (Sayısal → TYT +
 * AYT Sayısal). Başlangıç dağılımı da hedeften türetilir; sabit bir orana
 * bölündüğünde ekran ilk açılışta "hedefinin altındasın" diye açılıyordu.
 */
export async function netHedefiOlustur(ogrenciId: string, puanTuru: string): Promise<NetHedefi | null> {
  if (!supabaseVar) return { ...kopya(depo.netHedefi), puanTuru };

  const mevcut = await netHedefi(ogrenciId, puanTuru);
  if (mevcut) return mevcut;

  const model = await puanModeli(puanTuru);
  if (!model) return null;

  const oturumKodlari = PUAN_TURU_OTURUMLARI[puanTuru as PuanTuru] ?? [];
  if (!oturumKodlari.length) return null;

  const oturumSatirlari = kontrol(
    await supabase!.from('exam_sessions').select('id, kod, ad, sira').in('kod', oturumKodlari),
  ) as any[];
  if (!oturumSatirlari.length) return null;

  const dersler = kontrol(
    await supabase!
      .from('subjects')
      .select('id, ad, soru_sayisi, sira, session_id')
      .in(
        'session_id',
        oturumSatirlari.map((o) => o.id),
      )
      .order('sira'),
  ) as any[];
  if (!dersler.length) return null;

  const oturumu = (id: string) => oturumSatirlari.find((o) => o.id === id);

  const dersNetleri: DersNeti[] = dersler.map((d) => ({
    dersId: d.id,
    oturumKod: oturumu(d.session_id)?.kod ?? '',
    dersAd: d.ad,
    net: 0,
    maxNet: d.soru_sayisi ?? 40,
  }));

  const gerekenPuan = siralamadanPuan(VARSAYILAN_HEDEF, model.sinavDagilimi) ?? model.tabanPuan;
  const baslangic = hedefePuanDagit(model, dersNetleri, {}, gerekenPuan);

  // TYT'nin kendi oturum satırı hedefe iliştirilir; sınav kodu oradan okunuyor.
  const anaOturum = oturumSatirlari.find((o) => o.kod === oturumKodlari[oturumKodlari.length - 1]);

  const hedef = kontrol(
    await supabase!
      .from('net_targets')
      .insert({
        student_id: ogrenciId,
        session_id: anaOturum?.id ?? null,
        puan_turu: puanTuru,
        tip: 'siralama',
        hedef_siralama: VARSAYILAN_HEDEF,
        guncel: true,
      })
      .select('id')
      .single(),
  ) as any;

  kontrol(
    await supabase!
      .from('net_allocations')
      .insert(
        dersNetleri.map((d) => ({
          target_id: hedef.id,
          subject_id: d.dersId,
          net: baslangic[d.dersId] ?? 0,
          max_net: d.maxNet,
          locked: false,
        })),
      )
      .select('target_id'),
  );

  return netHedefi(ogrenciId, puanTuru);
}

export async function netHedefiKaydet(hedef: NetHedefi): Promise<void> {
  if (!supabaseVar) {
    depo.netHedefi = { ...hedef, dagilim: hedef.dagilim.map((d) => ({ ...d })) };
    return;
  }
  kontrol(
    await supabase!
      .from('net_targets')
      .update({
        tip: hedef.tip,
        hedef_puan: hedef.hedefPuan,
        hedef_siralama: hedef.hedefSiralama,
        obp: hedef.obp,
        updated_at: new Date().toISOString(),
      })
      .eq('id', hedef.id)
      .select('id'),
  );
  kontrol(
    await supabase!
      .from('net_allocations')
      .upsert(
        hedef.dagilim.map((d) => ({
          target_id: hedef.id,
          subject_id: d.dersId,
          net: d.net,
          max_net: d.maxNet,
          locked: d.kilitli,
        })),
        { onConflict: 'target_id,subject_id' },
      )
      .select('target_id'),
  );
}

// ============================================================
// Görüşmeler ve notlar
// ============================================================

export async function sonrakiGorusme(ogrenciId: string): Promise<Gorusme | null> {
  if (!supabaseVar) {
    const eklenen = demoGorusmeler
      .filter((g) => g.ogrenciId === ogrenciId && g.durum === 'planlandi' && g.baslangic >= new Date().toISOString())
      .sort((a, b) => a.baslangic.localeCompare(b.baslangic))[0];
    return eklenen ?? demo.SONRAKI_GORUSME;
  }

  const satir = kontrol(
    await supabase!
      .from('meetings')
      .select('*, ogrenci:student_id (ad_soyad), koc:coach_id (ad_soyad)')
      .eq('student_id', ogrenciId)
      .eq('durum', 'planlandi')
      .gte('baslangic', new Date().toISOString())
      .order('baslangic')
      .limit(1)
      .maybeSingle(),
  ) as any;
  return satir ? gorusmeyeCevir(satir) : null;
}

export async function gecmisGorusmeler(
  ogrenciId: string,
): Promise<Array<Gorusme & { not?: string; etiketler?: string[] }>> {
  if (!supabaseVar) return demo.GECMIS_GORUSMELER;

  // Saati geçmiş olanlar + koçun "tamamlandı" işaretlediği görüşmeler. Yalnız
  // tarihe bakmak, koç görüşmeyi erken kapattığında kaydı hiçbir listede
  // göstermiyordu.
  const simdi = new Date().toISOString();
  const satirlar = kontrol(
    await supabase!
      .from('meetings')
      .select('*, ogrenci:student_id (ad_soyad), koc:coach_id (ad_soyad), meeting_notes (metin, etiketler)')
      .eq('student_id', ogrenciId)
      .or(`durum.eq.tamamlandi,baslangic.lt.${simdi}`)
      .order('baslangic', { ascending: false })
      .limit(20),
  ) as any[];

  return satirlar.map((s) => ({
    ...gorusmeyeCevir(s),
    not: s.meeting_notes?.[0]?.metin,
    etiketler: s.meeting_notes?.[0]?.etiketler ?? [],
  }));
}

/** Koçun takvimi — yaklaşan tüm görüşmeler. */
export async function kocGorusmeleri(kocId: string): Promise<Gorusme[]> {
  if (!supabaseVar) {
    return [
      ...demo.KOC_OGRENCILERI.filter((o) => o.sonrakiGorusme).map((o) => ({
        ...demo.SONRAKI_GORUSME,
        id: `g-${o.id}`,
        ogrenciId: o.id,
        ogrenciAdi: o.adSoyad,
        baslangic: o.sonrakiGorusme!,
        gundem: [],
      })),
      ...demoGorusmeler.map((g) => ({
        ...g,
        ogrenciAdi: demo.KOC_OGRENCILERI.find((o) => o.id === g.ogrenciId)?.adSoyad ?? g.ogrenciAdi,
      })),
    ];
  }
  const satirlar = kontrol(
    await supabase!
      .from('meetings')
      .select('*, ogrenci:student_id (ad_soyad), koc:coach_id (ad_soyad)')
      .eq('coach_id', kocId)
      .order('baslangic'),
  ) as any[];
  return satirlar.map(gorusmeyeCevir);
}

export interface GorusmeGirdisi {
  baslangic: string; // ISO
  sureDk: number;
  tur: 'goruntulu' | 'yuz_yuze' | 'tanisma';
  gundem?: string[];
  katilimUrl?: string | null;
}

/**
 * Koç: yeni görüşme planlar.
 *
 * Görüşmeler yalnızca okunuyordu; sisteme görüşme girecek bir ekran yoktu, bu
 * yüzden "sonraki görüşme" kartları ve koç takvimi hep boştu.
 */
export async function gorusmePlanla(ogrenciId: string, kocId: string, girdi: GorusmeGirdisi): Promise<void> {
  if (!supabaseVar) {
    demoGorusmeler.unshift({
      ...demo.SONRAKI_GORUSME,
      id: yeniId(),
      ogrenciId,
      kocId,
      baslangic: girdi.baslangic,
      sureDk: girdi.sureDk,
      tur: girdi.tur,
      durum: 'planlandi',
      gundem: girdi.gundem ?? [],
      katilimUrl: girdi.katilimUrl ?? null,
    });
    return;
  }
  kontrol(
    await supabase!
      .from('meetings')
      .insert({
        student_id: ogrenciId,
        coach_id: kocId,
        baslangic: girdi.baslangic,
        sure_dk: girdi.sureDk,
        tur: girdi.tur,
        gundem: girdi.gundem ?? [],
        katilim_url: girdi.katilimUrl || null,
      })
      .select('id'),
  );
}

export async function gorusmeDurumu(gorusmeId: string, durum: Gorusme['durum']): Promise<void> {
  if (!supabaseVar) {
    const g = demoGorusmeler.find((x) => x.id === gorusmeId);
    if (g) g.durum = durum;
    return;
  }
  kontrol(await supabase!.from('meetings').update({ durum }).eq('id', gorusmeId).select('id'));
}

export async function gorusmeSil(gorusmeId: string): Promise<void> {
  if (!supabaseVar) {
    const i = demoGorusmeler.findIndex((x) => x.id === gorusmeId);
    if (i >= 0) demoGorusmeler.splice(i, 1);
    return;
  }
  kontrol(await supabase!.from('meetings').delete().eq('id', gorusmeId).select('id'));
}

/** Demo modunda planlanan görüşmeler (Supabase yokken bellek içi). */
const demoGorusmeler: Gorusme[] = [];

function gorusmeyeCevir(s: any): Gorusme {
  return {
    id: s.id,
    ogrenciId: s.student_id,
    ogrenciAdi: s.ogrenci?.ad_soyad ?? '—',
    kocId: s.coach_id,
    kocAdi: s.koc?.ad_soyad ?? '—',
    baslangic: s.baslangic,
    sureDk: s.sure_dk,
    tur: s.tur,
    durum: s.durum,
    gundem: s.gundem ?? [],
    katilimUrl: s.katilim_url,
  };
}

export async function notlar(ogrenciId: string): Promise<GorusmeNotu[]> {
  if (!supabaseVar) return kopya(depo.notlar.filter((n) => n.ogrenciId === ogrenciId));

  const satirlar = kontrol(
    await supabase!
      .from('meeting_notes')
      .select('id, metin, shared_with_parent, etiketler, created_at, koc:coach_id (ad_soyad)')
      .eq('student_id', ogrenciId)
      .order('created_at', { ascending: false }),
  ) as any[];

  return satirlar.map((s) => ({
    id: s.id,
    ogrenciId,
    kocAdi: s.koc?.ad_soyad ?? '—',
    metin: s.metin,
    veliylePaylasildi: s.shared_with_parent,
    etiketler: s.etiketler ?? [],
    tarih: s.created_at,
  }));
}

/**
 * Görüşme notu ekler.
 *
 * `gorusmeId` verilmezse not hiçbir görüşmeye bağlanmıyordu; öğrencinin "geçmiş
 * görüşmeler" kartları ve velinin "paylaşılan özetler" listesi notu meetings
 * üzerinden okuduğu için hep boş kalıyordu.
 */
export async function notEkle(
  ogrenciId: string,
  kocId: string,
  metin: string,
  veliylePaylas: boolean,
  gorusmeId?: string | null,
): Promise<GorusmeNotu> {
  if (!supabaseVar) {
    const kayit: GorusmeNotu = {
      id: yeniId(),
      ogrenciId,
      kocAdi: demo.KOC.adSoyad,
      metin,
      veliylePaylasildi: veliylePaylas,
      etiketler: [],
      tarih: new Date().toISOString(),
    };
    depo.notlar.unshift(kayit);
    return kayit;
  }

  const satir = kontrol(
    await supabase!
      .from('meeting_notes')
      .insert({
        student_id: ogrenciId,
        coach_id: kocId,
        meeting_id: gorusmeId || null,
        metin,
        shared_with_parent: veliylePaylas,
      })
      .select('id, created_at')
      .single(),
  ) as any;

  return {
    id: satir.id,
    ogrenciId,
    kocAdi: '',
    metin,
    veliylePaylasildi: veliylePaylas,
    etiketler: [],
    tarih: satir.created_at,
  };
}

/** Veliye açılmış en son rapor — yalnızca shared_with_parent=true olanlar. */
export async function veliRaporu(
  ogrenciId: string,
): Promise<{ metin: string; tarih: string; kocAdi: string } | null> {
  if (!supabaseVar) {
    return demo.VELI_RAPORU.paylasildi
      ? { metin: demo.VELI_RAPORU.metin, tarih: demo.VELI_RAPORU.tarih, kocAdi: demo.VELI_RAPORU.kocAdi }
      : null;
  }
  const satir = kontrol(
    await supabase!
      .from('meeting_notes')
      .select('metin, created_at, koc:coach_id (ad_soyad)')
      .eq('student_id', ogrenciId)
      .eq('shared_with_parent', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ) as any;
  return satir ? { metin: satir.metin, tarih: satir.created_at, kocAdi: satir.koc?.ad_soyad ?? '—' } : null;
}

// ============================================================
// Veli → koç mesajı
// ============================================================

const demoMesajlar: Array<{ id: string; metin: string; tarih: string; veliAdi: string }> = [];

export async function veliMesajGonder(
  veliId: string,
  ogrenciId: string,
  kocId: string | null,
  metin: string,
): Promise<void> {
  if (!supabaseVar) {
    demoMesajlar.unshift({ id: yeniId(), metin, tarih: new Date().toISOString(), veliAdi: demo.VELI.adSoyad });
    return;
  }
  kontrol(
    await supabase!
      .from('parent_messages')
      .insert({ parent_id: veliId, student_id: ogrenciId, coach_id: kocId, metin })
      .select('id'),
  );
}

export async function veliMesajlari(
  kimlik: { veliId?: string; kocId?: string },
): Promise<Array<{ id: string; metin: string; tarih: string; veliAdi: string }>> {
  if (!supabaseVar) return kopya(demoMesajlar);

  let sorgu = supabase!
    .from('parent_messages')
    .select('id, metin, created_at, veli:parent_id (ad_soyad)')
    .order('created_at', { ascending: false });
  if (kimlik.veliId) sorgu = sorgu.eq('parent_id', kimlik.veliId);
  if (kimlik.kocId) sorgu = sorgu.eq('coach_id', kimlik.kocId);

  const satirlar = kontrol(await sorgu) as any[];
  return satirlar.map((s) => ({
    id: s.id,
    metin: s.metin,
    tarih: s.created_at,
    veliAdi: s.veli?.ad_soyad ?? '—',
  }));
}

// ============================================================
// Admin
// ============================================================

/**
 * Yalnızca gerçek öğrencilerin kimlikleri.
 *
 * `yeni_kullanici` tetikleyicisi her auth kullanıcısına 'ogrenci' rolü veriyor;
 * koç, veli ve admin hesapları da bu rolü taşıdığı için öğrenci listesine ve
 * "aktif öğrenci" sayacına düşüyorlardı.
 */
async function ogrenciKimlikleri(): Promise<Set<string>> {
  const satirlar = kontrol(await supabase!.from('user_roles').select('user_id, rol')) as Array<{
    user_id: string;
    rol: Rol;
  }>;
  const harita = new Map<string, Set<Rol>>();
  for (const s of satirlar) {
    const kume = harita.get(s.user_id) ?? new Set<Rol>();
    kume.add(s.rol);
    harita.set(s.user_id, kume);
  }
  const sonuc = new Set<string>();
  for (const [id, roller] of harita) {
    if (roller.has('ogrenci') && !roller.has('koc') && !roller.has('veli') && !roller.has('admin')) sonuc.add(id);
  }
  return sonuc;
}

export async function adminMetrikleri(): Promise<typeof demo.ADMIN_METRIKLERI> {
  if (!supabaseVar) return demo.ADMIN_METRIKLERI;

  const haftaOnce = new Date(Date.now() - 7 * 86400000).toISOString();
  const ayBasi = new Date();
  ayBasi.setDate(1);

  const [ogrenciIdler, ogrenciler, koclar, gorusmeler, iptaller] = await Promise.all([
    ogrenciKimlikleri(),
    supabase!.from('profiles').select('id, created_at').eq('aktif', true),
    supabase!
      .from('profiles')
      .select('id, user_roles!inner(rol)', { count: 'exact', head: true })
      .eq('user_roles.rol', 'koc')
      .eq('aktif', true),
    supabase!.from('meetings').select('id', { count: 'exact', head: true }).gte('baslangic', haftaOnce),
    supabase!
      .from('meetings')
      .select('id', { count: 'exact', head: true })
      .gte('baslangic', haftaOnce)
      .eq('durum', 'iptal'),
  ]);

  const aktifOgrenciler = ((ogrenciler.data ?? []) as any[]).filter((o) => ogrenciIdler.has(o.id));
  const ogrenciSayisi = aktifOgrenciler.length;
  const kocSayisi = koclar.count ?? 0;
  const buAy = aktifOgrenciler.filter((o) => new Date(o.created_at) >= ayBasi).length;

  const planlar = kontrol(
    await supabase!.from('weekly_plans').select('hafta_baslangic, plan_items (tamamlandi)').limit(500),
  ) as any[];
  const oranlar = planlar.map((p) => planOrani(p.plan_items ?? [])).filter((o) => o > 0);

  // "+N puan" rozeti sabit 0 dönüyordu, yani hiç görünmüyordu; bu hafta ile
  // geçen haftanın ortalama plan tamamlaması arasındaki farkı hesaplıyoruz.
  const ortalama = (hafta: string) => {
    const kume = planlar.filter((p) => p.hafta_baslangic === hafta).map((p) => planOrani(p.plan_items ?? []));
    return kume.length ? kume.reduce((a, b) => a + b, 0) / kume.length : null;
  };
  const buHafta = ortalama(haftaBasi());
  const gecenHafta = ortalama(haftaKaydir(haftaBasi(), -1));

  return {
    aktifOgrenci: ogrenciSayisi,
    ogrenciArtisi: buAy,
    kocSayisi,
    kocBasinaOgrenci: kocSayisi ? Number((ogrenciSayisi / kocSayisi).toFixed(1)) : 0,
    haftalikGorusme: gorusmeler.count ?? 0,
    iptal: iptaller.count ?? 0,
    planTamamlama: oranlar.length ? oranlar.reduce((a, b) => a + b, 0) / oranlar.length : 0,
    planTamamlamaArtisi:
      buHafta !== null && gecenHafta !== null ? Math.round((buHafta - gecenHafta) * 100) : 0,
  };
}

export async function ogrenciBuyumesi(): Promise<Array<{ ay: string; sayi: number }>> {
  if (!supabaseVar) return demo.OGRENCI_BUYUMESI;

  const [ogrenciIdler, tumu] = await Promise.all([
    ogrenciKimlikleri(),
    supabase!.from('profiles').select('id, created_at').order('created_at'),
  ]);
  const satirlar = ((tumu.data ?? []) as any[]).filter((s) => ogrenciIdler.has(s.id));

  const sonuc: Array<{ ay: string; sayi: number }> = [];
  const simdi = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(simdi.getFullYear(), simdi.getMonth() - i + 1, 1);
    sonuc.push({
      ay: new Intl.DateTimeFormat('tr-TR', { month: 'short' }).format(
        new Date(simdi.getFullYear(), simdi.getMonth() - i, 1),
      ),
      sayi: satirlar.filter((s) => new Date(s.created_at) < d).length,
    });
  }
  return sonuc;
}

export async function aktiviteler(): Promise<Aktivite[]> {
  if (!supabaseVar) return demo.AKTIVITELER;
  const satirlar = kontrol(
    await supabase!.from('activities').select('id, tur, metin, created_at').order('created_at', { ascending: false }).limit(10),
  ) as any[];
  return satirlar.map((s) => ({
    id: s.id,
    tur: s.tur,
    metin: s.metin,
    zaman: new Intl.RelativeTimeFormat('tr-TR', { numeric: 'auto' }).format(
      -Math.round((Date.now() - new Date(s.created_at).getTime()) / 3600000),
      'hour',
    ),
  }));
}

export async function koclar(): Promise<KocOzeti[]> {
  if (!supabaseVar) return demo.KOCLAR;

  const profiller = kontrol(
    await supabase!
      .from('profiles')
      .select('id, ad_soyad, eposta, telefon, avatar_rengi, avatar_url, user_roles!inner(rol)')
      .eq('user_roles.rol', 'koc')
      .eq('aktif', true)
      .order('ad_soyad'),
  ) as any[];

  const haftaOnce = new Date(Date.now() - 7 * 86400000).toISOString();
  const [baglar, planlar, gorusmeler] = await Promise.all([
    supabase!.from('coach_students').select('coach_id, student_id').eq('aktif', true),
    supabase!.from('weekly_plans').select('coach_id, plan_items (tamamlandi)'),
    supabase!.from('meetings').select('coach_id').gte('baslangic', haftaOnce),
  ]);

  // Net değişimi sütunu sabit 0 dönüyordu; öğrencilerin ilk↔son deneme farkının
  // ortalamasıyla dolduruyoruz.
  const ogrenciIdler = ((baglar.data ?? []) as any[]).map((b) => b.student_id);
  const denemeler = ogrenciIdler.length
    ? ((
        await supabase!
          .from('mock_exams')
          .select('student_id, net, tarih')
          .in('student_id', ogrenciIdler)
          .order('tarih', { ascending: true })
      ).data ?? [])
    : [];

  const ogrenciDegisimi = new Map<string, number>();
  for (const id of new Set(ogrenciIdler)) {
    const netler = (denemeler as any[]).filter((d) => d.student_id === id).map((d) => Number(d.net));
    if (netler.length > 1) ogrenciDegisimi.set(id, netler[netler.length - 1] - netler[0]);
  }

  return profiller.map((p) => {
    const kendiOgrencileri = ((baglar.data ?? []) as any[]).filter((b) => b.coach_id === p.id);
    const oranlar = ((planlar.data ?? []) as any[])
      .filter((x) => x.coach_id === p.id)
      .map((x) => planOrani(x.plan_items ?? []));
    const tamamlama = oranlar.length ? oranlar.reduce((a, b) => a + b, 0) / oranlar.length : 0;
    const degisimler = kendiOgrencileri
      .map((b) => ogrenciDegisimi.get(b.student_id))
      .filter((d): d is number => d !== undefined);

    return {
      id: p.id,
      adSoyad: p.ad_soyad,
      eposta: p.eposta,
      telefon: p.telefon,
      avatarRengi: p.avatar_rengi ?? 'var(--color-primary-soft-2)',
      avatarUrl: p.avatar_url,
      ogrenciSayisi: kendiOgrencileri.length,
      planTamamlama: tamamlama,
      haftalikGorusme: ((gorusmeler.data ?? []) as any[]).filter((g) => g.coach_id === p.id).length,
      netDegisimi: degisimler.length
        ? Number((degisimler.reduce((a, b) => a + b, 0) / degisimler.length).toFixed(1))
        : 0,
      durum: tamamlama >= 0.75 ? 'cokIyi' : tamamlama >= 0.6 ? 'iyi' : 'takipte',
    };
  });
}

export interface YeniKoc {
  adSoyad: string;
  eposta: string;
  sifre: string;
  telefon?: string;
  avatarRengi?: string;
}

/**
 * Koç hesabı açar (yalnız admin).
 *
 * Eskiden yalnızca e-posta isteniyor ve mevcut bir hesaba koç rolü atanıyordu —
 * ama sitede kayıt formu olmadığı için o hesabın hiç oluşmuyordu, yani koç
 * eklemek pratikte imkânsızdı. Artık hesap burada açılıyor.
 */
export async function kocEkle(girdi: YeniKoc): Promise<{ kocId: string }> {
  if (!supabaseVar) {
    throw new Error('Demo modunda koç eklenemez. Önce Supabase bağlantısını tanımlaman gerekiyor.');
  }
  const data = await islevCagir<{ kocId: string }>('koc-ekle', girdi);
  return { kocId: data.kocId };
}

/** Öğrencinin koçunu değiştirir; `kocId` null ise bağ kaldırılır. */
export async function kocAta(ogrenciId: string, kocId: string | null): Promise<void> {
  if (!supabaseVar) return;

  kontrol(
    await supabase!.from('coach_students').update({ aktif: false }).eq('student_id', ogrenciId).select('student_id'),
  );
  if (!kocId) return;

  kontrol(
    await supabase!
      .from('coach_students')
      .upsert({ coach_id: kocId, student_id: ogrenciId, aktif: true }, { onConflict: 'coach_id,student_id' })
      .select('student_id'),
  );

  // Yeni koçun yazışma kanalları hazır gelsin: öğrenci ve varsa velileri.
  const veliBaglari = kontrol(
    await supabase!.from('parent_students').select('parent_id').eq('student_id', ogrenciId),
  ) as Array<{ parent_id: string }>;

  const kanallar = [
    { koc_id: kocId, kisi_id: ogrenciId, ogrenci_id: ogrenciId, tur: 'ogrenci' },
    ...veliBaglari.map((v) => ({
      koc_id: kocId,
      kisi_id: v.parent_id,
      ogrenci_id: ogrenciId,
      tur: 'veli',
    })),
  ];
  await supabase!.from('conversations').upsert(kanallar, { onConflict: 'koc_id,kisi_id' });
}

export interface VeliOzeti {
  id: string;
  adSoyad: string;
  eposta: string | null;
  telefon: string | null;
  avatarUrl: string | null;
  ogrenciId: string;
  ogrenciAdi: string;
  detaySeviyesi: 'ozet' | 'tam';
}

/**
 * Veli listesi (admin).
 *
 * Admin panelinde velilere ulaşacak hiçbir ekran yoktu; iletişim bilgileri
 * yalnızca veritabanında duruyordu.
 */
export async function veliler(ogrenciId?: string): Promise<VeliOzeti[]> {
  if (!supabaseVar) return [];

  let sorgu = supabase!
    .from('parent_students')
    .select(
      'parent_id, student_id, detay_seviyesi, veli:parent_id (ad_soyad, eposta, telefon, avatar_url), ogrenci:student_id (ad_soyad)',
    );
  if (ogrenciId) sorgu = sorgu.eq('student_id', ogrenciId);

  const satirlar = kontrol(await sorgu) as any[];
  return satirlar
    .map((v) => ({
      id: v.parent_id,
      adSoyad: v.veli?.ad_soyad ?? '—',
      eposta: v.veli?.eposta ?? null,
      telefon: v.veli?.telefon ?? null,
      avatarUrl: v.veli?.avatar_url ?? null,
      ogrenciId: v.student_id,
      ogrenciAdi: v.ogrenci?.ad_soyad ?? '—',
      detaySeviyesi: (v.detay_seviyesi ?? 'ozet') as 'ozet' | 'tam',
    }))
    .sort((a, b) => a.adSoyad.localeCompare(b.adSoyad, 'tr-TR'));
}

/** Velinin görebileceği detay seviyesini değiştirir (admin/koç). */
export async function veliDetaySeviyesi(
  veliId: string,
  ogrenciId: string,
  seviye: 'ozet' | 'tam',
): Promise<void> {
  if (!supabaseVar) return;
  kontrol(
    await supabase!
      .from('parent_students')
      .update({ detay_seviyesi: seviye })
      .eq('parent_id', veliId)
      .eq('student_id', ogrenciId)
      .select('parent_id'),
  );
}

/** Öğrencinin aktif koçu (yoksa null). */
export async function ogrenciKocu(ogrenciId: string): Promise<{ id: string; adSoyad: string } | null> {
  if (!supabaseVar) return { id: demo.KOC.id, adSoyad: demo.KOC.adSoyad };
  const bag = kontrol(
    await supabase!
      .from('coach_students')
      .select('coach_id, profiles:coach_id (ad_soyad)')
      .eq('student_id', ogrenciId)
      .eq('aktif', true)
      .limit(1)
      .maybeSingle(),
  ) as any;
  return bag ? { id: bag.coach_id, adSoyad: bag.profiles?.ad_soyad ?? '—' } : null;
}

/**
 * Hesabı kalıcı olarak siler (yalnız admin).
 *
 * Silme cascade ile yayıldığı için geri dönüşü yok; kısıtlar `kullanici-sil`
 * Edge Function'ında (kendini silme, son admin, öğrencisi olan koç).
 */
export async function kullaniciSil(kisiId: string): Promise<void> {
  if (!supabaseVar) throw new Error('Demo modunda hesap silinemez. Önce Supabase bağlantısını tanımlaman gerekiyor.');
  await islevCagir('kullanici-sil', { kisiId });
}

/**
 * Profil fotoğrafı yükler ve profile bağlar.
 *
 * Dosya `avatarlar/<kisiId>/avatar.<uzanti>` yoluna yazılır; Storage politikası
 * yalnız kişinin kendi klasörüne yazmasına izin verir. Adresin sonuna sürüm
 * eklenir, yoksa tarayıcı eski fotoğrafı önbellekten gösteriyor.
 */
export async function avatarYukle(kisiId: string, dosya: File): Promise<string> {
  if (!supabaseVar) throw new Error('Demo modunda fotoğraf yüklenemez.');

  const uzanti = dosya.type === 'image/png' ? 'png' : dosya.type === 'image/webp' ? 'webp' : 'jpg';
  const yol = `${kisiId}/avatar.${uzanti}`;

  const { error: yuklemeHatasi } = await supabase!.storage
    .from('avatarlar')
    .upload(yol, dosya, { upsert: true, contentType: dosya.type, cacheControl: '3600' });
  if (yuklemeHatasi) throw new Error(yuklemeHatasi.message);

  const { data } = supabase!.storage.from('avatarlar').getPublicUrl(yol);
  const adres = `${data.publicUrl}?v=${Date.now()}`;

  kontrol(await supabase!.from('profiles').update({ avatar_url: adres }).eq('id', kisiId).select('id'));
  return adres;
}

/** Profil fotoğrafını kaldırır. */
export async function avatarKaldir(kisiId: string): Promise<void> {
  if (!supabaseVar) return;
  await supabase!.storage
    .from('avatarlar')
    .remove([`${kisiId}/avatar.jpg`, `${kisiId}/avatar.png`, `${kisiId}/avatar.webp`]);
  kontrol(await supabase!.from('profiles').update({ avatar_url: null }).eq('id', kisiId).select('id'));
}

/**
 * Aktivite akışını temizler (yalnız admin).
 *
 * Akış sürekli birikiyordu ve temizlemenin bir yolu yoktu.
 */
export async function aktiviteleriTemizle(): Promise<void> {
  if (!supabaseVar) {
    demo.AKTIVITELER.length = 0;
    return;
  }
  kontrol(await supabase!.from('activities').delete().not('id', 'is', null).select('id'));
}

/**
 * Kişinin kendi şifresini değiştirmesi.
 *
 * Oturum açmış kullanıcı için Supabase doğrudan destekliyor; admin araya
 * girmeden herkes kendi şifresini güncelleyebilsin.
 */
export async function kendiSifreniDegistir(yeniSifre: string): Promise<void> {
  if (!supabaseVar) throw new Error('Demo modunda şifre değiştirilemez.');
  if (yeniSifre.length < 8) throw new Error('Şifre en az 8 karakter olmalı.');

  const { error } = await supabase!.auth.updateUser({ password: yeniSifre });
  if (error) {
    if (/should be different|same as the old/i.test(error.message)) {
      throw new Error('Yeni şifre eskisiyle aynı olamaz.');
    }
    if (/reauthentication|recent login/i.test(error.message)) {
      throw new Error('Güvenlik için yeniden giriş yapman gerekiyor.');
    }
    throw new Error(error.message);
  }
}

/**
 * Hesaba yeni şifre üretir ve bir kez döner (yalnız admin).
 *
 * Mevcut şifre gösterilemez — Supabase şifreleri hash'li saklıyor. Kullanıcıya
 * giriş bilgisini yeniden iletmek gerektiğinde tek yol yeni şifre atamak.
 */
export async function sifreYenile(kisiId: string): Promise<{ eposta: string | null; sifre: string }> {
  if (!supabaseVar) throw new Error('Demo modunda şifre yenilenemez.');
  return islevCagir<{ eposta: string | null; sifre: string }>('sifre-yenile', { kisiId });
}

/** Kişi kartındaki düzenlenebilir alanlar (admin). */
export interface ProfilGuncelleme {
  adSoyad?: string;
  telefon?: string | null;
  sinif?: string | null;
  hedefAlan?: string | null;
  hedef?: string | null;
  aktif?: boolean;
}

export async function profilGuncelle(kisiId: string, degisim: ProfilGuncelleme): Promise<void> {
  if (!supabaseVar) return;
  const satir: Record<string, unknown> = {};
  if (degisim.adSoyad !== undefined) satir.ad_soyad = degisim.adSoyad;
  if (degisim.telefon !== undefined) satir.telefon = degisim.telefon || null;
  if (degisim.sinif !== undefined) satir.sinif = degisim.sinif || null;
  if (degisim.hedefAlan !== undefined) satir.hedef_alan = degisim.hedefAlan || null;
  if (degisim.hedef !== undefined) satir.hedef = degisim.hedef || null;
  if (degisim.aktif !== undefined) satir.aktif = degisim.aktif;
  if (!Object.keys(satir).length) return;

  kontrol(await supabase!.from('profiles').update(satir).eq('id', kisiId).select('id'));
}

/** Tek kişinin profili (admin detay ekranları). */
export async function profil(kisiId: string): Promise<(Profil & { telefon?: string | null; aktif: boolean }) | null> {
  if (!supabaseVar) return null;
  const satir = kontrol(
    await supabase!
      .from('profiles')
      .select('id, ad_soyad, eposta, telefon, sinif, hedef_alan, hedef, avatar_rengi, avatar_url, aktif, user_roles (rol)')
      .eq('id', kisiId)
      .maybeSingle(),
  ) as any;
  if (!satir) return null;
  return {
    id: satir.id,
    rol: enYetkiliRol(satir.user_roles as Array<{ rol: Rol }>),
    adSoyad: satir.ad_soyad,
    eposta: satir.eposta,
    telefon: satir.telefon,
    sinif: satir.sinif,
    hedefAlan: satir.hedef_alan,
    hedef: satir.hedef,
    avatarRengi: satir.avatar_rengi,
    avatarUrl: satir.avatar_url,
    aktif: satir.aktif,
  };
}

/** Edge Function hata gövdesindeki Türkçe mesajı çıkarır. */
async function islevHatasi(error: { message: string; context?: Response }): Promise<string> {
  const yanit = error.context;
  if (yanit && typeof yanit.json === 'function') {
    try {
      const govde = await yanit.json();
      if (govde?.hata) {
        // Jeton bayatladıysa fonksiyon "Oturum geçersiz." diyor; kullanıcıya ne
        // yapacağını söyleyen bir mesaja çeviriyoruz.
        if (/oturum (geçersiz|bulunamadı)/i.test(govde.hata)) return OTURUM_BAYAT;
        return govde.hata;
      }
    } catch {
      /* gövde okunamadı — özgün mesajla devam */
    }
  }
  return error.message;
}

export const OTURUM_BAYAT =
  'Oturumun zaman aşımına uğramış. Çıkış yapıp yeniden giriş yaptığında işlemi tekrarlayabilirsin.';

/**
 * Edge Function çağrısı — her seferinde taze erişim jetonuyla.
 *
 * `functions.invoke` bellekteki jetonu olduğu gibi gönderiyor. Sekme uzun süre
 * açık kaldığında jetonun süresi doluyor ve fonksiyon "Oturum geçersiz." ile
 * 401 dönüyordu: koç/öğrenci ekleme ve hesap silme bu yüzden çalışmıyordu.
 * Çağrıdan önce oturumu tazeleyip jetonu açıkça iletiyoruz.
 */
async function islevCagir<T>(ad: string, govde: object): Promise<T> {
  const { data: mevcut } = await supabase!.auth.getSession();
  let oturum = mevcut.session;

  // Süresi dolmuş ya da bir dakika içinde dolacaksa yenile.
  const kalanSn = oturum?.expires_at ? oturum.expires_at - Math.floor(Date.now() / 1000) : 0;
  if (oturum && kalanSn < 60) {
    const { data: yeni } = await supabase!.auth.refreshSession();
    oturum = yeni.session ?? oturum;
  }
  if (!oturum) throw new Error(OTURUM_BAYAT);

  const { data, error } = await supabase!.functions.invoke(ad, {
    body: govde as Record<string, unknown>,
    headers: { Authorization: `Bearer ${oturum.access_token}` },
  });
  if (error) throw new Error(await islevHatasi(error));
  if ((data as { hata?: string })?.hata) throw new Error((data as { hata: string }).hata);
  return data as T;
}

export interface YeniOgrenci {
  adSoyad: string;
  eposta: string;
  sifre: string;
  telefon?: string;
  sinif?: string;
  hedefAlan?: string;
  hedef?: string;
  avatarRengi?: string;
  kocId?: string;
  veli?: { adSoyad: string; eposta: string; sifre: string; detaySeviyesi?: 'ozet' | 'tam' };
}

/**
 * Öğrenci hesabı açar (yalnız admin).
 * Kullanıcı oluşturmak service_role gerektirir; iş `ogrenci-ekle` Edge
 * Function'ında yapılır, orada çağıranın admin olduğu ayrıca doğrulanır.
 */
export async function ogrenciEkle(girdi: YeniOgrenci): Promise<{ ogrenciId: string; veliId: string | null }> {
  if (!supabaseVar) {
    throw new Error('Demo modunda öğrenci eklenemez. Önce Supabase bağlantısını tanımlaman gerekiyor.');
  }

  const data = await islevCagir<{ ogrenciId: string; veliId: string | null }>('ogrenci-ekle', girdi);
  return { ogrenciId: data.ogrenciId, veliId: data.veliId ?? null };
}

/**
 * Tüm öğrenciler (admin listesi).
 *
 * Plan oranı / son net / durum sütunları sabit değer dönüyordu, yani admin
 * tablosundaki üç sütun da uydurmaydı. Artık koç listesindeki hesabın aynısı
 * kullanılıyor.
 */
export async function tumOgrenciler(): Promise<OgrenciOzeti[]> {
  if (!supabaseVar) return demo.KOC_OGRENCILERI;

  const [ogrenciIdler, tumu] = await Promise.all([
    ogrenciKimlikleri(),
    supabase!.from('profiles').select('id, ad_soyad, sinif, hedef_alan, avatar_rengi, avatar_url, aktif').order('ad_soyad'),
  ]);
  const profiller = ((tumu.data ?? []) as any[]).filter((p) => ogrenciIdler.has(p.id));

  const idler = profiller.map((p) => p.id);
  if (!idler.length) return [];

  const [denemeler, planlar, gorusmeler, baglar] = await Promise.all([
    supabase!.from('mock_exams').select('student_id, net, tarih').in('student_id', idler).order('tarih'),
    supabase!
      .from('weekly_plans')
      .select('student_id, plan_items (tamamlandi)')
      .in('student_id', idler)
      .order('hafta_baslangic', { ascending: false }),
    supabase!
      .from('meetings')
      .select('student_id, baslangic')
      .in('student_id', idler)
      .eq('durum', 'planlandi')
      .gte('baslangic', new Date().toISOString())
      .order('baslangic'),
    supabase!
      .from('coach_students')
      .select('student_id, profiles:coach_id (ad_soyad)')
      .in('student_id', idler)
      .eq('aktif', true),
  ]);

  return profiller.map((p) => {
    const netler = ((denemeler.data ?? []) as any[])
      .filter((d) => d.student_id === p.id)
      .map((d) => Number(d.net));
    const plan = ((planlar.data ?? []) as any[]).find((x) => x.student_id === p.id);
    const oran = plan ? planOrani(plan.plan_items ?? []) : 0;
    const sonNet = netler.length ? netler[netler.length - 1] : null;
    const oncekiNet = netler.length > 1 ? netler[netler.length - 2] : null;

    let durum: OgrenciOzeti['durum'] = 'yolunda';
    if (!netler.length && oran < 0.2) durum = 'yeni';
    else if (oran < 0.2 || (oncekiNet !== null && sonNet !== null && sonNet < oncekiNet - 2)) durum = 'riskli';
    else if (oran < 0.5) durum = 'gecikti';

    return {
      id: p.id,
      adSoyad: p.ad_soyad,
      avatarRengi: p.avatar_rengi ?? dersRengi(p.hedef_alan),
      avatarUrl: p.avatar_url,
      sinav: p.hedef_alan ?? '—',
      sinif: p.sinif,
      aktif: p.aktif !== false,
      kocAdi: ((baglar.data ?? []) as any[]).find((b) => b.student_id === p.id)?.profiles?.ad_soyad ?? null,
      planOrani: oran,
      netTrendi: netler.slice(-6),
      sonNet,
      sonrakiGorusme: ((gorusmeler.data ?? []) as any[]).find((g) => g.student_id === p.id)?.baslangic ?? null,
      durum,
    };
  });
}

// ============================================================
// Koç ödemeleri
// ============================================================

export async function odemeler(kocId?: string): Promise<KocOdemesi[]> {
  if (!supabaseVar) return kopya(kocId ? demo.ODEMELER.filter((o) => o.kocId === kocId) : demo.ODEMELER);

  let sorgu = supabase!
    .from('coach_payments')
    .select('id, coach_id, donem, ogrenci_sayisi, gorusme_sayisi, tutar, durum, odenme_tarihi, koc:coach_id (ad_soyad)')
    .order('donem', { ascending: false });
  if (kocId) sorgu = sorgu.eq('coach_id', kocId);

  const satirlar = kontrol(await sorgu) as any[];
  return satirlar.map((s) => ({
    id: s.id,
    kocId: s.coach_id,
    kocAdi: s.koc?.ad_soyad ?? '—',
    donem: s.donem,
    ogrenciSayisi: s.ogrenci_sayisi,
    gorusmeSayisi: s.gorusme_sayisi,
    tutar: Number(s.tutar),
    durum: s.durum,
    odenmeTarihi: s.odenme_tarihi,
  }));
}

/**
 * Bir dönemin koç hakedişlerini üretir (yalnız admin).
 *
 * `coach_payments` tablosuna hiçbir yerden satır yazılmıyordu; iki ödeme ekranı
 * da üretimde kalıcı olarak boştu. Hakediş, dönem içinde tamamlanmış görüşme
 * sayısı × görüşme ücreti olarak hesaplanır ve yeniden çalıştırıldığında aynı
 * dönemi günceller (ödenmiş kayıtlara dokunmaz).
 */
export async function hakedisOlustur(
  donem: string,
  gorusmeUcreti: number,
): Promise<{ olusan: number; atlanan: number }> {
  if (!supabaseVar) throw new Error('Demo modunda hakediş üretilemez. Önce Supabase bağlantısını tanımlaman gerekiyor.');

  const ayBasi = new Date(`${donem}T00:00:00`);
  const aySonu = new Date(ayBasi.getFullYear(), ayBasi.getMonth() + 1, 1);

  const kocListesi = await koclar();
  if (!kocListesi.length) return { olusan: 0, atlanan: 0 };

  const [gorusmeler, mevcutlar] = await Promise.all([
    supabase!
      .from('meetings')
      .select('coach_id, student_id')
      .eq('durum', 'tamamlandi')
      .gte('baslangic', ayBasi.toISOString())
      .lt('baslangic', aySonu.toISOString()),
    supabase!.from('coach_payments').select('coach_id, durum').eq('donem', donem),
  ]);

  const odenmis = new Set(
    ((mevcutlar.data ?? []) as any[]).filter((o) => o.durum === 'odendi').map((o) => o.coach_id),
  );

  const satirlar = kocListesi
    .filter((k) => !odenmis.has(k.id))
    .map((k) => {
      const kendi = ((gorusmeler.data ?? []) as any[]).filter((g) => g.coach_id === k.id);
      return {
        coach_id: k.id,
        donem,
        ogrenci_sayisi: new Set(kendi.map((g) => g.student_id)).size,
        gorusme_sayisi: kendi.length,
        tutar: kendi.length * gorusmeUcreti,
        durum: 'bekliyor',
      };
    });

  if (satirlar.length) {
    kontrol(await supabase!.from('coach_payments').upsert(satirlar, { onConflict: 'coach_id,donem' }).select('id'));
  }

  return { olusan: satirlar.length, atlanan: odenmis.size };
}

export async function odemeIsaretle(odemeId: string, durum: 'bekliyor' | 'odendi'): Promise<void> {
  if (!supabaseVar) {
    const o = demo.ODEMELER.find((x) => x.id === odemeId);
    if (o) {
      o.durum = durum;
      o.odenmeTarihi = durum === 'odendi' ? new Date().toISOString().slice(0, 10) : null;
    }
    return;
  }
  kontrol(
    await supabase!
      .from('coach_payments')
      .update({
        durum,
        odenme_tarihi: durum === 'odendi' ? new Date().toISOString().slice(0, 10) : null,
      })
      .eq('id', odemeId)
      .select('id'),
  );
}

// ============================================================
// Blog
// ============================================================

export async function yazilar(): Promise<Yazi[]> {
  if (!supabaseVar) return demo.YAZILAR;

  const satirlar = kontrol(
    await supabase!
      .from('posts')
      .select('id, slug, baslik, ozet, kategori, kapak_url, okuma_dk, yazar_adi, yazar_unvani, one_cikan, yayin_tarihi')
      .eq('yayinda', true)
      .order('yayin_tarihi', { ascending: false }),
  ) as any[];

  return satirlar.map(yaziyaCevir);
}

export async function yazi(slug: string): Promise<Yazi | null> {
  if (!supabaseVar) return demo.YAZILAR.find((y) => y.slug === slug) ?? null;

  const satir = kontrol(
    await supabase!.from('posts').select('*').eq('slug', slug).eq('yayinda', true).maybeSingle(),
  ) as any;
  return satir ? yaziyaCevir(satir) : null;
}

function yaziyaCevir(s: any): Yazi {
  return {
    id: s.id,
    slug: s.slug,
    baslik: s.baslik,
    ozet: s.ozet ?? '',
    kategori: s.kategori ?? '',
    okumaDk: s.okuma_dk,
    yazarAdi: s.yazar_adi ?? '',
    yazarUnvani: s.yazar_unvani ?? '',
    yayinTarihi: s.yayin_tarihi,
    oneCikan: s.one_cikan,
    kapakUrl: s.kapak_url,
    icerik: s.icerik,
  };
}

// ============================================================
// Başvuru
// ============================================================

/** Başvuruyu e-postadaki gibi okunur alan adlarına çevirir. */
function basvuruOzeti(b: Basvuru): Record<string, string> {
  const adSoyad = `${b.ad} ${b.soyad}`.trim();
  const ozet: Record<string, string> = {
    'Ad Soyad': adSoyad,
    Telefon: telefonGoster(b.telefon),
    'E-posta': b.eposta || '—',
    Sınıf: basvuruEtiketi(BASVURU_SINIFLARI, b.sinif),
  };
  // Alan yalnız 11/12/mezun'a sorulur; sorulmadıysa satırı hiç koymuyoruz.
  if (b.alan) ozet['Alan'] = basvuruEtiketi(BASVURU_ALANLARI, b.alan);
  ozet['Program'] = basvuruEtiketi(BASVURU_PROGRAMLARI, b.program);
  ozet['Paket'] = basvuruEtiketi(basvuruPaketSecenekleri(), b.paket);
  if (b.veliOnayi !== undefined) ozet['Veli onayı'] = b.veliOnayi ? 'Verildi' : 'Alınmadı';
  if (b.not) ozet['Not'] = b.not;
  return ozet;
}

/**
 * Başvuruyu admin'in gerçek e-posta adresine ileten form servisine gönderir.
 *
 * Adres Formspree tarafında kayıtlı; burada yalnız uç nokta biliniyor.
 * `email` alanı servisin "yanıtla" adresi olarak kullandığı özel alan.
 */
async function basvuruBildir(basvuru: Basvuru): Promise<void> {
  const adSoyad = `${basvuru.ad} ${basvuru.soyad}`.trim();
  const yanit = await fetch(BASVURU_FORM_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({
      _subject: `Yeni başvuru — ${adSoyad} (${basvuruEtiketi(BASVURU_SINIFLARI, basvuru.sinif)})`,
      email: basvuru.eposta || undefined,
      // Formspree'nin bot tuzağı alanı — dolu gelirse gönderim sessizce elenir.
      _gotcha: basvuru.tuzak || undefined,
      ...basvuruOzeti(basvuru),
    }),
  });

  if (!yanit.ok) {
    const govde = await yanit.json().catch(() => null);
    const ilk = govde?.errors?.[0]?.message as string | undefined;
    throw new Error(ilk ?? `Başvuru gönderilemedi (${yanit.status}).`);
  }
}

/**
 * Başvuruyu `applications` tablosuna yazar.
 *
 * Eskiden `.select('id')` zincirleniyordu: anon kullanıcının tabloda SELECT
 * politikası olmadığı için RETURNING satırı okunamıyor ve insert başarılı olsa
 * bile hata dönüyordu — form "gönderilemedi" diyordu. Artık dönüş istenmiyor.
 */
async function basvuruKaydet(basvuru: Basvuru): Promise<void> {
  const { error } = await supabase!.from('applications').insert({
    ad_soyad: `${basvuru.ad} ${basvuru.soyad}`.trim(),
    ad: basvuru.ad,
    soyad: basvuru.soyad,
    telefon: basvuru.telefon,
    eposta: basvuru.eposta ?? null,
    sinif: basvuru.sinif,
    alan: basvuru.alan ?? null,
    program: basvuru.program,
    paket: basvuru.paket ?? null,
    veli_onayi: basvuru.veliOnayi ?? null,
    // Eski sütun; panelde hâlâ okunuyor olabilir diye dolduruluyor.
    sinav: basvuru.program,
    hedef: basvuru.not ?? null,
  });
  if (error) throw new Error(error.message);
}

/**
 * Başvuruyu gönderir.
 *
 * Bildirim asıl kanal: admin'e mail buradan gider. Veritabanı kaydı ikincil —
 * tablo/RLS bir sorun çıkarırsa başvuru yine de elimize ulaşmış olsun diye
 * hatası yutulup konsola yazılıyor.
 */
export async function basvuruGonder(basvuru: Basvuru): Promise<void> {
  if (!supabaseVar) {
    depo.basvurular.push(basvuru);
    await basvuruBildir(basvuru);
    return;
  }

  /*
   * İki kanal birden denenir ve BİRİ tutarsa başvuru kabul edilmiş sayılır.
   *
   * Tek kanala bağlamanın iki hâli de kırılgan çıktı: bildirim öne alınınca
   * form servisinin kotası dolduğunda, veritabanı öne alınınca da eksik bir
   * migration yüzünden form tamamen çalışmaz hâle geliyordu. Başvuru elimize
   * mail olarak ya da tablo satırı olarak ulaştıysa kaybolmuş değildir;
   * öğrenciye hata göstermenin anlamı yok. İkisi de düşerse hata gösterilir.
   */
  const [kayit, bildirim] = await Promise.allSettled([
    basvuruKaydet(basvuru),
    basvuruBildir(basvuru),
  ]);

  if (kayit.status === 'rejected') {
    console.warn('Başvuru veritabanına yazılamadı:', kayit.reason);
  }
  if (bildirim.status === 'rejected') {
    console.warn('Başvuru bildirimi gönderilemedi:', bildirim.reason);
  }

  if (kayit.status === 'rejected' && bildirim.status === 'rejected') {
    throw new Error(
      bildirim.reason instanceof Error
        ? bildirim.reason.message
        : 'Başvuru gönderilemedi. Bağlantını kontrol edip yeniden deneyebilirsin.',
    );
  }
}

/** Admin listesindeki başvuru satırı. */
export interface BasvuruKaydi extends Basvuru {
  id: string;
  durum: 'yeni' | 'arandi' | 'kaydoldu' | 'kapandi';
  olusturmaTarihi: string;
}

/**
 * Gelen başvurular — yalnız admin okur (RLS `applications_read_admin`).
 *
 * Başvurular şimdiye kadar sadece e-postaya ve tabloya düşüyordu; panelde
 * görecek bir ekran yoktu ve `durum` sütunu hiç kullanılmıyordu.
 */
export async function basvurular(): Promise<BasvuruKaydi[]> {
  if (!supabaseVar) {
    return depo.basvurular.map((b, i) => ({
      ...b,
      id: `demo-${i}`,
      durum: 'yeni' as const,
      olusturmaTarihi: new Date().toISOString(),
    }));
  }
  const satirlar = kontrol(
    await supabase!
      .from('applications')
      .select('id, ad, soyad, ad_soyad, telefon, eposta, sinif, alan, program, paket, hedef, veli_onayi, durum, created_at')
      .order('created_at', { ascending: false })
      .limit(500),
  ) as any[];

  return satirlar.map((r) => ({
    id: r.id,
    // Eski satırlarda ad/soyad ayrı değil; ad_soyad'dan bölünüyor.
    ad: r.ad ?? (r.ad_soyad ?? '').split(' ').slice(0, -1).join(' ') ?? '',
    soyad: r.soyad ?? (r.ad_soyad ?? '').split(' ').slice(-1)[0] ?? '',
    telefon: r.telefon ?? '',
    eposta: r.eposta ?? undefined,
    sinif: r.sinif ?? '',
    alan: r.alan ?? undefined,
    program: r.program ?? '',
    paket: r.paket ?? undefined,
    not: r.hedef ?? undefined,
    veliOnayi: r.veli_onayi ?? undefined,
    durum: r.durum ?? 'yeni',
    olusturmaTarihi: r.created_at,
  }));
}

/** Başvurunun takip durumunu değiştirir. */
export async function basvuruDurumu(id: string, durum: BasvuruKaydi['durum']): Promise<void> {
  if (!supabaseVar) return;
  const { error } = await supabase!.from('applications').update({ durum }).eq('id', id);
  if (error) throw new Error(error.message);
}

// ============================================================
// Mesajlaşma
// ============================================================

export interface Konusma {
  id: string;
  tur: 'ogrenci' | 'veli';
  kocId: string;
  kocAdi: string;
  /** Koçun karşısındaki kişi (öğrenci ya da veli) */
  kisiId: string;
  kisiAdi: string;
  kisiAvatarUrl: string | null;
  kisiAvatarRengi: string | null;
  /** Konuşmanın hangi öğrenci hakkında olduğu */
  ogrenciId: string | null;
  ogrenciAdi: string | null;
  sonMesaj: string | null;
  sonMesajAt: string | null;
  okunmamis: number;
}

export interface Mesaj {
  id: string;
  konusmaId: string;
  gonderenId: string;
  gonderenAdi: string;
  metin: string;
  duzenlendi: boolean;
  okunduAt: string | null;
  tarih: string;
}

const KISI_ALANLARI = 'id, ad_soyad, avatar_rengi, avatar_url';

function kisiAdi(k: any): string {
  return k?.ad_soyad ?? 'Bilinmeyen';
}

/**
 * Kullanıcının konuşmaları.
 *
 * Aynı sorgu dört panelde de çalışıyor: RLS zaten koça kendi konuşmalarını,
 * öğrenci/veliye kendisininkini, admine hepsini veriyor — istemcide ayrıca
 * süzmek gerekmiyor.
 */
export async function konusmalar(): Promise<Konusma[]> {
  if (!supabaseVar) return [];
  const { data: oturum } = await supabase!.auth.getSession();
  const benId = oturum.session?.user.id ?? '';

  const satirlar = kontrol(
    await supabase!
      .from('conversations')
      .select(
        `id, tur, son_mesaj_at, koc_id, kisi_id, ogrenci_id,
         koc:koc_id (${KISI_ALANLARI}),
         kisi:kisi_id (${KISI_ALANLARI}),
         ogrenci:ogrenci_id (id, ad_soyad)`,
      )
      .order('son_mesaj_at', { ascending: false, nullsFirst: false }),
  ) as any[];

  if (!satirlar.length) return [];

  // Son mesaj + okunmamış sayısı tek sorguda: konuşma başına ayrı istek
  // atmak liste büyüdükçe N+1 olurdu.
  const idler = satirlar.map((s) => s.id);
  const mesajlar = kontrol(
    await supabase!
      .from('messages')
      .select('conversation_id, metin, gonderen_id, okundu_at, created_at')
      .in('conversation_id', idler)
      .order('created_at', { ascending: false }),
  ) as any[];

  const son = new Map<string, any>();
  const sayac = new Map<string, number>();
  for (const m of mesajlar) {
    if (!son.has(m.conversation_id)) son.set(m.conversation_id, m);
    if (!m.okundu_at && m.gonderen_id !== benId) {
      sayac.set(m.conversation_id, (sayac.get(m.conversation_id) ?? 0) + 1);
    }
  }

  return satirlar.map((s) => ({
    id: s.id,
    tur: s.tur,
    kocId: s.koc_id,
    kocAdi: kisiAdi(s.koc),
    kisiId: s.kisi_id,
    kisiAdi: kisiAdi(s.kisi),
    kisiAvatarUrl: s.kisi?.avatar_url ?? null,
    kisiAvatarRengi: s.kisi?.avatar_rengi ?? null,
    ogrenciId: s.ogrenci_id,
    ogrenciAdi: s.ogrenci?.ad_soyad ?? null,
    sonMesaj: son.get(s.id)?.metin ?? null,
    sonMesajAt: son.get(s.id)?.created_at ?? s.son_mesaj_at ?? null,
    okunmamis: sayac.get(s.id) ?? 0,
  }));
}

export async function mesajlar(konusmaId: string): Promise<Mesaj[]> {
  if (!supabaseVar || !konusmaId) return [];
  const satirlar = kontrol(
    await supabase!
      .from('messages')
      .select(`id, conversation_id, gonderen_id, metin, duzenlendi, okundu_at, created_at,
               gonderen:gonderen_id (ad_soyad)`)
      .eq('conversation_id', konusmaId)
      .order('created_at'),
  ) as any[];

  return satirlar.map((m) => ({
    id: m.id,
    konusmaId: m.conversation_id,
    gonderenId: m.gonderen_id,
    gonderenAdi: kisiAdi(m.gonderen),
    metin: m.metin,
    duzenlendi: m.duzenlendi,
    okunduAt: m.okundu_at,
    tarih: m.created_at,
  }));
}

export async function mesajGonder(konusmaId: string, metin: string): Promise<void> {
  if (!supabaseVar) throw new Error('Demo modunda mesaj gönderilemez.');
  const temiz = metin.trim();
  if (!temiz) return;
  const { data: oturum } = await supabase!.auth.getSession();
  const benId = oturum.session?.user.id;
  if (!benId) throw new Error(OTURUM_BAYAT);

  kontrol(
    await supabase!
      .from('messages')
      .insert({ conversation_id: konusmaId, gonderen_id: benId, metin: temiz })
      .select('id'),
  );
}

/** Metin düzeltme — admin her mesajı, herkes kendi mesajını düzenleyebilir. */
export async function mesajDuzenle(mesajId: string, metin: string): Promise<void> {
  if (!supabaseVar) return;
  const temiz = metin.trim();
  if (!temiz) return;
  kontrol(
    await supabase!.from('messages').update({ metin: temiz, duzenlendi: true }).eq('id', mesajId).select('id'),
  );
}

export async function mesajSil(mesajId: string): Promise<void> {
  if (!supabaseVar) return;
  kontrol(await supabase!.from('messages').delete().eq('id', mesajId));
}

/** Karşı tarafın mesajlarını okundu yapar. */
export async function okunduIsaretle(konusmaId: string): Promise<void> {
  if (!supabaseVar || !konusmaId) return;
  const { data: oturum } = await supabase!.auth.getSession();
  const benId = oturum.session?.user.id;
  if (!benId) return;

  await supabase!
    .from('messages')
    .update({ okundu_at: new Date().toISOString() })
    .eq('conversation_id', konusmaId)
    .neq('gonderen_id', benId)
    .is('okundu_at', null);
}

/**
 * Konuşmayı bulur, yoksa açar.
 *
 * Koç bir öğrenciyle ilk kez yazışacağında konuşma satırı henüz yok; ekranın
 * "önce şunu oluştur" adımı istememesi için çağrı tek yerde toplandı.
 */
export async function konusmaAc(
  kocId: string,
  kisiId: string,
  tur: 'ogrenci' | 'veli',
  ogrenciId: string | null,
): Promise<string> {
  if (!supabaseVar) throw new Error('Demo modunda mesajlaşma kapalı.');

  const mevcut = kontrol(
    await supabase!.from('conversations').select('id').eq('koc_id', kocId).eq('kisi_id', kisiId).maybeSingle(),
  ) as any;
  if (mevcut?.id) return mevcut.id;

  const yeni = kontrol(
    await supabase!
      .from('conversations')
      .insert({ koc_id: kocId, kisi_id: kisiId, tur, ogrenci_id: ogrenciId })
      .select('id')
      .single(),
  ) as any;
  return yeni.id;
}

/**
 * Koçun yazışabileceği kişiler — öğrencileri ve onların velileri.
 * Konuşması olmayanlar da listede görünsün diye ayrı çekiliyor.
 */
export interface YazisilabilirKisi {
  kisiId: string;
  adSoyad: string;
  avatarUrl: string | null;
  avatarRengi: string | null;
  tur: 'ogrenci' | 'veli';
  ogrenciId: string;
  ogrenciAdi: string;
  /** Konuşmanın koç tarafı — admin başkası adına da konuşma açabilir */
  kocId: string;
  kocAdi: string;
}

/** `kocId` verilmezse (admin) sistemdeki bütün koç–öğrenci/veli çiftleri döner. */
export async function yazisilabilirler(kocId?: string): Promise<YazisilabilirKisi[]> {
  if (!supabaseVar) return [];

  let sorgu = supabase!
    .from('coach_students')
    .select(`coach_id, student_id, koc:coach_id (ad_soyad), ogrenci:student_id (${KISI_ALANLARI})`)
    .eq('aktif', true)
    .eq('arsivlendi', false);
  if (kocId) sorgu = sorgu.eq('coach_id', kocId);

  const ogrenciler = kontrol(await sorgu) as any[];

  const koclar = new Map<string, { id: string; ad: string }>();
  for (const o of ogrenciler) koclar.set(o.student_id, { id: o.coach_id, ad: kisiAdi(o.koc) });

  const idler = ogrenciler.map((o) => o.student_id);
  const sonuc: YazisilabilirKisi[] = ogrenciler.map((o) => ({
    kisiId: o.student_id,
    adSoyad: kisiAdi(o.ogrenci),
    avatarUrl: o.ogrenci?.avatar_url ?? null,
    avatarRengi: o.ogrenci?.avatar_rengi ?? null,
    tur: 'ogrenci',
    ogrenciId: o.student_id,
    ogrenciAdi: kisiAdi(o.ogrenci),
    kocId: o.coach_id,
    kocAdi: kisiAdi(o.koc),
  }));

  if (idler.length) {
    const veliBaglari = kontrol(
      await supabase!
        .from('parent_students')
        .select(`parent_id, student_id, veli:parent_id (${KISI_ALANLARI}), ogrenci:student_id (ad_soyad)`)
        .in('student_id', idler),
    ) as any[];

    for (const v of veliBaglari) {
      const koc = koclar.get(v.student_id);
      if (!koc) continue;
      sonuc.push({
        kisiId: v.parent_id,
        adSoyad: kisiAdi(v.veli),
        avatarUrl: v.veli?.avatar_url ?? null,
        avatarRengi: v.veli?.avatar_rengi ?? null,
        tur: 'veli',
        ogrenciId: v.student_id,
        ogrenciAdi: kisiAdi(v.ogrenci),
        kocId: koc.id,
        kocAdi: koc.ad,
      });
    }
  }

  return sonuc;
}

/** Okunmamış mesaj sayısı — menüdeki rozet. */
export async function okunmamisMesaj(): Promise<number> {
  const hepsi = await konusmalar();
  return hepsi.reduce((a, k) => a + k.okunmamis, 0);
}
