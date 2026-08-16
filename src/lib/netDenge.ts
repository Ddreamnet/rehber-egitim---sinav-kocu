/**
 * Net Denge — ürünün imza hesaplayıcısı.
 *
 * Akış tek yönlü değil, iki yönlüdür:
 *   hedef (sıralama/puan)  →  gereken toplam net  →  derslere dağılım
 *   dersler değişince      →  toplam sabit kalır  →  tahmini sıralama/puan
 *
 * `degistir()` davranışı tasarım dosyasındaki (`Ogrenci Paneli.dc.html`)
 * fonksiyondan birebir taşındı: bir ders değişince fark yalnızca KİLİTSİZ
 * derslere dağıtılır, toplam sabit kalır; dengelenemeyen artık geri alınır.
 */

/** Ders id → net */
export type NetHaritasi = Record<string, number>;
/** Ders id → kilitli mi */
export type KilitHaritasi = Record<string, boolean>;

/**
 * Net ↔ sıralama/puan çapa noktası.
 *
 * Değerler yaklaşıktır ve `net_siralama_tablosu` tablosundan gelir; gerçek
 * ÖSYM yerleştirme verisiyle güncellenir. Ekranda her zaman "tahmini" etiketiyle
 * gösterilir.
 */
export interface SiraSatiri {
  net: number;
  siralama: number;
  /** Aynı net için yaklaşık yerleştirme puanı (yoksa puan hedefi kullanılamaz) */
  puan: number | null;
}

export type SiralamaTablosu = SiraSatiri[];

/** Nete göre azalan sırada — Supabase'ten de bu sırada gelir. */
export const VARSAYILAN_SIRALAMA_TABLOSU: SiralamaTablosu = [
  { net: 110, siralama: 5000, puan: 480 },
  { net: 100, siralama: 15000, puan: 455 },
  { net: 90, siralama: 52000, puan: 430 },
  { net: 80, siralama: 110000, puan: 405 },
  { net: 70, siralama: 210000, puan: 380 },
  { net: 60, siralama: 380000, puan: 350 },
  { net: 50, siralama: 650000, puan: 320 },
  { net: 0, siralama: 2400000, puan: 180 },
];

const yuvarla = (n: number, adim: number) => Math.round(n / adim) * adim;
const kis = (n: number, alt: number, ust: number) => Math.max(alt, Math.min(ust, n));

/** İki çapa arasında doğrusal ara değer. */
function araDeger(x: number, x1: number, y1: number, x2: number, y2: number): number {
  if (x1 === x2) return y1;
  return y1 + ((x - x1) / (x2 - x1)) * (y2 - y1);
}

/** Toplam net → tahmini sıralama. */
export function tahminiSiralama(
  toplamNet: number,
  tablo: SiralamaTablosu = VARSAYILAN_SIRALAMA_TABLOSU,
): number {
  if (!tablo.length) return 0;
  for (let i = 0; i < tablo.length - 1; i++) {
    const a = tablo[i];
    const b = tablo[i + 1];
    if (toplamNet <= a.net && toplamNet >= b.net) {
      return yuvarla(araDeger(toplamNet, a.net, a.siralama, b.net, b.siralama), 500);
    }
  }
  return toplamNet > tablo[0].net ? tablo[0].siralama : tablo[tablo.length - 1].siralama;
}

/** Toplam net → tahmini puan (tabloda puan yoksa null). */
export function tahminiPuan(
  toplamNet: number,
  tablo: SiralamaTablosu = VARSAYILAN_SIRALAMA_TABLOSU,
): number | null {
  const puanli = tablo.filter((s): s is SiraSatiri & { puan: number } => s.puan !== null);
  if (puanli.length < 2) return null;
  for (let i = 0; i < puanli.length - 1; i++) {
    const a = puanli[i];
    const b = puanli[i + 1];
    if (toplamNet <= a.net && toplamNet >= b.net) {
      return Number(araDeger(toplamNet, a.net, a.puan, b.net, b.puan).toFixed(1));
    }
  }
  return toplamNet > puanli[0].net ? puanli[0].puan : puanli[puanli.length - 1].puan;
}

/** Tabloda geçen en yüksek net (hedef bu değerin üstüne çıkamaz). */
export function tabloMaxNet(tablo: SiralamaTablosu = VARSAYILAN_SIRALAMA_TABLOSU): number {
  return tablo.length ? tablo[0].net : 0;
}

/** Tablo puan hedefini destekliyor mu? */
export function puanDestekli(tablo: SiralamaTablosu = VARSAYILAN_SIRALAMA_TABLOSU): boolean {
  return tablo.filter((s) => s.puan !== null).length >= 2;
}

/**
 * Hedef sıralama → o sıralama için gereken toplam net.
 * `tahminiSiralama`'nın tersi; hedef ekranı besleyen asıl hesap budur.
 */
export function siralamadanNet(
  hedefSiralama: number,
  tablo: SiralamaTablosu = VARSAYILAN_SIRALAMA_TABLOSU,
): number {
  if (!tablo.length) return 0;
  const enIyi = tablo[0];
  const enKotu = tablo[tablo.length - 1];
  if (hedefSiralama <= enIyi.siralama) return enIyi.net;
  if (hedefSiralama >= enKotu.siralama) return enKotu.net;

  for (let i = 0; i < tablo.length - 1; i++) {
    const a = tablo[i];
    const b = tablo[i + 1];
    if (hedefSiralama >= a.siralama && hedefSiralama <= b.siralama) {
      return Math.round(araDeger(hedefSiralama, a.siralama, a.net, b.siralama, b.net));
    }
  }
  return enKotu.net;
}

/** Hedef puan → gereken toplam net (tabloda puan yoksa null). */
export function puandanNet(
  hedefPuan: number,
  tablo: SiralamaTablosu = VARSAYILAN_SIRALAMA_TABLOSU,
): number | null {
  const puanli = tablo.filter((s): s is SiraSatiri & { puan: number } => s.puan !== null);
  if (puanli.length < 2) return null;
  const enIyi = puanli[0];
  const enKotu = puanli[puanli.length - 1];
  if (hedefPuan >= enIyi.puan) return enIyi.net;
  if (hedefPuan <= enKotu.puan) return enKotu.net;

  for (let i = 0; i < puanli.length - 1; i++) {
    const a = puanli[i];
    const b = puanli[i + 1];
    if (hedefPuan <= a.puan && hedefPuan >= b.puan) {
      return Math.round(araDeger(hedefPuan, a.puan, a.net, b.puan, b.net));
    }
  }
  return enKotu.net;
}

/**
 * `id` dersini `delta` kadar değiştirir ve farkı kilitsiz derslere dağıtır.
 * Yeni net haritasını döndürür (girdi mutasyona uğramaz).
 */
export function degistir(
  netler: NetHaritasi,
  maxlar: Record<string, number>,
  kilit: KilitHaritasi,
  id: string,
  delta: number,
): NetHaritasi {
  const nets: NetHaritasi = { ...netler };
  const yeni = kis(nets[id] + delta, 0, maxlar[id] ?? 0);
  let rem = yeni - nets[id];
  if (!rem) return netler;
  nets[id] = yeni;

  const digerler = Object.keys(nets).filter((k) => k !== id && !kilit[k]);
  for (const o of digerler) {
    if (!rem) break;
    if (rem > 0) {
      // Bu derse eklendi → diğerlerinden aynı miktar düşülür
      const al = Math.min(rem, nets[o]);
      nets[o] -= al;
      rem -= al;
    } else {
      // Bu ders kısıldı → fark diğerlerine (max'a kadar) dağıtılır
      const ver = Math.min(-rem, (maxlar[o] ?? 0) - nets[o]);
      nets[o] += ver;
      rem += ver;
    }
  }
  if (rem) nets[id] -= rem; // dengelenemedi → toplamı koru
  return nets;
}

/**
 * Hedef toplamı derslere dağıtır.
 *
 * Kilitli dersler olduğu gibi kalır; kalan bütçe kilitsiz derslere max netleri
 * oranında paylaştırılır. Hedef, kilitler yüzünden tutturulamıyorsa ulaşılabilen
 * en yakın dağılım döner — çağıran taraf farkı kullanıcıya gösterir.
 */
export function hedefeDagit(
  netler: NetHaritasi,
  maxlar: Record<string, number>,
  kilit: KilitHaritasi,
  hedefToplam: number,
): NetHaritasi {
  const idler = Object.keys(netler);
  const acik = idler.filter((k) => !kilit[k]);
  const sonuc: NetHaritasi = { ...netler };
  if (!acik.length) return sonuc;

  const kilitliToplam = idler.filter((k) => kilit[k]).reduce((a, k) => a + netler[k], 0);
  const acikMaxToplam = acik.reduce((a, k) => a + (maxlar[k] ?? 0), 0);
  const butce = kis(hedefToplam - kilitliToplam, 0, acikMaxToplam);

  // Max'a oranlı ilk dağıtım
  for (const k of acik) {
    const pay = acikMaxToplam ? (butce * (maxlar[k] ?? 0)) / acikMaxToplam : 0;
    sonuc[k] = kis(Math.round(pay), 0, maxlar[k] ?? 0);
  }

  // Yuvarlama artığını başlığı olan derslere dağıt
  let fark = butce - acik.reduce((a, k) => a + sonuc[k], 0);
  while (fark !== 0) {
    const aday = acik.find((k) => (fark > 0 ? sonuc[k] < (maxlar[k] ?? 0) : sonuc[k] > 0));
    if (!aday) break;
    sonuc[aday] += fark > 0 ? 1 : -1;
    fark += fark > 0 ? -1 : 1;
  }

  return sonuc;
}

export function toplamNet(netler: NetHaritasi): number {
  return Object.values(netler).reduce((a, b) => a + b, 0);
}
