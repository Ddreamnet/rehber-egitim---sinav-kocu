/**
 * Net Denge — ürünün imza hesaplayıcısı.
 *
 * Zincir tek yönlü değil, iki yönlüdür:
 *   hedef sıralama → gereken yerleştirme puanı → gereken sınav puanı → derslere net
 *   dersler değişince → sınav puanı → yerleştirme puanı → tahmini sıralama
 *
 * Hesabın tamamı gerçek sınav verisine dayanır (bkz. 0020_gercek_puan_verisi.sql):
 *
 *   net → puan     ÖSYM/MEB'in ilgili yıl için yayımladığı katsayılarla.
 *                  Puan, netlere göre DOĞRUSALDIR: puan = taban + Σ (net × katsayı).
 *   puan → sıralama ÖSYM/MEB'in yayımladığı yığınsal dağılımdan. "X puan ve üstü:
 *                  N aday" satırındaki N, doğrudan o puanın başarı sırasıdır.
 *   OBP            Yerleştirme puanı = sınav puanı + OBP × 0,12 (YKS).
 *
 * Eski sürümde üç hata vardı ve üçü de burada düzeltildi:
 *   1. Tek bir 'yks' eğrisi tüm alanlara uygulanıyordu (90 net SAY = 90 net SÖZ).
 *      Artık her puan türünün kendi katsayıları ve kendi dağılımı var.
 *   2. Sıralama, çapalar arasında doğrusal ara değerle bulunuyordu. Sıralama
 *      puana göre üstel değişir; ara değer artık LOGARİTMİK alınıyor.
 *   3. Diploma notu hesaba hiç girmiyordu.
 */

// ---------- Model ----------

/** Ders id → net */
export type NetHaritasi = Record<string, number>;
/** Ders id → kilitli mi */
export type KilitHaritasi = Record<string, boolean>;

/** `puan = taban + Σ (net × katsayı)` içindeki tek terim. */
export interface PuanKatsayisi {
  /** exam_sessions.kod — 'tyt' | 'ayt-say' | 'ayt-ea' | 'ayt-soz' | 'ydt' | 'lgs' */
  oturumKod: string;
  /** subjects.ad ile birebir eşleşir */
  dersAd: string;
  katsayi: number;
}

/** Yığınsal dağılımın bir satırı: bu puan ve üstünü alan aday sayısı. */
export interface DagilimNoktasi {
  puan: number;
  kumulatifAday: number;
}

export interface PuanModeli {
  yil: number;
  /** 'tyt' | 'say' | 'ea' | 'soz' | 'dil' | 'lgs' */
  puanTuru: string;
  ad: string;
  sinavKod: string;
  /** Tüm netler 0 iken oluşan puan */
  tabanPuan: number;
  tavanPuan: number;
  /** Yerleştirme puanına diploma notunun katkı katsayısı (YKS 0,12 · LGS 0) */
  obpKatsayi: number;
  /** Verinin sağlamlığı — arayüzde olduğu gibi gösterilir */
  guven: 'resmi' | 'turetilmis';
  kaynak: string;
  kaynakUrl: string | null;
  katsayilar: PuanKatsayisi[];
  /** OBP hariç — sınav puanı dağılımı */
  sinavDagilimi: DagilimNoktasi[];
  /** OBP dahil — yerleştirme puanı dağılımı */
  yerlestirmeDagilimi: DagilimNoktasi[];
}

/** Hesaba giren tek bir ders satırı. */
export interface DersNeti {
  dersId: string;
  oturumKod: string;
  dersAd: string;
  net: number;
  maxNet: number;
}

const kis = (n: number, alt: number, ust: number) => Math.max(alt, Math.min(ust, n));

// ---------- net ↔ puan ----------

/** Dersin bu puan türündeki net katsayısı; modelde yoksa 0 (puana girmez). */
export function dersKatsayisi(model: PuanModeli, oturumKod: string, dersAd: string): number {
  const k = model.katsayilar.find((x) => x.oturumKod === oturumKod && x.dersAd === dersAd);
  return k ? k.katsayi : 0;
}

/**
 * Netlerden sınav puanı (OBP hariç).
 *
 * Katsayılar ders soru sayılarıyla birlikte tavanı ~500'e getirir; yuvarlamadan
 * gelen küçük taşmalar `tavanPuan`a kırpılır.
 */
export function netlerdenPuan(model: PuanModeli, dersler: DersNeti[]): number {
  const ham = dersler.reduce(
    (toplam, d) => toplam + d.net * dersKatsayisi(model, d.oturumKod, d.dersAd),
    model.tabanPuan,
  );
  return Number(kis(ham, model.tabanPuan, model.tavanPuan).toFixed(1));
}

/** Diploma notunun yerleştirme puanına katkısı. OBP yoksa 0. */
export function obpKatkisi(model: PuanModeli, obp: number | null | undefined): number {
  if (!obp) return 0;
  return Number((kis(obp, 0, 500) * model.obpKatsayi).toFixed(1));
}

/** Yerleştirme puanı = sınav puanı + OBP katkısı. */
export function yerlestirmePuani(model: PuanModeli, sinavPuani: number, obp: number | null | undefined): number {
  return Number((sinavPuani + obpKatkisi(model, obp)).toFixed(1));
}

/** Öğrencinin OBP'si girilmişse yerleştirme dağılımı, girilmemişse sınav dağılımı. */
export function dagilimSec(model: PuanModeli, obp: number | null | undefined): DagilimNoktasi[] {
  const yerlestirme = obp && model.obpKatsayi > 0;
  const secilen = yerlestirme ? model.yerlestirmeDagilimi : model.sinavDagilimi;
  return secilen.length ? secilen : model.sinavDagilimi;
}

// ---------- puan ↔ sıralama ----------

/**
 * İki dağılım noktası arasında sıralama ara değeri.
 *
 * Sıralama puana göre üstel değişir (üst uçta 20 puan on binlerce sıra, alt uçta
 * yüz binlerce). Doğrusal ara değer bu yüzden %20'ye varan hata veriyordu; ara
 * değer aday sayısının logaritmasında alınıyor.
 */
function logAraDeger(puan: number, p1: number, n1: number, p2: number, n2: number): number {
  if (p1 === p2) return n1;
  const oran = (puan - p1) / (p2 - p1);
  const a = Math.log(Math.max(1, n1));
  const b = Math.log(Math.max(1, n2));
  return Math.exp(a + oran * (b - a));
}

/** Dağılım, puana göre azalan sırada mı — çağıranlar bu sırayı varsayar. */
function sirala(dagilim: DagilimNoktasi[]): DagilimNoktasi[] {
  return [...dagilim].sort((a, b) => b.puan - a.puan);
}

/** Puan → tahmini başarı sırası. Dağılım boşsa null. */
export function puandanSiralama(puan: number, dagilim: DagilimNoktasi[]): number | null {
  const d = sirala(dagilim);
  if (d.length < 2) return d.length === 1 ? d[0].kumulatifAday : null;

  if (puan >= d[0].puan) return d[0].kumulatifAday;
  const son = d[d.length - 1];
  if (puan <= son.puan) return son.kumulatifAday;

  for (let i = 0; i < d.length - 1; i++) {
    const a = d[i];
    const b = d[i + 1];
    if (puan <= a.puan && puan >= b.puan) {
      return Math.max(1, Math.round(logAraDeger(puan, a.puan, a.kumulatifAday, b.puan, b.kumulatifAday)));
    }
  }
  return son.kumulatifAday;
}

/** Başarı sırası → o sıra için gereken puan. `puandanSiralama`nın tersi. */
export function siralamadanPuan(siralama: number, dagilim: DagilimNoktasi[]): number | null {
  const d = sirala(dagilim);
  if (d.length < 2) return null;

  const enIyi = d[0];
  const enKotu = d[d.length - 1];
  if (siralama <= enIyi.kumulatifAday) return enIyi.puan;
  if (siralama >= enKotu.kumulatifAday) return enKotu.puan;

  for (let i = 0; i < d.length - 1; i++) {
    const a = d[i];
    const b = d[i + 1];
    if (siralama >= a.kumulatifAday && siralama <= b.kumulatifAday) {
      // Logaritmik eksende ters ara değer
      const la = Math.log(Math.max(1, a.kumulatifAday));
      const lb = Math.log(Math.max(1, b.kumulatifAday));
      const oran = lb === la ? 0 : (Math.log(Math.max(1, siralama)) - la) / (lb - la);
      return Number((a.puan + oran * (b.puan - a.puan)).toFixed(1));
    }
  }
  return enKotu.puan;
}

/** Dağılımdaki en iyi (en küçük) ve en kötü sıra — hedef bu aralığa kısılır. */
export function siralamaAraligi(dagilim: DagilimNoktasi[]): { enIyi: number; enKotu: number } | null {
  const d = sirala(dagilim);
  if (!d.length) return null;
  return { enIyi: d[0].kumulatifAday, enKotu: d[d.length - 1].kumulatifAday };
}

/** Bu ders dizilimiyle ulaşılabilecek en yüksek sınav puanı. */
export function ulasilabilirEnYuksekPuan(model: PuanModeli, dersler: DersNeti[]): number {
  return netlerdenPuan(
    model,
    dersler.map((d) => ({ ...d, net: d.maxNet })),
  );
}

// ---------- dağıtım ----------

/**
 * Hedef sınav puanını derslere dağıtır.
 *
 * Kilitli dersler olduğu gibi kalır; kalan puan bütçesi kilitsiz derslere
 * "puana katkı kapasitesi" (katsayı × maxNet) oranında paylaştırılır. Böylece
 * ağırlığı yüksek ders daha çok net alır — eski sürüm yalnız soru sayısına
 * bakıyordu ve AYT Matematik ile TYT Sosyal'i aynı görüyordu.
 *
 * Hedef, kilitler yüzünden tutturulamıyorsa ulaşılabilen en yakın dağılım döner.
 */
export function hedefePuanDagit(
  model: PuanModeli,
  dersler: DersNeti[],
  kilit: KilitHaritasi,
  hedefPuan: number,
): NetHaritasi {
  const sonuc: NetHaritasi = Object.fromEntries(dersler.map((d) => [d.dersId, d.net]));
  const acik = dersler.filter((d) => !kilit[d.dersId] && dersKatsayisi(model, d.oturumKod, d.dersAd) > 0);
  if (!acik.length) return sonuc;

  const kilitliKatki = dersler
    .filter((d) => kilit[d.dersId] || dersKatsayisi(model, d.oturumKod, d.dersAd) === 0)
    .reduce((a, d) => a + d.net * dersKatsayisi(model, d.oturumKod, d.dersAd), 0);

  const acikKapasite = acik.reduce(
    (a, d) => a + d.maxNet * dersKatsayisi(model, d.oturumKod, d.dersAd),
    0,
  );
  const butce = kis(hedefPuan - model.tabanPuan - kilitliKatki, 0, acikKapasite);

  // Kapasiteye oranlı ilk dağıtım
  for (const d of acik) {
    const k = dersKatsayisi(model, d.oturumKod, d.dersAd);
    const pay = acikKapasite ? (butce * (d.maxNet * k)) / acikKapasite : 0;
    sonuc[d.dersId] = kis(Math.round(pay / k), 0, d.maxNet);
  }

  // Yuvarlama artığını puana en az zarar verecek şekilde kapat
  let fark = butce - acik.reduce((a, d) => a + sonuc[d.dersId] * dersKatsayisi(model, d.oturumKod, d.dersAd), 0);
  let guvenlik = acik.length * 4;
  while (Math.abs(fark) >= 0.5 && guvenlik-- > 0) {
    const yon = fark > 0 ? 1 : -1;
    const aday = acik.find((d) =>
      yon > 0 ? sonuc[d.dersId] < d.maxNet : sonuc[d.dersId] > 0,
    );
    if (!aday) break;
    sonuc[aday.dersId] += yon;
    fark -= yon * dersKatsayisi(model, aday.oturumKod, aday.dersAd);
  }

  return sonuc;
}

/**
 * Bir dersi `delta` kadar değiştirir ve PUANI sabit tutacak şekilde farkı
 * kilitsiz derslere dağıtır.
 *
 * Eski sürüm net toplamını sabit tutuyordu; katsayılar farklı olduğu için bu
 * puanı sabit tutmuyordu — AYT Matematik'ten 1 net alıp TYT Sosyal'e vermek
 * puanı düşürüyordu ama ekran "denge korundu" diyordu.
 */
export function degistir(
  model: PuanModeli,
  dersler: DersNeti[],
  kilit: KilitHaritasi,
  dersId: string,
  delta: number,
): NetHaritasi {
  const netler: NetHaritasi = Object.fromEntries(dersler.map((d) => [d.dersId, d.net]));
  const hedefDers = dersler.find((d) => d.dersId === dersId);
  if (!hedefDers) return netler;

  const yeni = kis(netler[dersId] + delta, 0, hedefDers.maxNet);
  if (yeni === netler[dersId]) return netler;

  const kHedef = dersKatsayisi(model, hedefDers.oturumKod, hedefDers.dersAd);
  netler[dersId] = yeni;
  // Katsayısı 0 olan ders puana girmiyor; dengelenecek bir şey de yok.
  if (kHedef === 0) return netler;

  // Kapatılması gereken puan farkı — `hedefDers.net` değişmemiş ilk değer
  let borc = (yeni - hedefDers.net) * kHedef;

  const digerler = dersler.filter(
    (d) => d.dersId !== dersId && !kilit[d.dersId] && dersKatsayisi(model, d.oturumKod, d.dersAd) > 0,
  );

  for (const d of digerler) {
    if (Math.abs(borc) < 0.001) break;
    const k = dersKatsayisi(model, d.oturumKod, d.dersAd);
    if (borc > 0) {
      // Bu derse eklendi → diğerlerinden puan düşülmeli
      const dusulebilir = Math.min(netler[d.dersId], Math.round(borc / k));
      netler[d.dersId] -= dusulebilir;
      borc -= dusulebilir * k;
    } else {
      const eklenebilir = Math.min(d.maxNet - netler[d.dersId], Math.round(-borc / k));
      netler[d.dersId] += eklenebilir;
      borc += eklenebilir * k;
    }
  }

  return netler;
}

export function toplamNet(netler: NetHaritasi): number {
  return Object.values(netler).reduce((a, b) => a + b, 0);
}

/** Diploma notu (0–100) → OBP (0–500). */
export function diplomaNotundanObp(not: number): number {
  return Number((kis(not, 0, 100) * 5).toFixed(2));
}

/** OBP (0–500) → diploma notu (0–100). */
export function obpdenDiplomaNotu(obp: number): number {
  return Number((kis(obp, 0, 500) / 5).toFixed(2));
}
