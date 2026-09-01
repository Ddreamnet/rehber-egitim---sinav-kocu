/**
 * Net Denge'nin dayandığı gerçek sınav verisi — pakete gömülü kopya.
 *
 * Aynı veri `supabase/migrations/0020_gercek_puan_verisi.sql` ile veritabanına da
 * yazılır. Buradaki kopyanın iki işi var:
 *   1. Supabase yapılandırılmamışken (landing'deki deneme kutusu, demo modu)
 *      ekranın gerçek sayılarla çalışması.
 *   2. DB'de o yılın satırı yoksa yedeğe düşmek.
 * Eskiden buradaki yedek uydurma çapalardan oluşuyordu; artık kaynağı belli.
 *
 * KAYNAKLAR
 *   YKS  ÖSYM, "2026-YKS Sayısal Bilgiler" — s.11 sınav puanı, s.12 yerleştirme
 *        puanı yığınsal dağılımları.
 *        https://cdn.osym.gov.tr/pdfdokuman/2026/YKS/SB/sayisal_ykdd21072026.pdf
 *   LGS  MEB ÖDSGM, "2026 LGS Kapsamında Merkezî Sınav Raporu" (Tablo 7 ağırlık
 *        katsayıları, Tablo 8 test istatistikleri) ve "2026 LGS Yerleştirme
 *        Raporu" (ilk %5'lik dilim: 43.850 öğrenci).
 *        https://odsgm.meb.gov.tr/www/2026-lgs-kapsaminda-merkezi-sinav-raporu/icerik/1695/tr
 *
 * Yığınsal dağılımda "X puan ve üstü: N aday" satırındaki N, o puanın başarı
 * sırasıdır — tahmin değil, sayım.
 */

import type { DagilimNoktasi, PuanModeli } from '@/lib/netDenge';

const nokta = (satirlar: Array<[number, number]>): DagilimNoktasi[] =>
  satirlar.map(([puan, kumulatifAday]) => ({ puan, kumulatifAday }));

const OSYM_2026 = 'https://cdn.osym.gov.tr/pdfdokuman/2026/YKS/SB/sayisal_ykdd21072026.pdf';
const OSYM_KAYNAK = 'ÖSYM 2026-YKS Sayısal Bilgiler — yığınsal puan dağılımı';

// ---------- YKS yığınsal dağılımları (ÖSYM 2026) ----------

const SINAV_DAGILIMI: Record<string, DagilimNoktasi[]> = {
  tyt: nokta([
    [500, 5], [480, 822], [460, 5524], [440, 17050], [420, 37770], [400, 67394],
    [380, 106404], [360, 155008], [340, 218156], [320, 302758], [300, 417935],
    [280, 577094], [260, 787244], [240, 1045340], [220, 1332391], [200, 1630698],
    [180, 1914717], [160, 2125244], [140, 2184873], [120, 2187723], [100, 2187743],
  ]),
  say: nokta([
    [500, 1], [480, 1453], [460, 8786], [440, 22370], [420, 39624], [400, 58728],
    [380, 78806], [360, 100553], [340, 125045], [320, 153304], [300, 187034],
    [280, 228643], [260, 279885], [240, 344536], [220, 430074], [200, 549793],
    [180, 721488], [160, 923753], [140, 1078515], [120, 1134006], [100, 1135718],
  ]),
  soz: nokta([
    [500, 1], [480, 10], [460, 74], [440, 214], [420, 560], [400, 1418],
    [380, 3936], [360, 10259], [340, 23653], [320, 47292], [300, 86560],
    [280, 148959], [260, 238848], [240, 360487], [220, 515916], [200, 699304],
    [180, 873860], [160, 998826], [140, 1065157], [120, 1084720], [100, 1085698],
  ]),
  ea: nokta([
    [500, 1], [480, 52], [460, 307], [440, 874], [420, 2097], [400, 4545],
    [380, 9486], [360, 23452], [340, 50608], [320, 89520], [300, 140784],
    [280, 210499], [260, 308127], [240, 440752], [220, 615366], [200, 832251],
    [180, 1069239], [160, 1272506], [140, 1391240], [120, 1420558], [100, 1421290],
  ]),
  dil: nokta([
    [500, 5], [480, 118], [460, 628], [440, 1795], [420, 3632], [400, 6683],
    [380, 11576], [360, 18265], [340, 26469], [320, 35020], [300, 43883],
    [280, 52590], [260, 61992], [240, 72025], [220, 82982], [200, 94735],
    [180, 107579], [160, 120099], [140, 128950], [120, 132443], [100, 132826],
  ]),
};

const YERLESTIRME_DAGILIMI: Record<string, DagilimNoktasi[]> = {
  tyt: nokta([
    [550, 112], [530, 2045], [510, 8638], [490, 22600], [470, 45313], [450, 76021],
    [430, 115071], [410, 163211], [390, 225038], [370, 305570], [350, 412011],
    [330, 553526], [310, 735519], [290, 961261], [270, 1219171], [250, 1499060],
    [230, 1782951], [210, 2033331], [190, 2166477], [170, 2186977], [150, 2187734],
    [130, 2187742], [115, 2187743],
  ]),
  say: nokta([
    [550, 154], [530, 3500], [510, 12887], [490, 27402], [470, 44919], [450, 63669],
    [430, 83511], [410, 105112], [390, 129485], [370, 157778], [350, 191247],
    [330, 232317], [310, 282213], [290, 344726], [270, 425443], [250, 533920],
    [230, 681176], [210, 858167], [190, 1019046], [170, 1117304], [150, 1135198],
    [130, 1135713], [115, 1135718],
  ]),
  soz: nokta([
    [550, 4], [530, 14], [510, 69], [490, 221], [470, 606], [450, 1566],
    [430, 4058], [410, 10184], [390, 22750], [370, 45237], [350, 82479],
    [330, 140496], [310, 223004], [290, 333238], [270, 474443], [250, 642816],
    [230, 814264], [210, 953036], [190, 1040347], [170, 1078859], [150, 1085505],
    [130, 1085697], [115, 1085698],
  ]),
  ea: nokta([
    [550, 12], [530, 98], [510, 394], [490, 1118], [470, 2482], [450, 5299],
    [430, 12363], [410, 29700], [390, 58772], [370, 97839], [350, 148570],
    [330, 215631], [310, 307918], [290, 429479], [270, 585271], [250, 775922],
    [230, 990764], [210, 1196809], [190, 1347025], [170, 1412649], [150, 1421093],
    [130, 1421289], [115, 1421290],
  ]),
  dil: nokta([
    [550, 14], [530, 231], [510, 942], [490, 2252], [470, 4241], [450, 7472],
    [430, 12254], [410, 18566], [390, 26352], [370, 34585], [350, 43129],
    [330, 51784], [310, 60948], [290, 70670], [270, 81109], [250, 92274],
    [230, 104127], [210, 116152], [190, 125789], [170, 131233], [150, 132714],
    [130, 132825], [115, 132826],
  ]),
};

// ---------- Net katsayıları ----------
// puan = tabanPuan + Σ (net × katsayı). Ders adları `subjects.ad` ile eşleşir.
// Her puan türünde tüm netler tam iken sonuç 500'e oturur (doğrulama: TYT 503,5 ·
// SAY 502,3 · EA 513,6 · SÖZ 498,4 · DİL 501,2 · LGS 499,9 — tavan 500'e kırpılır).

const TYT_DERSLERI = (t: number, s: number, m: number, f: number) => [
  { oturumKod: 'tyt', dersAd: 'Türkçe', katsayi: t },
  { oturumKod: 'tyt', dersAd: 'Sosyal Bilimler', katsayi: s },
  { oturumKod: 'tyt', dersAd: 'Matematik', katsayi: m },
  { oturumKod: 'tyt', dersAd: 'Fen Bilimleri', katsayi: f },
];

export const PUAN_MODELLERI: Record<string, PuanModeli> = {
  tyt: {
    yil: 2026, puanTuru: 'tyt', ad: 'TYT', sinavKod: 'yks',
    tabanPuan: 150.29, tavanPuan: 500, obpKatsayi: 0.12, guven: 'resmi',
    kaynak: OSYM_KAYNAK, kaynakUrl: OSYM_2026,
    katsayilar: TYT_DERSLERI(2.75, 3.08, 3.3, 2.48),
    sinavDagilimi: SINAV_DAGILIMI.tyt,
    yerlestirmeDagilimi: YERLESTIRME_DAGILIMI.tyt,
  },
  say: {
    yil: 2026, puanTuru: 'say', ad: 'Sayısal (SAY)', sinavKod: 'yks',
    tabanPuan: 124.82, tavanPuan: 500, obpKatsayi: 0.12, guven: 'resmi',
    kaynak: OSYM_KAYNAK, kaynakUrl: OSYM_2026,
    katsayilar: [
      ...TYT_DERSLERI(1.23, 1.24, 1.61, 1.08),
      { oturumKod: 'ayt-say', dersAd: 'Matematik', katsayi: 2.83 },
      { oturumKod: 'ayt-say', dersAd: 'Fizik', katsayi: 2.58 },
      { oturumKod: 'ayt-say', dersAd: 'Kimya', katsayi: 2.55 },
      { oturumKod: 'ayt-say', dersAd: 'Biyoloji', katsayi: 2.69 },
    ],
    sinavDagilimi: SINAV_DAGILIMI.say,
    yerlestirmeDagilimi: YERLESTIRME_DAGILIMI.say,
  },
  ea: {
    yil: 2026, puanTuru: 'ea', ad: 'Eşit Ağırlık (EA)', sinavKod: 'yks',
    tabanPuan: 125.27, tavanPuan: 500, obpKatsayi: 0.12, guven: 'resmi',
    kaynak: OSYM_KAYNAK, kaynakUrl: OSYM_2026,
    katsayilar: [
      ...TYT_DERSLERI(1.14, 1.38, 1.43, 1.16),
      { oturumKod: 'ayt-ea', dersAd: 'Matematik', katsayi: 2.94 },
      { oturumKod: 'ayt-ea', dersAd: 'Türk Dili ve Edebiyatı', katsayi: 3.31 },
      { oturumKod: 'ayt-ea', dersAd: 'Tarih-1', katsayi: 2.37 },
      { oturumKod: 'ayt-ea', dersAd: 'Coğrafya-1', katsayi: 2.33 },
    ],
    sinavDagilimi: SINAV_DAGILIMI.ea,
    yerlestirmeDagilimi: YERLESTIRME_DAGILIMI.ea,
  },
  soz: {
    yil: 2026, puanTuru: 'soz', ad: 'Sözel (SÖZ)', sinavKod: 'yks',
    tabanPuan: 132.2, tavanPuan: 500, obpKatsayi: 0.12, guven: 'resmi',
    kaynak: OSYM_KAYNAK, kaynakUrl: OSYM_2026,
    katsayilar: [
      ...TYT_DERSLERI(1.06, 1.23, 1.28, 0.99),
      { oturumKod: 'ayt-soz', dersAd: 'Türk Dili ve Edebiyatı', katsayi: 3.09 },
      { oturumKod: 'ayt-soz', dersAd: 'Tarih-1', katsayi: 2.15 },
      { oturumKod: 'ayt-soz', dersAd: 'Coğrafya-1', katsayi: 2.23 },
      { oturumKod: 'ayt-soz', dersAd: 'Tarih-2', katsayi: 2.93 },
      { oturumKod: 'ayt-soz', dersAd: 'Coğrafya-2', katsayi: 2.68 },
      { oturumKod: 'ayt-soz', dersAd: 'Felsefe Grubu', katsayi: 3.86 },
      { oturumKod: 'ayt-soz', dersAd: 'Din Kültürü ve Ahlak Bilgisi', katsayi: 1.86 },
    ],
    sinavDagilimi: SINAV_DAGILIMI.soz,
    yerlestirmeDagilimi: YERLESTIRME_DAGILIMI.soz,
  },
  dil: {
    yil: 2026, puanTuru: 'dil', ad: 'Yabancı Dil (DİL)', sinavKod: 'yks',
    tabanPuan: 110.6, tavanPuan: 500, obpKatsayi: 0.12, guven: 'resmi',
    kaynak: OSYM_KAYNAK, kaynakUrl: OSYM_2026,
    katsayilar: [
      ...TYT_DERSLERI(1.42, 1.66, 1.71, 1.33),
      { oturumKod: 'ydt', dersAd: 'Yabancı Dil (İngilizce)', katsayi: 2.57 },
    ],
    sinavDagilimi: SINAV_DAGILIMI.dil,
    yerlestirmeDagilimi: YERLESTIRME_DAGILIMI.dil,
  },
  lgs: {
    yil: 2026, puanTuru: 'lgs', ad: 'LGS Merkezî Sınav', sinavKod: 'lgs',
    tabanPuan: 199.9, tavanPuan: 500, obpKatsayi: 0, guven: 'turetilmis',
    kaynak:
      'MEB ÖDSGM 2026 LGS Merkezî Sınav Raporu (Tablo 7 ağırlıklar, Tablo 8 test istatistikleri) + Yerleştirme Raporu (%5 dilim = 43.850)',
    kaynakUrl: 'https://odsgm.meb.gov.tr/www/2026-lgs-kapsaminda-merkezi-sinav-raporu/icerik/1695/tr',
    // MEB'in ağırlık katsayıları standart puana uygulanır (Türkçe/Mat/Fen 4,
    // İnkılap/Din/Yabancı Dil 1). Net karşılıkları, Tablo 8'deki madde güçlüğü ve
    // güvenirlik değerlerinden KR-20 ile kestirilen standart sapmalarla türetildi.
    // Doğrulama: tüm netler 0 iken 199,9 — bilinen "0 net ≈ 200 puan" ile örtüşüyor.
    katsayilar: [
      { oturumKod: 'lgs', dersAd: 'Türkçe', katsayi: 4.28 },
      { oturumKod: 'lgs', dersAd: 'Matematik', katsayi: 4.34 },
      { oturumKod: 'lgs', dersAd: 'Fen Bilimleri', katsayi: 3.81 },
      { oturumKod: 'lgs', dersAd: 'T.C. İnkılap Tarihi', katsayi: 1.68 },
      // Ders adı `subjects` tablosunda kısa: 'Din Kültürü'. Uzun adla yazılırsa
      // eşleşmez ve ders puana hiç girmez (LGS tavanı 480'e düşer).
      { oturumKod: 'lgs', dersAd: 'Din Kültürü', katsayi: 1.98 },
      { oturumKod: 'lgs', dersAd: 'Yabancı Dil', katsayi: 1.48 },
    ],
    // MEB henüz YKS'deki gibi tam yığınsal tablo yayımlamıyor; eğri, resmî iki
    // noktaya (500 puan = 452 öğrenci, %5 dilim = 43.850) oturtuldu.
    sinavDagilimi: nokta([
      [500, 452], [480, 3800], [460, 12500], [440, 28000], [425, 43850],
      [400, 61390], [375, 110000], [350, 175000], [325, 265000], [300, 375000],
      [275, 495000], [250, 615000], [225, 725000], [200, 820000], [150, 872000],
      [100, 877000],
    ]),
    yerlestirmeDagilimi: [],
  },
};

/** Puan türü için gömülü model; tanınmayan türde null. */
export function gomuluPuanModeli(puanTuru: string): PuanModeli | null {
  return PUAN_MODELLERI[puanTuru] ?? null;
}
