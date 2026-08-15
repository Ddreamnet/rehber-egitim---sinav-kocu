/**
 * Net Denge — ürünün imza hesaplayıcısı.
 *
 * Davranış tasarım dosyasındaki (`Ogrenci Paneli.dc.html`) `degistir()` ve `sira()`
 * fonksiyonlarından birebir taşındı: bir ders değişince fark yalnızca KİLİTSİZ
 * derslere dağıtılır, toplam sabit kalır; dengelenemeyen artık geri alınır.
 */

export interface DersDurumu {
  id: string;
  net: number;
  max: number;
  kilitli: boolean;
}

/** Ders id → net */
export type NetHaritasi = Record<string, number>;
/** Ders id → kilitli mi */
export type KilitHaritasi = Record<string, boolean>;

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
  const yeni = Math.max(0, Math.min(maxlar[id] ?? 0, nets[id] + delta));
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
 * Toplam net → tahmini sıralama.
 * Tablo geçen yılın yerleştirme verisiyle değiştirilecek (`net_siralama_tablosu`).
 * Sonuç her zaman "tahmini" etiketiyle gösterilir — garanti değildir.
 */
export type SiralamaTablosu = Array<[net: number, siralama: number]>;

export const VARSAYILAN_SIRALAMA_TABLOSU: SiralamaTablosu = [
  [110, 5000],
  [100, 15000],
  [90, 52000],
  [80, 110000],
  [70, 210000],
  [60, 380000],
  [50, 650000],
  [0, 2400000],
];

export function tahminiSiralama(
  toplamNet: number,
  tablo: SiralamaTablosu = VARSAYILAN_SIRALAMA_TABLOSU,
): number {
  for (let i = 0; i < tablo.length - 1; i++) {
    const [n1, r1] = tablo[i];
    const [n2, r2] = tablo[i + 1];
    if (toplamNet <= n1 && toplamNet >= n2) {
      return Math.round((r1 + ((n1 - toplamNet) / (n1 - n2)) * (r2 - r1)) / 500) * 500;
    }
  }
  return tablo[0][1];
}

export function toplamNet(netler: NetHaritasi): number {
  return Object.values(netler).reduce((a, b) => a + b, 0);
}
