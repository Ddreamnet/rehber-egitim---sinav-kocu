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

/**
 * İletişim bilgileri — sitede tek kaynak.
 *
 * Sitede hiçbir telefon, e-posta ya da adres yoktu; üstelik gizlilik metni
 * "başvuru sayfasındaki iletişim bilgilerinden ulaşabilirsin" diyordu ama orada
 * böyle bir bilgi yoktu. Buradaki alanlar dolduruldukça alt bilgide ve yasal
 * sayfalarda kendiliğinden görünür; boş bırakılanlar hiç basılmaz.
 *
 * KVKK ve mesafeli satış mevzuatı `unvan` ve `adres` alanlarının dolu olmasını
 * bekler — reklam öncesi doldurulması gereken yer burasıdır.
 */
export interface Iletisim {
  unvan: string;
  eposta: string;
  telefon: string;
  adres: string;
  vergi: string;
}

export const ILETISIM: Iletisim = {
  /** Ticari unvan (ör. "Ad Soyad — Şahıs İşletmesi" ya da şirket unvanı) */
  unvan: '',
  eposta: '',
  /** Uluslararası biçimde: +90 5xx xxx xx xx */
  telefon: '',
  adres: '',
  /** Varsa vergi dairesi ve numarası / MERSİS */
  vergi: '',
};

/** En az bir iletişim kanalı tanımlı mı? */
export const iletisimVar = () =>
  Boolean(ILETISIM.eposta || ILETISIM.telefon || ILETISIM.adres);

/**
 * Yasal metinlerin son güncellenme tarihi.
 *
 * Sayfa altındaki tarih `new Date()` ile basılıyordu, yani metin aylardır
 * değişmemiş olsa bile HER GÜN o günü gösteriyordu. Metin değiştiğinde bu
 * sabit elle güncellenir.
 */
export const YASAL_GUNCELLEME = '2026-08-23';

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

/** Sınava hazırlanmayan öğrenciler için hedef alan değeri. */
export const OKUL_ALANI = 'Okul müfredatı';

/** "10. sınıf" → 10. Tanınmayan değerlerde null. */
export function sinifNo(sinif?: string | null): number | null {
  const m = /(\d{1,2})/.exec(sinif ?? '');
  const n = m ? Number(m[1]) : Number.NaN;
  return n >= 5 && n <= 12 ? n : null;
}

/**
 * Öğrencinin çalışma programı.
 *
 * Platform yalnız YKS ve LGS adaylarını tanıyordu; sınava hazırlanmayan bir
 * öğrenci (ör. hedefi "düzenli çalışmak" olan 9. sınıf) hangi müfredatı
 * göreceği belli olmadığı için TYT'ye düşüyordu. `duzey` programında geri
 * sayım yok, müfredat öğrencinin sınıfından geliyor.
 */
export type Program =
  | {
      tur: 'sinav';
      sinav: SinavKodu;
      ad: string;
      /** Öğrencinin gireceği oturumlar, TYT önce. Boşsa sınavın tüm oturumları. */
      oturumKodlari: string[];
    }
  | { tur: 'duzey'; oturumKodu: string; ad: string };

/**
 * Alan → AYT oturumu.
 *
 * Alan bilgisi yalnız etiket olarak duruyordu: Sözel öğrenci de müfredatta ve
 * koçun konu seçicisinde AYT Sayısal'ı görüyordu.
 */
const ALAN_OTURUMLARI: Array<[RegExp, string[]]> = [
  [/sayısal/, ['tyt', 'ayt-say']],
  [/eşit/, ['tyt', 'ayt-ea']],
  [/sözel/, ['tyt', 'ayt-soz']],
  [/^dil$|yabancı dil/, ['tyt', 'ydt']],
];

export function ogrenciProgrami(kisi?: { hedefAlan?: string | null; sinif?: string | null } | null): Program {
  const alan = (kisi?.hedefAlan ?? '').toLocaleLowerCase('tr-TR').trim();
  const no = sinifNo(kisi?.sinif);

  if (alan.includes('okul')) {
    const sinif = no ?? 9;
    return { tur: 'duzey', oturumKodu: `sinif-${sinif}`, ad: `${sinif}. sınıf müfredatı` };
  }
  // Ortaokul (5-7) sınav adayı olamaz; hedef alan seçilmemişse de düzeye düşer.
  if (no !== null && no <= 7) {
    return { tur: 'duzey', oturumKodu: `sinif-${no}`, ad: `${no}. sınıf müfredatı` };
  }
  if (alan.includes('lgs') || no === 8) return { tur: 'sinav', sinav: 'lgs', ad: 'LGS', oturumKodlari: ['lgs'] };

  const eslesen = ALAN_OTURUMLARI.find(([kalip]) => kalip.test(alan))?.[1] ?? [];
  return { tur: 'sinav', sinav: 'yks', ad: 'YKS', oturumKodlari: eslesen };
}

/**
 * Öğrencinin görmesi gereken oturumlar.
 *
 * Süzme üç ekranda ayrı ayrı yazılıydı ve yalnız `sinavKodu`ya bakıyordu;
 * sınav adayı olmayan öğrencide hiçbiri eşleşmeyip liste TYT'ye düşüyordu.
 */
export function oturumSuz<T extends { kod: string; sinavKodu: string; tur: 'sinav' | 'duzey' }>(
  hepsi: T[],
  kisi?: { hedefAlan?: string | null; sinif?: string | null } | null,
): T[] {
  const program = ogrenciProgrami(kisi);

  if (program.tur === 'duzey') {
    const kendi = hepsi.filter((o) => o.kod === program.oturumKodu);
    return kendi.length ? kendi : hepsi;
  }

  // Alan seçilmişse yalnız o alanın oturumları, TYT başta.
  if (program.oturumKodlari.length) {
    const kendi = program.oturumKodlari
      .map((k) => hepsi.find((o) => o.kod === k))
      .filter((o): o is T => Boolean(o));
    if (kendi.length) return kendi;
  }

  const sinavinkiler = hepsi.filter((o) => o.tur === 'sinav' && o.sinavKodu === program.sinav);
  return sinavinkiler.length ? sinavinkiler : hepsi;
}

/**
 * Öğrencinin hazırlandığı sınav; sınava hazırlanmıyorsa null.
 *
 * Panelde iki geri sayım birden gösteriliyordu; YKS öğrencisine LGS sayacı,
 * LGS öğrencisine YKS sayacı gereksiz — sınav adayı olmayana ikisi de.
 */
export function ogrenciSinavi(kisi?: { hedefAlan?: string | null; sinif?: string | null } | null): SinavKodu | null {
  const p = ogrenciProgrami(kisi);
  return p.tur === 'sinav' ? p.sinav : null;
}

/**
 * Öğrencinin puan türü — Net Denge hesabının anahtarı.
 *
 * Sıralama tahmini puan türü başına yapılır: 2026'da Sayısal'da 440 puan
 * 22.370. sıra, Sözel'de 214. sıra. Sınava hazırlanmayan öğrencide null döner
 * (o öğrenciye sıralama tahmini gösterilmez).
 */
export type PuanTuru = 'tyt' | 'say' | 'ea' | 'soz' | 'dil' | 'lgs';

const ALAN_PUAN_TURU: Array<[RegExp, PuanTuru]> = [
  [/sayısal/, 'say'],
  [/eşit/, 'ea'],
  [/sözel/, 'soz'],
  [/^dil$|yabancı dil/, 'dil'],
];

export function ogrenciPuanTuru(
  kisi?: { hedefAlan?: string | null; sinif?: string | null } | null,
): PuanTuru | null {
  const program = ogrenciProgrami(kisi);
  if (program.tur === 'duzey') return null;
  if (program.sinav === 'lgs') return 'lgs';

  const alan = (kisi?.hedefAlan ?? '').toLocaleLowerCase('tr-TR').trim();
  const eslesen = ALAN_PUAN_TURU.find(([kalip]) => kalip.test(alan))?.[1];
  // Alanını henüz seçmemiş YKS öğrencisi TYT üzerinden ilerler.
  return eslesen ?? 'tyt';
}

/** Puan türünün netlerini topladığı oturumlar — TYT her zaman hesaba girer. */
export const PUAN_TURU_OTURUMLARI: Record<PuanTuru, string[]> = {
  tyt: ['tyt'],
  say: ['tyt', 'ayt-say'],
  ea: ['tyt', 'ayt-ea'],
  soz: ['tyt', 'ayt-soz'],
  dil: ['tyt', 'ydt'],
  lgs: ['lgs'],
};

/** Net Denge verisinin dayandığı sınav yılı. Yeni veri geldiğinde tek yer burası. */
export const PUAN_VERISI_YILI = 2026;

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
 * Fark görüşme sıklığında; takip sistemi ve seminerler ikisinde de var.
 */
export interface Paket {
  kod: 'standart' | 'siki-takip';
  ad: string;
  /** Haftalık birebir görüşme sayısı */
  haftalikGorusme: number;
  aylikUcret: number;
  /** Bugünden sınav gününe tek seferlik ücret */
  sinavaKadarUcret: number;
  vurgu: string;
  onerilen: boolean;
  ozellikler: string[];
}

export const PAKETLER: Paket[] = [
  {
    kod: 'standart',
    ad: 'Standart',
    haftalikGorusme: 1,
    aylikUcret: 4000,
    sinavaKadarUcret: 36000,
    vurgu: 'Haftalık ritmi kurmak ve korumak için. Çoğu öğrenciye bu tempo yetiyor.',
    onerilen: false,
    ozellikler: [
      'Haftada 1 birebir koç görüşmesi',
      'Haftalık ders programı + günlük konu ve soru takibi',
      'Net Denge, müfredat ve ilerleme paneli',
      'Veli paneli ve haftalık özet',
      'Seminerlere ücretsiz katılım',
    ],
  },
  {
    kod: 'siki-takip',
    ad: 'Sıkı takip',
    haftalikGorusme: 2,
    aylikUcret: 6000,
    sinavaKadarUcret: 55000,
    vurgu: 'Hafta ortasında da bir kontrol noktası. Tempo düşünce toparlamak kolaylaşıyor.',
    onerilen: true,
    ozellikler: [
      'Haftada 2 birebir koç görüşmesi',
      'Standart paketin tamamı',
      'Hafta ortası plan revizyonu',
      'Her deneme sonrası analiz oturumu',
      'Seminerlere ücretsiz katılım',
    ],
  },
];

/**
 * Başvuru formu seçenekleri.
 *
 * Form, admin'e giden e-posta metni ve veritabanı kaydı aynı listeden okur;
 * seçenek eklemek/çıkarmak için tek yer burası.
 */
export const BASVURU_SINIFLARI = [
  { deger: '5', etiket: '5. Sınıf' },
  { deger: '6', etiket: '6. Sınıf' },
  { deger: '7', etiket: '7. Sınıf' },
  { deger: '8', etiket: '8. Sınıf (LGS)' },
  { deger: '9', etiket: '9. Sınıf' },
  { deger: '10', etiket: '10. Sınıf' },
  { deger: '11', etiket: '11. Sınıf' },
  { deger: '12', etiket: '12. Sınıf (YKS)' },
  { deger: 'mezun', etiket: 'Mezun' },
] as const;

export type BasvuruSinifi = (typeof BASVURU_SINIFLARI)[number]['deger'];

export const BASVURU_ALANLARI = [
  { deger: 'say', etiket: 'Sayısal (SAY)' },
  { deger: 'ea', etiket: 'Eşit Ağırlık (EA)' },
  { deger: 'soz', etiket: 'Sözel (SÖZ)' },
] as const;

export type BasvuruAlani = (typeof BASVURU_ALANLARI)[number]['deger'];

/** Alan sorusu yalnız bu sınıflara sorulur; altındakiler henüz alan seçmedi. */
export const ALAN_SORULAN_SINIFLAR: readonly string[] = ['11', '12', 'mezun'];

export const BASVURU_PROGRAMLARI = [
  { deger: 'lgs', etiket: 'LGS Koçluğu' },
  { deger: 'ara', etiket: 'Ara Sınıflar Koçluğu' },
  { deger: 'yks', etiket: 'YKS Koçluğu' },
] as const;

export type BasvuruProgrami = (typeof BASVURU_PROGRAMLARI)[number]['deger'];

/**
 * Sınıfa göre önerilen program — seçilince otomatik işaretlenir, öğrenci
 * değiştirebilir. 8 → LGS, 11/12/mezun → YKS, kalanı ara sınıf.
 */
export function sinifaGoreProgram(sinif: string): BasvuruProgrami {
  if (sinif === '8') return 'lgs';
  if (ALAN_SORULAN_SINIFLAR.includes(sinif)) return 'yks';
  return 'ara';
}

/** İlgilenilen paket — fiyatlar PAKETLER'den gelir, "kararsızım" her zaman sonda. */
export const BASVURU_PAKET_KARARSIZ = 'kararsiz';

export function basvuruPaketSecenekleri(): Array<{ deger: string; etiket: string }> {
  return [
    ...PAKETLER.map((p) => ({
      deger: p.kod,
      etiket: `${p.ad} — haftada ${p.haftalikGorusme} görüşme (${p.aylikUcret.toLocaleString('tr-TR')} ₺/ay)`,
    })),
    { deger: BASVURU_PAKET_KARARSIZ, etiket: 'Kararsızım, bilgi almak istiyorum' },
  ];
}

/** Seçenek değerini e-postada okunur etikete çevirir. */
export function basvuruEtiketi(
  liste: ReadonlyArray<{ deger: string; etiket: string }>,
  deger: string | undefined,
): string {
  return liste.find((s) => s.deger === deger)?.etiket ?? '—';
}

/**
 * Başvuruyu admin'e ileten form servisi (Formspree). Formun kayıtlı olduğu
 * adrese mail gider; adresi değiştirmek için Formspree panelinden yeterli.
 */
export const BASVURU_FORM_ENDPOINT =
  (import.meta.env.VITE_BASVURU_ENDPOINT as string | undefined) || 'https://formspree.io/f/mrpzaojo';

/**
 * Paketlere dahil seminerler — uzman psikolojik danışmanlar veriyor.
 * Landing ve "Nasıl çalışır" sayfasında tek kaynaktan gösterilir.
 */
export const SEMINERLER = [
  {
    baslik: 'Sınav kaygısını yönetme',
    metin: 'Kaygıyı yok saymak yerine tanımak: sınav anında ve öncesinde işe yarayan nefes, odak ve prova teknikleri.',
  },
  {
    baslik: 'Zamanı yönetme',
    metin: 'Gerçekçi bir gün planı nasıl kurulur, erteleme döngüsü nasıl kırılır, ders arası nasıl dinlendirir.',
  },
  {
    baslik: 'İç motivasyonu geliştirme',
    metin: 'Dışarıdan gelen baskı yerine kendi sebebini bulmak: hedefi anlamlandırma ve süreklilik kurma.',
  },
  {
    baslik: 'Verimli çalışma ve dikkat',
    metin: 'Dikkat süresini uzatmak, dikkat dağıtıcıları azaltmak ve tekrar aralıklarını doğru kurmak.',
  },
] as const;
