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

// ---------- Telefon ----------

/**
 * Girdiden ülke kodunu ve şehirlerarası 0'ı atıp 10 haneli yerel numarayı verir.
 * "+90 532 …", "0090…", "0532…", "532…" hepsi aynı sonucu döndürür.
 */
function yerelHaneler(ham: string): string {
  let rakam = ham.replace(/\D/g, '');
  if (rakam.startsWith('00')) rakam = rakam.slice(2);
  if (rakam.startsWith('90')) rakam = rakam.slice(2);
  else if (rakam.startsWith('0')) rakam = rakam.slice(1);
  return rakam.slice(0, 10);
}

/**
 * Numarayı 10 haneli yerel forma indirger: "5321234567".
 *
 * Başvuru formu numaraları reddediyordu; artık +90, 0090, 90 ve 0 önekleriyle
 * boşluk/parantez/tire hepsi kabul edilip aynı forma çevriliyor. Cep ve sabit
 * hat ayrımı yapılmaz. Tanınmayan girdide null döner.
 */
export function telefonNormalle(ham: string): string | null {
  const rakam = yerelHaneler(ham);
  return rakam.length === 10 ? rakam : null;
}

/**
 * Yazarken biçimleme — kullanıcının yazdığı öneki olduğu gibi korur.
 *
 * Önek zorla "0"a çevrilseydi kutunun kendi değeri girdiye geri beslendiği için
 * "+90" yazan kullanıcıda ülke kodu bir sonraki tuşta tanınamaz hale gelirdi
 * ("+9" → "09" → "090" …). Bu yüzden önek ayrıştırılıp aynen geri yazılıyor.
 */
export function telefonBicimle(ham: string): string {
  const haneler = ham.replace(/\D/g, '');
  const arti = ham.trimStart().startsWith('+');
  if (!haneler) return arti ? '+' : '';

  let onek = '';
  let rakam = haneler;
  if (rakam.startsWith('00')) {
    onek = '00';
    rakam = rakam.slice(2);
  }
  if (rakam.startsWith('90')) {
    onek += '90';
    rakam = rakam.slice(2);
  } else if (!onek && rakam.startsWith('0')) {
    onek = '0';
    rakam = rakam.slice(1);
  }

  const govde = govdeyiBol(rakam.slice(0, 10));
  const bas = (arti ? '+' : '') + onek;
  if (!bas) return govde;
  // Şehirlerarası 0 numaraya bitişik, ülke kodundan sonra boşluk var.
  if (bas === '0') return `0${govde}`;
  return govde ? `${bas} ${govde}` : bas;
}

/** Kayıtlı 10 haneli numarayı gösterime çevirir: "5321234567" → "0532 123 45 67". */
export function telefonGoster(yerel: string): string {
  const rakam = yerelHaneler(yerel);
  return rakam ? `0${govdeyiBol(rakam)}` : '';
}

/** "5321234567" → "532 123 45 67" */
function govdeyiBol(rakam: string): string {
  return [rakam.slice(0, 3), rakam.slice(3, 6), rakam.slice(6, 8), rakam.slice(8, 10)]
    .filter(Boolean)
    .join(' ');
}
