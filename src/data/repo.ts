/**
 * Veri erişim katmanı.
 *
 * Supabase yapılandırılmışsa (`VITE_SUPABASE_URL`) gerçek sorgular çalışır;
 * yapılandırılmamışsa aynı imzalar demo veriyle karşılanır. Ekranlar hangi
 * kaynağın açık olduğunu bilmez.
 */

import { supabase, supabaseVar, kontrol } from '@/lib/supabase';
import { dersRengi } from '@/config/site';
import { netHesapla } from '@/lib/format';
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

export async function mevcutProfil(): Promise<Profil | null> {
  if (!supabaseVar) return null;
  const { data: oturum } = await supabase!.auth.getUser();
  if (!oturum.user) return null;

  // Yetki profilde değil user_roles'ta tutulur (EWD kalıbı).
  const [profilSonuc, rolSonuc] = await Promise.all([
    supabase!
      .from('profiles')
      .select('id, ad_soyad, eposta, sinif, hedef_alan, avatar_rengi')
      .eq('id', oturum.user.id)
      .single(),
    supabase!.from('user_roles').select('rol').eq('user_id', oturum.user.id),
  ]);

  const satir = kontrol(profilSonuc);
  return {
    id: satir.id,
    rol: enYetkiliRol(kontrol(rolSonuc) as Array<{ rol: Rol }>),
    adSoyad: satir.ad_soyad,
    eposta: satir.eposta,
    sinif: satir.sinif,
    hedefAlan: satir.hedef_alan,
    avatarRengi: satir.avatar_rengi,
  };
}

/** Koçun öğrenci listesi (koç paneli tablosu). */
export async function ogrencilerim(kocId: string): Promise<OgrenciOzeti[]> {
  if (!supabaseVar) return demo.KOC_OGRENCILERI;

  const baglar = kontrol(
    await supabase!
      .from('coach_students')
      .select('student_id, profiles:student_id (id, ad_soyad, hedef_alan, avatar_rengi)')
      .eq('coach_id', kocId)
      .eq('aktif', true),
  ) as Array<{ student_id: string; profiles: any }>;

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
      .select('student_id, detay_seviyesi, profiles:student_id (id, ad_soyad, sinif, hedef_alan, avatar_rengi)')
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
      avatarRengi: bag.profiles.avatar_rengi,
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
      .select('id, kod, ad, sira, exams:exam_id (kod)')
      .order('sira'),
  ) as any[];
  return satirlar.map((s) => ({ id: s.id, kod: s.kod, ad: s.ad, sinavKodu: s.exams?.kod ?? '' }));
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

export async function haftaPlani(ogrenciId: string): Promise<HaftalikPlan | null> {
  if (!supabaseVar) return kopya({ ...depo.plan, oran: planOrani(depo.plan.maddeler) });

  const plan = kontrol(
    await supabase!
      .from('weekly_plans')
      .select(
        'id, hafta_baslangic, plan_items (id, baslik, topic_id, tamamlandi, gun, baslangic, bitis, sira, topics:topic_id (question_avg, subjects:subject_id (ad, renk)))',
      )
      .eq('student_id', ogrenciId)
      .order('hafta_baslangic', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ) as any;
  if (!plan) return null;

  const bugun = new Date().toISOString().slice(0, 10);
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
  const bugun = new Date().toISOString().slice(0, 10);
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

/** Koça önerilecek atanabilir konular (henüz tamamlanmamışlar). */
export async function atanabilirKonular(
  ogrenciId: string,
  adet = 6,
): Promise<Array<{ id: string; ad: string; renk: string }>> {
  const oturumListesi = await oturumlar();
  if (!oturumListesi.length) return [];
  const dersler = await mufredat(oturumListesi[0].id, ogrenciId);
  return dersler
    .flatMap((d) => d.konular.filter((k) => k.durum !== 'tamam').map((k) => ({ id: k.id, ad: k.ad, renk: d.renk })))
    .slice(0, adet);
}

/** Koç: gelecek haftaya konu atar. */
export async function konuAta(
  ogrenciId: string,
  kocId: string,
  haftaBaslangic: string,
  basliklar: Array<{ baslik: string; konuId?: string | null }>,
): Promise<void> {
  if (!supabaseVar) {
    basliklar.forEach((b, i) =>
      depo.plan.maddeler.push({
        id: yeniId(),
        baslik: b.baslik,
        konuId: b.konuId ?? null,
        dersAdi: null,
        renk: dersRengi(b.baslik),
        tamamlandi: false,
        soruOrtalamasi: null,
        gun: null,
        baslangicSaat: null,
        bitisSaat: null,
        bugun: false,
        ...(i === -1 ? {} : {}),
      }),
    );
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

  kontrol(
    await supabase!
      .from('plan_items')
      .insert(
        basliklar.map((b, i) => ({
          plan_id: plan.id,
          baslik: b.baslik,
          topic_id: b.konuId ?? null,
          sira: i,
        })),
      )
      .select('id'),
  );
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
          konu.cozulen = Math.min(konu.hedef, konu.cozulen + cozulenEk);
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
  const cozulen = Math.min(hedef, (mevcut?.cozulen ?? 0) + cozulenEk);
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

/** Ders bazlı müfredat ilerlemesi (koç/veli panelindeki barlar). */
export async function dersIlerlemesi(
  ogrenciId: string,
  oturumId?: string,
): Promise<Array<{ ad: string; renk: string; oran: number }>> {
  if (!supabaseVar) return demo.DERS_ILERLEMESI;

  const dersler = await mufredat(oturumId ?? (await oturumlar())[0].id, ogrenciId);
  return dersler.map((d) => ({
    ad: d.ad,
    renk: d.renk,
    oran: d.toplamKonu ? d.tamamlanan / d.toplamKonu : 0,
  }));
}

export async function mufredatOrani(ogrenciId: string, oturumId?: string): Promise<number> {
  if (!supabaseVar) return demo.MUFREDAT_ORANI;
  const dersler = await mufredat(oturumId ?? (await oturumlar())[0].id, ogrenciId);
  const toplam = dersler.reduce((a, d) => a + d.toplamKonu, 0);
  const tamam = dersler.reduce((a, d) => a + d.tamamlanan, 0);
  return toplam ? tamam / toplam : 0;
}

// ============================================================
// Net Denge
// ============================================================

export async function netHedefi(ogrenciId: string): Promise<NetHedefi | null> {
  if (!supabaseVar) return kopya(depo.netHedefi);

  const hedef = kontrol(
    await supabase!
      .from('net_targets')
      .select(
        'id, tip, hedef_puan, hedef_siralama, net_allocations (subject_id, net, max_net, locked, subjects:subject_id (ad, renk, sira))',
      )
      .eq('student_id', ogrenciId)
      .eq('guncel', true)
      .limit(1)
      .maybeSingle(),
  ) as any;
  if (!hedef) return null;

  return {
    id: hedef.id,
    tip: hedef.tip,
    hedefPuan: hedef.hedef_puan ? Number(hedef.hedef_puan) : null,
    hedefSiralama: hedef.hedef_siralama,
    dagilim: (hedef.net_allocations ?? [])
      .sort((a: any, b: any) => (a.subjects?.sira ?? 0) - (b.subjects?.sira ?? 0))
      .map((a: any) => ({
        dersId: a.subject_id,
        ad: a.subjects?.ad ?? '—',
        renk: dersRengi(a.subjects?.ad),
        net: a.net,
        maxNet: a.max_net,
        kilitli: a.locked,
      })),
  };
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

/** Tahmini sıralama tablosu — DB'de varsa oradan, yoksa varsayılan. */
export async function siralamaTablosu(sinavKodu = 'yks'): Promise<Array<[number, number]> | null> {
  if (!supabaseVar) return null;
  const satirlar = kontrol(
    await supabase!
      .from('net_siralama_tablosu')
      .select('net, siralama')
      .eq('exam_kod', sinavKodu)
      .order('net', { ascending: false }),
  ) as any[];
  if (!satirlar.length) return null;
  return satirlar.map((s) => [s.net, s.siralama] as [number, number]);
}

// ============================================================
// Görüşmeler ve notlar
// ============================================================

export async function sonrakiGorusme(ogrenciId: string): Promise<Gorusme | null> {
  if (!supabaseVar) return demo.SONRAKI_GORUSME;

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

  const satirlar = kontrol(
    await supabase!
      .from('meetings')
      .select('*, ogrenci:student_id (ad_soyad), koc:coach_id (ad_soyad), meeting_notes (metin, etiketler)')
      .eq('student_id', ogrenciId)
      .lt('baslangic', new Date().toISOString())
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
    return demo.KOC_OGRENCILERI.filter((o) => o.sonrakiGorusme).map((o) => ({
      ...demo.SONRAKI_GORUSME,
      id: `g-${o.id}`,
      ogrenciId: o.id,
      ogrenciAdi: o.adSoyad,
      baslangic: o.sonrakiGorusme!,
      gundem: [],
    }));
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

export async function notEkle(
  ogrenciId: string,
  kocId: string,
  metin: string,
  veliylePaylas: boolean,
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

export async function adminMetrikleri(): Promise<typeof demo.ADMIN_METRIKLERI> {
  if (!supabaseVar) return demo.ADMIN_METRIKLERI;

  const haftaOnce = new Date(Date.now() - 7 * 86400000).toISOString();
  const ayBasi = new Date();
  ayBasi.setDate(1);

  const [ogrenciler, koclar, gorusmeler, iptaller] = await Promise.all([
    supabase!
      .from('profiles')
      .select('id, created_at, user_roles!inner(rol)', { count: 'exact' })
      .eq('user_roles.rol', 'ogrenci')
      .eq('aktif', true),
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

  const ogrenciSayisi = ogrenciler.count ?? 0;
  const kocSayisi = koclar.count ?? 0;
  const buAy = ((ogrenciler.data ?? []) as any[]).filter((o) => new Date(o.created_at) >= ayBasi).length;

  const planlar = kontrol(
    await supabase!.from('weekly_plans').select('plan_items (tamamlandi)').limit(500),
  ) as any[];
  const oranlar = planlar.map((p) => planOrani(p.plan_items ?? [])).filter((o) => o > 0);

  return {
    aktifOgrenci: ogrenciSayisi,
    ogrenciArtisi: buAy,
    kocSayisi,
    kocBasinaOgrenci: kocSayisi ? Number((ogrenciSayisi / kocSayisi).toFixed(1)) : 0,
    haftalikGorusme: gorusmeler.count ?? 0,
    iptal: iptaller.count ?? 0,
    planTamamlama: oranlar.length ? oranlar.reduce((a, b) => a + b, 0) / oranlar.length : 0,
    planTamamlamaArtisi: 0,
  };
}

export async function ogrenciBuyumesi(): Promise<Array<{ ay: string; sayi: number }>> {
  if (!supabaseVar) return demo.OGRENCI_BUYUMESI;

  const satirlar = kontrol(
    await supabase!
      .from('profiles')
      .select('created_at, user_roles!inner(rol)')
      .eq('user_roles.rol', 'ogrenci')
      .order('created_at'),
  ) as any[];

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
      .select('id, ad_soyad, avatar_rengi, user_roles!inner(rol)')
      .eq('user_roles.rol', 'koc')
      .eq('aktif', true),
  ) as any[];

  const haftaOnce = new Date(Date.now() - 7 * 86400000).toISOString();
  const [baglar, planlar, gorusmeler] = await Promise.all([
    supabase!.from('coach_students').select('coach_id, student_id').eq('aktif', true),
    supabase!.from('weekly_plans').select('coach_id, plan_items (tamamlandi)'),
    supabase!.from('meetings').select('coach_id').gte('baslangic', haftaOnce),
  ]);

  return profiller.map((p) => {
    const ogrenciSayisi = ((baglar.data ?? []) as any[]).filter((b) => b.coach_id === p.id).length;
    const oranlar = ((planlar.data ?? []) as any[])
      .filter((x) => x.coach_id === p.id)
      .map((x) => planOrani(x.plan_items ?? []));
    const tamamlama = oranlar.length ? oranlar.reduce((a, b) => a + b, 0) / oranlar.length : 0;
    return {
      id: p.id,
      adSoyad: p.ad_soyad,
      avatarRengi: p.avatar_rengi ?? 'var(--color-primary-soft-2)',
      ogrenciSayisi,
      planTamamlama: tamamlama,
      haftalikGorusme: ((gorusmeler.data ?? []) as any[]).filter((g) => g.coach_id === p.id).length,
      netDegisimi: 0,
      durum: tamamlama >= 0.75 ? 'cokIyi' : tamamlama >= 0.6 ? 'iyi' : 'takipte',
    };
  });
}

/**
 * Kayıtlı bir kullanıcıya rol atar (yalnız admin — RLS `user_roles` üzerinde).
 * Kullanıcı önce /giris üzerinden kayıt olmalı; istemciden kullanıcı yaratılamaz.
 */
export async function roleAta(eposta: string, rol: Rol): Promise<Profil> {
  if (!supabaseVar) {
    throw new Error('Demo modunda rol ataması yapılamaz. Supabase bağlantısını tanımla.');
  }

  const kisi = kontrol(
    await supabase!
      .from('profiles')
      .select('id, ad_soyad, eposta, sinif, hedef_alan, avatar_rengi')
      .eq('eposta', eposta.trim().toLowerCase())
      .maybeSingle(),
  ) as any;
  if (!kisi) {
    throw new Error('Bu e-postayla kayıtlı kullanıcı yok. Önce kayıt olmasını iste.');
  }

  kontrol(
    await supabase!
      .from('user_roles')
      .upsert({ user_id: kisi.id, rol }, { onConflict: 'user_id,rol' })
      .select('id'),
  );

  return {
    id: kisi.id,
    rol,
    adSoyad: kisi.ad_soyad,
    eposta: kisi.eposta,
    sinif: kisi.sinif,
    hedefAlan: kisi.hedef_alan,
    avatarRengi: kisi.avatar_rengi,
  };
}

export interface YeniOgrenci {
  adSoyad: string;
  eposta: string;
  sifre: string;
  telefon?: string;
  sinif?: string;
  hedefAlan?: string;
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
    throw new Error('Demo modunda öğrenci eklenemez. Supabase bağlantısını tanımla.');
  }

  const { data, error } = await supabase!.functions.invoke('ogrenci-ekle', { body: girdi });

  if (error) {
    // Edge Function hata gövdesini okumaya çalış (mesaj Türkçe geliyor)
    let mesaj = error.message;
    const yanit = (error as { context?: Response }).context;
    if (yanit && typeof yanit.json === 'function') {
      try {
        const govde = await yanit.json();
        if (govde?.hata) mesaj = govde.hata;
      } catch {
        /* gövde okunamadı — özgün mesajla devam */
      }
    }
    throw new Error(mesaj);
  }
  if (data?.hata) throw new Error(data.hata);

  return { ogrenciId: data.ogrenciId, veliId: data.veliId ?? null };
}

export async function tumOgrenciler(): Promise<OgrenciOzeti[]> {
  if (!supabaseVar) return demo.KOC_OGRENCILERI;
  const profiller = kontrol(
    await supabase!
      .from('profiles')
      .select('id, ad_soyad, hedef_alan, avatar_rengi, user_roles!inner(rol)')
      .eq('user_roles.rol', 'ogrenci'),
  ) as any[];
  return profiller.map((p) => ({
    id: p.id,
    adSoyad: p.ad_soyad,
    avatarRengi: p.avatar_rengi ?? dersRengi(p.hedef_alan),
    sinav: p.hedef_alan ?? '—',
    planOrani: 0,
    netTrendi: [],
    sonNet: null,
    sonrakiGorusme: null,
    durum: 'yolunda',
  }));
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

export async function basvuruGonder(basvuru: Basvuru): Promise<void> {
  if (!supabaseVar) {
    depo.basvurular.push(basvuru);
    return;
  }
  kontrol(
    await supabase!
      .from('applications')
      .insert({
        ad_soyad: basvuru.adSoyad,
        telefon: basvuru.telefon,
        eposta: basvuru.eposta,
        sinav: basvuru.sinav,
        hedef: basvuru.hedef,
      })
      .select('id'),
  );
}
