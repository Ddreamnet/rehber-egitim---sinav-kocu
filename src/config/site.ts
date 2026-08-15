/**
 * Ürün konfigürasyonu — sınav tarihleri, marka, ders renkleri.
 * Tarihler .env üzerinden değiştirilebilir (VITE_YKS_TARIHI / VITE_LGS_TARIHI).
 */

export const MARKA = {
  /** Ana ad — logoda ve başlıklarda tek başına kullanılır */
  ad: 'Rehber',
  /** Ana adın altında/yanında duran tanım */
  altAd: 'Eğitim & Sınav Koçu',
  /** İkisi birlikte — sayfa başlığı, yasal metinler, e-posta imzası */
  tamAd: 'Rehber Eğitim & Sınav Koçu',
  slogan: 'YKS ve LGS’de haftalık koçluk: doğru konu, doğru hafta.',
  alanAdi: 'rehbersinavkocu.com',
  site: 'https://rehbersinavkocu.com',
  instagram: 'https://www.instagram.com/rehbersinavkocu/',
  instagramKullanici: '@rehbersinavkocu',
  zamanDilimi: 'Europe/Istanbul',
} as const;

export type SinavKodu = 'yks' | 'lgs';

export interface SinavTanimi {
  kod: SinavKodu;
  ad: string;
  yil: number;
  /** ISO 8601, +03:00 ofsetiyle */
  tarih: string;
  /** Kartlarda gösterilen kısa tarih */
  etiket: string;
}

export const SINAVLAR: Record<SinavKodu, SinavTanimi> = {
  yks: {
    kod: 'yks',
    ad: 'YKS',
    yil: 2027,
    tarih: import.meta.env.VITE_YKS_TARIHI || '2027-06-20T10:15:00+03:00',
    etiket: '20 Haziran, Pazar',
  },
  lgs: {
    kod: 'lgs',
    ad: 'LGS',
    yil: 2027,
    tarih: import.meta.env.VITE_LGS_TARIHI || '2027-06-06T09:30:00+03:00',
    etiket: '6 Haziran, Pazar',
  },
};

/** Sınava bu kadar gün kalınca sayaç amber'e döner (goal-gradient). */
export const ACILIYET_ESIGI_GUN = 30;

/** Ders renkleri — aynı ders her yerde aynı renk. tokens.css'teki değişkenler. */
export const DERS_RENKLERI = {
  turkce: 'var(--ders-turkce)',
  matematik: 'var(--ders-matematik)',
  fen: 'var(--ders-fen)',
  sosyal: 'var(--ders-sosyal)',
  dil: 'var(--ders-dil)',
} as const;

export type DersRengiAnahtari = keyof typeof DERS_RENKLERI;

/** Ders adından renge — DB'den gelen adlarla eşleşir. */
const AD_RENK: Array<[RegExp, DersRengiAnahtari]> = [
  [/türkçe|turkce|edebiyat|paragraf/i, 'turkce'],
  [/matematik|geometri/i, 'matematik'],
  [/fen|fizik|kimya|biyoloji/i, 'fen'],
  [/sosyal|tarih|coğrafya|cografya|felsefe|din|inkılap/i, 'sosyal'],
  [/dil|ingilizce|yabancı/i, 'dil'],
];

export function dersRengi(ad: string | null | undefined): string {
  if (!ad) return DERS_RENKLERI.sosyal;
  const eslesme = AD_RENK.find(([re]) => re.test(ad));
  return DERS_RENKLERI[eslesme ? eslesme[1] : 'sosyal'];
}

/** Herkese açık site navigasyonu (4–7 öğe kuralı). */
export const SITE_NAV = [
  { etiket: 'Nasıl çalışır', yol: '/nasil-calisir' },
  { etiket: 'Blog', yol: '/blog' },
] as const;

/**
 * Paketler — fiyatların tek kaynağı.
 * Üçünde de aynı hizmet var; fark yalnızca birlikte yürünen süre.
 */
export interface Paket {
  kod: 'aylik' | 'donemlik' | 'tam-surec';
  ad: string;
  aylikUcret: number;
  /** Taahhüt süresi; aylıkta yok */
  sureAy?: number;
  vurgu: string;
  onerilen: boolean;
  ozellikler: string[];
}

export const PAKETLER: Paket[] = [
  {
    kod: 'aylik',
    ad: 'Aylık',
    aylikUcret: 4000,
    vurgu: 'Ritmi görmek, sistemi denemek için. Taahhüt yok, istediğin ay bırakırsın.',
    onerilen: false,
    ozellikler: [
      'Haftada 1 birebir koç görüşmesi',
      'Haftalık plan + günlük konu ve soru takibi',
      'Net Denge ve müfredat paneli',
      'Veli paneli',
    ],
  },
  {
    kod: 'donemlik',
    ad: 'Dönemlik',
    aylikUcret: 3500,
    sureAy: 4,
    vurgu: 'Bir dönemi baştan sona planlamak için. Konu sırası dönem başında kurulur.',
    onerilen: false,
    ozellikler: [
      'Aylık paketin tamamı',
      'Dönem başı hedef ve müfredat kurulumu',
      'Her deneme sonrası analiz oturumu',
      'Veliye haftalık rapor',
    ],
  },
  {
    kod: 'tam-surec',
    ad: 'Sınava kadar',
    aylikUcret: 3000,
    vurgu: 'Bugünden sınav gününe tek plan. Süreç bölünmediği için tekrar ve deneme takvimi baştan kurulur.',
    onerilen: true,
    ozellikler: [
      'Dönemlik paketin tamamı',
      'Sınav haftası programı ve son tekrar planı',
      'Tercih dönemi desteği',
      'Süre boyunca sabit fiyat',
    ],
  },
];
