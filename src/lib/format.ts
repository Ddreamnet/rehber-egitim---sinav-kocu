/** Türkçe yerelleştirme yardımcıları. Tüm sayı/tarih biçimleri buradan geçer. */

import { MARKA } from '@/config/site';

const TR = 'tr-TR';

/** 1284 → "1.284" */
export function sayi(n: number, basamak = 0): string {
  return n.toLocaleString(TR, { minimumFractionDigits: basamak, maximumFractionDigits: basamak });
}

/** 68.4 → "68,4" (net değerleri tek ondalık, virgüllü) */
export function net(n: number): string {
  return n.toLocaleString(TR, { minimumFractionDigits: 1, maximumFractionDigits: 1 });
}

/**
 * Konu ilerleme metni.
 *
 * Hedef bir tavan değil, "konu kapandı" eşiği. Hedefi geçen öğrencide
 * "60/40 soru" yazmak yerine toplam gösterilir.
 */
export function konuIlerlemesi(cozulen: number, hedef: number, durum: string): string {
  if (durum === 'baslanmadi' && !cozulen) return 'başlanmadı';
  if (cozulen >= hedef) return `${sayi(cozulen)} soru`;
  return `${sayi(cozulen)}/${sayi(hedef)} soru`;
}

/**
 * Görüşme türünün okunur karşılığı.
 *
 * DB'de enum değeri ('goruntulu') duruyor; ekranlarda ham değer basılıyordu.
 */
export function gorusmeTuru(t: string): string {
  return { goruntulu: 'görüntülü', yuz_yuze: 'yüz yüze', tanisma: 'tanışma' }[t] ?? t;
}

/** +3,5 / −1,2 — işaretli değişim */
export function degisim(n: number): string {
  const s = net(Math.abs(n));
  if (n > 0) return `+${s}`;
  if (n < 0) return `−${s}`;
  return s;
}

/** 0.66 → "%66" */
export function yuzde(oran: number): string {
  return `%${Math.round(oran * 100)}`;
}

/** Net = doğru − yanlış / 4 */
export function netHesapla(dogru: number, yanlis: number): number {
  return dogru - yanlis / 4;
}

function fmt(opts: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat(TR, { timeZone: MARKA.zamanDilimi, ...opts });
}

/** "17 Ağustos 2026" */
export function tarihUzun(d: Date | string): string {
  return fmt({ day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(d));
}

/** "17 Ağu" */
export function tarihKisa(d: Date | string): string {
  return fmt({ day: 'numeric', month: 'short' }).format(new Date(d));
}

/** "Pazartesi" */
export function gunAdi(d: Date | string): string {
  return fmt({ weekday: 'long' }).format(new Date(d));
}

/** "19.00" — Türkçe saat gösterimi nokta ile */
export function saat(d: Date | string): string {
  return fmt({ hour: '2-digit', minute: '2-digit', hour12: false })
    .format(new Date(d))
    .replace(':', '.');
}

/** "Pazartesi · 19.00" */
export function gunSaat(d: Date | string): string {
  return `${gunAdi(d)} · ${saat(d)}`;
}

/** Tarih bloğu için: { gun: "17", ay: "AĞU" } */
export function tarihBlogu(d: Date | string): { gun: string; ay: string } {
  const t = new Date(d);
  return {
    gun: fmt({ day: 'numeric' }).format(t),
    ay: fmt({ month: 'short' }).format(t).replace('.', '').toLocaleUpperCase(TR),
  };
}

/** "Bugün 14.20" / "Dün 20.05" / "13 Ağu 18.40" */
export function goreliZaman(d: Date | string, simdi: Date = new Date()): string {
  const t = new Date(d);
  const gunFarki = Math.round(
    (new Date(simdi.toDateString()).getTime() - new Date(t.toDateString()).getTime()) / 86400000,
  );
  if (gunFarki === 0) return `Bugün ${saat(t)}`;
  if (gunFarki === 1) return `Dün ${saat(t)}`;
  return `${tarihKisa(t)} ${saat(t)}`;
}

/** Ad Soyad → "AS" */
export function basHarfler(ad: string): string {
  return ad
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0] ?? '')
    .join('')
    .toLocaleUpperCase(TR);
}
