/**
 * Demo veri kümesi — tasarım dosyalarındaki içeriğin birebir karşılığı.
 * Supabase bağlantısı tanımlı değilse uygulama bu veriyle çalışır, böylece
 * tüm ekranlar ve etkileşimler (soru girişi, not kaydetme, Net Denge) denenebilir.
 */

import icerikMatematik from '@/content/blog/matematik-neti-neden-artmiyor.md?raw';
import icerikDenemeAnalizi from '@/content/blog/deneme-analizi-20-dakika.md?raw';
import icerikLgs100 from '@/content/blog/lgs-son-100-gun.md?raw';
import icerikParagraf from '@/content/blog/paragrafta-hiz.md?raw';
import icerikAralikliTekrar from '@/content/blog/aralikli-tekrar.md?raw';
import icerikKaynak from '@/content/blog/kaynak-secimi.md?raw';
import icerikVeli from '@/content/blog/sinav-yilinda-veli-olmak.md?raw';
import { DERS_RENKLERI } from '@/config/site';
import type {
  Aktivite,
  Ders,
  Deneme,
  DersDagilimi,
  Gorusme,
  GorusmeNotu,
  HaftalikPlan,
  HaftalikSeri,
  KocOdemesi,
  KocOzeti,
  NetHedefi,
  OgrenciOzeti,
  Oturum,
  Profil,
  SoruGirisi,
  Yazi,
} from './tipler';

/** Tasarım 15 Ağustos 2026 Cumartesi'ye göre kurgulandı. */
const G = (iso: string) => new Date(iso).toISOString();

// ---------- Kişiler ----------

export const OGRENCI: Profil = {
  id: 'ogr-elif',
  rol: 'ogrenci',
  adSoyad: 'Elif Kaya',
  eposta: 'elif@ornek.com',
  sinif: '12. sınıf',
  hedefAlan: 'Sayısal',
  avatarRengi: DERS_RENKLERI.turkce,
};

export const KOC: Profil = {
  id: 'koc-merve',
  rol: 'koc',
  adSoyad: 'Merve Demir',
  eposta: 'merve@ornek.com',
  hedefAlan: 'Matematik koçu',
  avatarRengi: DERS_RENKLERI.fen,
};

export const VELI: Profil = {
  id: 'veli-ayse',
  rol: 'veli',
  adSoyad: 'Ayşe Kaya',
  eposta: 'ayse@ornek.com',
  avatarRengi: DERS_RENKLERI.dil,
};

export const ADMIN: Profil = {
  id: 'admin-okan',
  rol: 'admin',
  adSoyad: 'Okan Tuna',
  eposta: 'okan@ornek.com',
  hedefAlan: 'Kurucu',
  avatarRengi: 'var(--color-primary)',
};

export const PROFILLER: Record<string, Profil> = {
  ogrenci: OGRENCI,
  koc: KOC,
  veli: VELI,
  admin: ADMIN,
};

// ---------- Müfredat ----------

export const OTURUMLAR: Oturum[] = [
  { id: 'tyt', sinavKodu: 'yks', kod: 'tyt', ad: 'TYT', tur: 'sinav' },
  { id: 'ayt-say', sinavKodu: 'yks', kod: 'ayt-say', ad: 'AYT · Sayısal', tur: 'sinav' },
];

const CIKMIS = 'https://www.osym.gov.tr/TR,15417/cikmis-sorular.html';

/** Oturum kodu → görünen ad. Demo modunda `exam_sessions` yok. */
export const OTURUM_ADLARI: Record<string, string> = {
  tyt: 'TYT',
  'ayt-say': 'AYT · Sayısal',
  'ayt-ea': 'AYT · Eşit Ağırlık',
  'ayt-soz': 'AYT · Sözel',
  ydt: 'YDT · Yabancı Dil',
  lgs: 'LGS',
};

export const MUFREDAT: Record<string, Ders[]> = {
  tyt: [
    {
      id: 'tyt-mat',
      ad: 'Matematik',
      renk: DERS_RENKLERI.matematik,
      soruSayisi: 40,
      tamamlanan: 14,
      toplamKonu: 32,
      konular: [
        {
          id: 'k-temel',
          ad: 'Temel Kavramlar',
          soruOrtalamasi: 3,
          kaynaklar: [],
          durum: 'tamam',
          cozulen: 40,
          hedef: 40,
        },
        {
          id: 'k-basamak',
          ad: 'Sayı Basamakları',
          soruOrtalamasi: 2,
          kaynaklar: [],
          durum: 'tamam',
          cozulen: 32,
          hedef: 40,
        },
        {
          id: 'k-koklu',
          ad: 'Köklü Sayılar',
          soruOrtalamasi: 3,
          cikmisSorularUrl: CIKMIS,
          kaynaklar: [{ ad: 'Konu kaynakları', url: '#' }],
          durum: 'devam',
          cozulen: 24,
          hedef: 40,
          buHafta: true,
        },
        {
          id: 'k-carpan',
          ad: 'Çarpanlara Ayırma',
          soruOrtalamasi: 2,
          kaynaklar: [],
          durum: 'baslanmadi',
          cozulen: 0,
          hedef: 40,
        },
      ],
    },
    {
      id: 'tyt-tur',
      ad: 'Türkçe',
      renk: DERS_RENKLERI.turkce,
      soruSayisi: 40,
      tamamlanan: 9,
      toplamKonu: 18,
      konular: [
        {
          id: 'k-paragraf',
          ad: 'Paragrafta Anlam',
          soruOrtalamasi: 12,
          cikmisSorularUrl: CIKMIS,
          kaynaklar: [],
          durum: 'tamam',
          cozulen: 120,
          hedef: 120,
        },
        {
          id: 'k-cumlede',
          ad: 'Cümlede Anlam',
          soruOrtalamasi: 5,
          kaynaklar: [],
          durum: 'devam',
          cozulen: 22,
          hedef: 50,
        },
        {
          id: 'k-sozcukte',
          ad: 'Sözcükte Anlam',
          soruOrtalamasi: 4,
          kaynaklar: [],
          durum: 'baslanmadi',
          cozulen: 0,
          hedef: 40,
        },
      ],
    },
    {
      id: 'tyt-fen',
      ad: 'Fen Bilimleri',
      renk: DERS_RENKLERI.fen,
      soruSayisi: 20,
      tamamlanan: 6,
      toplamKonu: 20,
      konular: [
        {
          id: 'k-basinc',
          ad: 'Fizik — Basınç',
          soruOrtalamasi: 2,
          cikmisSorularUrl: CIKMIS,
          kaynaklar: [],
          durum: 'tamam',
          cozulen: 20,
          hedef: 20,
        },
        {
          id: 'k-kuvvet',
          ad: 'Fizik — Kuvvet ve Hareket',
          soruOrtalamasi: 3,
          kaynaklar: [],
          durum: 'devam',
          cozulen: 12,
          hedef: 30,
        },
      ],
    },
    {
      id: 'tyt-sos',
      ad: 'Sosyal Bilimler',
      renk: DERS_RENKLERI.sosyal,
      soruSayisi: 20,
      tamamlanan: 7,
      toplamKonu: 16,
      konular: [
        {
          id: 'k-inkilap',
          ad: 'Tarih — İnkılap Tarihi',
          soruOrtalamasi: 3,
          kaynaklar: [],
          durum: 'devam',
          cozulen: 18,
          hedef: 40,
        },
        {
          id: 'k-iklim',
          ad: 'Coğrafya — İklim',
          soruOrtalamasi: 2,
          kaynaklar: [],
          durum: 'baslanmadi',
          cozulen: 0,
          hedef: 20,
        },
      ],
    },
  ],
  'ayt-say': [
    {
      id: 'ayt-mat',
      ad: 'Matematik (AYT)',
      renk: DERS_RENKLERI.matematik,
      soruSayisi: 40,
      tamamlanan: 4,
      toplamKonu: 28,
      konular: [
        {
          id: 'k-limit',
          ad: 'Limit ve Süreklilik',
          soruOrtalamasi: 3,
          kaynaklar: [],
          durum: 'baslanmadi',
          cozulen: 0,
          hedef: 40,
        },
        {
          id: 'k-turev',
          ad: 'Türev',
          soruOrtalamasi: 5,
          kaynaklar: [],
          durum: 'baslanmadi',
          cozulen: 0,
          hedef: 40,
        },
      ],
    },
    {
      id: 'ayt-fiz',
      ad: 'Fizik',
      renk: DERS_RENKLERI.fen,
      soruSayisi: 14,
      tamamlanan: 2,
      toplamKonu: 14,
      konular: [
        {
          id: 'k-vektor',
          ad: 'Vektörler',
          soruOrtalamasi: 2,
          kaynaklar: [],
          durum: 'devam',
          cozulen: 8,
          hedef: 20,
        },
      ],
    },
    {
      id: 'ayt-kim',
      ad: 'Kimya',
      renk: DERS_RENKLERI.sosyal,
      soruSayisi: 13,
      tamamlanan: 1,
      toplamKonu: 12,
      konular: [
        {
          id: 'k-atom',
          ad: 'Modern Atom Teorisi',
          soruOrtalamasi: 3,
          kaynaklar: [],
          durum: 'devam',
          cozulen: 6,
          hedef: 30,
        },
      ],
    },
    {
      id: 'ayt-biy',
      ad: 'Biyoloji',
      renk: DERS_RENKLERI.dil,
      soruSayisi: 13,
      tamamlanan: 3,
      toplamKonu: 10,
      konular: [
        {
          id: 'k-sinir',
          ad: 'Sinir Sistemi',
          soruOrtalamasi: 3,
          kaynaklar: [],
          durum: 'devam',
          cozulen: 14,
          hedef: 30,
        },
      ],
    },
  ],
};

// ---------- Haftalık plan ve bugünün akışı ----------

export const HAFTA_PLANI: HaftalikPlan = {
  id: 'plan-1',
  haftaBaslangic: '2026-08-10',
  oran: 2 / 3,
  maddeler: [
    {
      id: 'pi-1',
      baslik: 'Paragrafta Anlam',
      konuId: 'k-paragraf',
      dersAdi: 'Türkçe',
      renk: DERS_RENKLERI.turkce,
      tamamlandi: true,
      soruOrtalamasi: 6,
      gun: '2026-08-13',
      baslangicSaat: '11:05',
      bitisSaat: '13:30',
    },
    {
      id: 'pi-2',
      baslik: 'Köklü Sayılar',
      konuId: 'k-koklu',
      dersAdi: 'Matematik',
      renk: DERS_RENKLERI.matematik,
      tamamlandi: false,
      soruOrtalamasi: 3,
      gun: '2026-08-15',
      baslangicSaat: '09:00',
      bitisSaat: '11:40',
      bugun: true,
    },
    {
      id: 'pi-3',
      baslik: 'Basınç',
      konuId: 'k-basinc',
      dersAdi: 'Fen',
      renk: DERS_RENKLERI.fen,
      tamamlandi: true,
      soruOrtalamasi: 2,
      gun: '2026-08-15',
      baslangicSaat: '13:30',
      bitisSaat: '16:15',
    },
  ],
};

/** Bugünün akışındaki bloklar — tasarımdaki üç blok. */
export const BUGUN_AKISI = [
  { baslik: 'Köklü Sayılar — konu tekrarı', renk: DERS_RENKLERI.matematik, baslangic: '09:00', bitis: '11:40' },
  { baslik: 'Paragraf — 20 soru', renk: DERS_RENKLERI.turkce, baslangic: '11:05', bitis: '13:30' },
  { baslik: 'Basınç — yanlış analizi', renk: DERS_RENKLERI.fen, baslangic: '13:30', bitis: '16:15' },
];

// ---------- İlerleme ----------

export const HAFTALIK_SERI: HaftalikSeri[] = [
  { etiket: 'H1', cozulenSoru: 145, ortalamaNet: 61.0 },
  { etiket: 'H2', cozulenSoru: 187, ortalamaNet: 62.4 },
  { etiket: 'H3', cozulenSoru: 167, ortalamaNet: 62.0 },
  { etiket: 'H4', cozulenSoru: 218, ortalamaNet: 64.3 },
  { etiket: 'H5', cozulenSoru: 198, ortalamaNet: 65.2 },
  { etiket: 'H6', cozulenSoru: 250, ortalamaNet: 66.3 },
  { etiket: 'H7', cozulenSoru: 223, ortalamaNet: 67.4 },
  { etiket: 'H8', cozulenSoru: 240, ortalamaNet: 68.4 },
];

export const DERS_DAGILIMI: DersDagilimi[] = [
  { ad: 'Matematik', renk: DERS_RENKLERI.matematik, soru: 436, oran: 0.34 },
  { ad: 'Türkçe', renk: DERS_RENKLERI.turkce, soru: 334, oran: 0.26 },
  { ad: 'Fen', renk: DERS_RENKLERI.fen, soru: 231, oran: 0.18 },
  { ad: 'Sosyal', renk: DERS_RENKLERI.sosyal, soru: 180, oran: 0.14 },
  { ad: 'Yabancı Dil', renk: DERS_RENKLERI.dil, soru: 103, oran: 0.08 },
];

export const GIRISLER: SoruGirisi[] = [
  {
    id: 'g1',
    konuId: 'k-koklu',
    konuAdi: 'Köklü Sayılar',
    renk: DERS_RENKLERI.matematik,
    dogru: 22,
    yanlis: 6,
    bos: 2,
    net: 20.5,
    tarih: G('2026-08-15T14:20:00+03:00'),
  },
  {
    id: 'g2',
    konuId: 'k-paragraf',
    konuAdi: 'Paragrafta Anlam',
    renk: DERS_RENKLERI.turkce,
    dogru: 28,
    yanlis: 4,
    bos: 0,
    net: 27,
    tarih: G('2026-08-14T20:05:00+03:00'),
  },
  {
    id: 'g3',
    konuId: 'k-basinc',
    konuAdi: 'Basınç',
    renk: DERS_RENKLERI.fen,
    dogru: 15,
    yanlis: 3,
    bos: 2,
    net: 14.25,
    tarih: G('2026-08-13T18:40:00+03:00'),
  },
];

export const DENEMELER: Deneme[] = [
  { id: 'd1', ad: 'TYT Ö1', tarih: '2026-05-31', net: 60.2, degisim: null },
  { id: 'd2', ad: 'TYT Ö2', tarih: '2026-06-14', net: 61.4, degisim: 1.2 },
  { id: 'd3', ad: 'TYT Ö3', tarih: '2026-06-28', net: 60.8, degisim: -0.6 },
  { id: 'd4', ad: 'TYT D1', tarih: '2026-07-12', net: 64.5, degisim: 3.7 },
  { id: 'd5', ad: 'TYT D2', tarih: '2026-07-26', net: 66.3, degisim: 1.8 },
  { id: 'd6', ad: 'TYT D3', tarih: '2026-08-09', net: 68.4, degisim: 2.1 },
];

/** Ders bazlı müfredat ilerlemesi — koç ve veli panellerinde. */
export const DERS_ILERLEMESI = [
  { ad: 'Matematik', renk: DERS_RENKLERI.matematik, oran: 0.44 },
  { ad: 'Türkçe', renk: DERS_RENKLERI.turkce, oran: 0.5 },
  { ad: 'Fen', renk: DERS_RENKLERI.fen, oran: 0.3 },
  { ad: 'Sosyal', renk: DERS_RENKLERI.sosyal, oran: 0.44 },
];

/** Genel müfredat tamamlanma oranı (ring). */
export const MUFREDAT_ORANI = 0.38;

// ---------- Net Denge ----------

export const NET_HEDEFI: NetHedefi = {
  sinavKodu: 'yks',
  puanTuru: 'tyt',
  id: 'hedef-1',
  tip: 'siralama',
  hedefPuan: 380,
  hedefSiralama: 100000,
  obp: null,
  // Ders adları `puanVerisi.ts`teki katsayı adlarıyla birebir eşleşmeli;
  // eşleşmezse o dersin katsayısı 0 olur ve puana hiç girmez.
  dagilim: [
    { dersId: 'tur', ad: 'Türkçe', oturumKod: 'tyt', oturumAd: 'TYT', renk: DERS_RENKLERI.turkce, net: 29, maxNet: 40, kilitli: false },
    { dersId: 'mat', ad: 'Matematik', oturumKod: 'tyt', oturumAd: 'TYT', renk: DERS_RENKLERI.matematik, net: 23, maxNet: 40, kilitli: true },
    { dersId: 'fen', ad: 'Fen Bilimleri', oturumKod: 'tyt', oturumAd: 'TYT', renk: DERS_RENKLERI.fen, net: 14, maxNet: 20, kilitli: false },
    { dersId: 'sos', ad: 'Sosyal Bilimler', oturumKod: 'tyt', oturumAd: 'TYT', renk: DERS_RENKLERI.sosyal, net: 16, maxNet: 20, kilitli: false },
    // Demo öğrencisi Sayısal; sıralama TYT + AYT'nin birlikte hesabından çıktığı
    // için AYT dersleri de hedefte olmalı, yoksa puan yarım hesaplanıyor.
    { dersId: 'ayt-mat', ad: 'Matematik', oturumKod: 'ayt-say', oturumAd: 'AYT · Sayısal', renk: DERS_RENKLERI.matematik, net: 24, maxNet: 40, kilitli: false },
    { dersId: 'ayt-fiz', ad: 'Fizik', oturumKod: 'ayt-say', oturumAd: 'AYT · Sayısal', renk: DERS_RENKLERI.fen, net: 8, maxNet: 14, kilitli: false },
    { dersId: 'ayt-kim', ad: 'Kimya', oturumKod: 'ayt-say', oturumAd: 'AYT · Sayısal', renk: DERS_RENKLERI.sosyal, net: 7, maxNet: 13, kilitli: false },
    { dersId: 'ayt-biy', ad: 'Biyoloji', oturumKod: 'ayt-say', oturumAd: 'AYT · Sayısal', renk: DERS_RENKLERI.dil, net: 8, maxNet: 13, kilitli: false },
  ],
};

// ---------- Görüşmeler ----------

export const SONRAKI_GORUSME: Gorusme = {
  id: 'gor-next',
  ogrenciId: OGRENCI.id,
  ogrenciAdi: OGRENCI.adSoyad,
  kocId: KOC.id,
  kocAdi: KOC.adSoyad,
  baslangic: G('2026-08-17T19:00:00+03:00'),
  sureDk: 30,
  tur: 'goruntulu',
  durum: 'planlandi',
  gundem: ['Köklü Sayılar sonucu', 'Deneme D3 analizi', 'Yeni hafta planı'],
  katilimUrl: '#',
};

export const GECMIS_GORUSMELER: Array<Gorusme & { not: string; etiketler: string[] }> = [
  {
    ...SONRAKI_GORUSME,
    id: 'gor-3',
    baslangic: G('2026-08-10T19:00:00+03:00'),
    durum: 'tamamlandi',
    gundem: [],
    not: 'Paragraf hızı iyileşti (8 → 6,5 dk). Bu hafta matematikte köklü sayılara odak; cumartesi 20 soruluk mini deneme.',
    etiketler: ['Paragraf', 'Köklü Sayılar'],
  },
  {
    ...SONRAKI_GORUSME,
    id: 'gor-2',
    baslangic: G('2026-08-03T19:00:00+03:00'),
    durum: 'tamamlandi',
    gundem: [],
    not: 'D2 denemesi analizi: yanlışların %70’i 4 konuda. Eksik kapama sırası çıkardık; ilk sıra Köklü Sayılar.',
    etiketler: ['Deneme analizi', 'Basınç'],
  },
  {
    ...SONRAKI_GORUSME,
    id: 'gor-1',
    baslangic: G('2026-07-27T19:00:00+03:00'),
    sureDk: 45,
    durum: 'tamamlandi',
    gundem: [],
    not: 'Hedef: sayısal, ilk 100.000. Haftalık ritim kuruldu: 3 konu + 1 deneme. Veli paneli açıldı, rapor paylaşımı haftalık.',
    etiketler: ['Tanışma', 'Hedef belirleme'],
  },
];

export const KOC_NOTLARI: GorusmeNotu[] = [
  {
    id: 'n1',
    ogrenciId: OGRENCI.id,
    kocAdi: KOC.adSoyad,
    metin:
      'Paragraf hızı 8 → 6,5 dk. Bu hafta köklü sayılara odak; cumartesi 20 soruluk mini deneme.',
    veliylePaylasildi: true,
    etiketler: [],
    tarih: G('2026-08-10T20:00:00+03:00'),
  },
  {
    id: 'n2',
    ogrenciId: OGRENCI.id,
    kocAdi: KOC.adSoyad,
    metin:
      'D2 analizi: yanlışların %70’i 4 konuda. Eksik kapama sırası: Köklü, Çarpanlar, Basınç, Yüzdeler.',
    veliylePaylasildi: true,
    etiketler: [],
    tarih: G('2026-08-03T20:00:00+03:00'),
  },
];

/** Velinin gördüğü haftalık rapor (koç "veliyle paylaş" işaretlediyse). */
export const VELI_RAPORU = {
  tarih: G('2026-08-10T20:00:00+03:00'),
  metin:
    'Elif bu hafta planın %66’sını tamamladı; paragraf hızı belirgin şekilde iyileşti. Matematikte eksik kapama dönemindeyiz — netin 2–3 hafta yatay seyretmesi normaldir, panik yok. Evde en iyi destek: pazartesi görüşmesi öncesi sınav sonucu sormamak.',
  kocAdi: KOC.adSoyad,
  paylasildi: true,
  detaySeviyesi: 'tam' as 'ozet' | 'tam',
};

// ---------- Koç paneli ----------

export const KOC_OGRENCILERI: OgrenciOzeti[] = [
  {
    id: OGRENCI.id,
    adSoyad: 'Elif Kaya',
    avatarRengi: DERS_RENKLERI.turkce,
    sinav: 'YKS · Say',
    planOrani: 0.66,
    netTrendi: [62, 63, 62.6, 65, 67, 68.4],
    sonNet: 68.4,
    sonrakiGorusme: G('2026-08-17T19:00:00+03:00'),
    durum: 'yolunda',
  },
  {
    id: 'ogr-mert',
    adSoyad: 'Mert Aydın',
    avatarRengi: DERS_RENKLERI.matematik,
    sinav: 'LGS',
    planOrani: 0.3,
    netTrendi: [64, 62.5, 63, 61, 61.5, 61],
    sonNet: 61.0,
    sonrakiGorusme: G('2026-08-19T17:30:00+03:00'),
    durum: 'gecikti',
  },
  {
    id: 'ogr-zeynep',
    adSoyad: 'Zeynep Ak',
    avatarRengi: DERS_RENKLERI.fen,
    sinav: 'YKS · EA',
    planOrani: 0.85,
    netTrendi: [68, 69.5, 71, 71.8, 73.4, 74.2],
    sonNet: 74.2,
    sonrakiGorusme: G('2026-08-18T20:00:00+03:00'),
    durum: 'yolunda',
  },
  {
    id: 'ogr-deniz',
    adSoyad: 'Deniz Yıldız',
    avatarRengi: DERS_RENKLERI.sosyal,
    sinav: 'YKS · Söz',
    planOrani: 0.52,
    netTrendi: [67, 67.6, 67.2, 68.5, 68.6, 70.1],
    sonNet: 70.1,
    sonrakiGorusme: G('2026-08-20T18:00:00+03:00'),
    durum: 'yolunda',
  },
  {
    id: 'ogr-can',
    adSoyad: 'Can Koç',
    avatarRengi: DERS_RENKLERI.dil,
    sinav: 'LGS',
    planOrani: 0.12,
    netTrendi: [55, 54, 52.5, 51, 49.6, 48.5],
    sonNet: 48.5,
    sonrakiGorusme: null,
    durum: 'riskli',
  },
  {
    id: 'ogr-selin',
    adSoyad: 'Selin Bal',
    avatarRengi: 'var(--color-primary-soft-2)',
    sinav: 'YKS · Say',
    planOrani: 0.08,
    netTrendi: [],
    sonNet: null,
    sonrakiGorusme: G('2026-08-21T19:30:00+03:00'),
    durum: 'yeni',
  },
];

/** Koçun "gelecek haftaya ata" chip önerileri. */
export const ATAMA_ONERILERI = [
  { id: 'k-carpan', ad: 'Çarpanlara Ayırma', renk: DERS_RENKLERI.matematik },
  { id: 'k-kaldirma', ad: 'Kaldırma Kuvveti', renk: DERS_RENKLERI.fen },
  { id: 'd-tyt4', ad: 'TYT D4 denemesi', renk: 'var(--color-surface-2)' },
];

// ---------- Admin ----------

export const ADMIN_METRIKLERI = {
  aktifOgrenci: 128,
  ogrenciArtisi: 14,
  kocSayisi: 9,
  kocBasinaOgrenci: 14.2,
  haftalikGorusme: 74,
  iptal: 3,
  planTamamlama: 0.71,
  planTamamlamaArtisi: 4,
};

export const OGRENCI_BUYUMESI = [
  { ay: 'Mar', sayi: 62 },
  { ay: 'Nis', sayi: 71 },
  { ay: 'May', sayi: 85 },
  { ay: 'Haz', sayi: 94 },
  { ay: 'Tem', sayi: 114 },
  { ay: 'Ağu', sayi: 128 },
];

export const AKTIVITELER: Aktivite[] = [
  { id: 'a1', tur: 'kayit', metin: '**Selin Bal** kaydoldu — Merve Demir’e atandı.', zaman: '32 dk önce' },
  { id: 'a2', tur: 'uyari', metin: '**Can Koç** 2 haftadır plan girmedi — koçu bilgilendirildi.', zaman: '2 sa önce' },
  { id: 'a3', tur: 'gorusme', metin: '**Baran Ekiz** bu hafta 11 görüşme tamamladı.', zaman: '5 sa önce' },
  {
    id: 'a4',
    tur: 'blog',
    metin: 'Blog’da yeni yazı yayınlandı: **“Matematik neti neden artmıyor?”**',
    zaman: 'dün',
  },
];

export const KOCLAR: KocOzeti[] = [
  {
    id: KOC.id,
    adSoyad: 'Merve Demir',
    avatarRengi: DERS_RENKLERI.fen,
    ogrenciSayisi: 14,
    planTamamlama: 0.78,
    haftalikGorusme: 12,
    netDegisimi: 3.1,
    durum: 'cokIyi',
  },
  {
    id: 'koc-baran',
    adSoyad: 'Baran Ekiz',
    avatarRengi: DERS_RENKLERI.matematik,
    ogrenciSayisi: 16,
    planTamamlama: 0.71,
    haftalikGorusme: 11,
    netDegisimi: 2.4,
    durum: 'iyi',
  },
  {
    id: 'koc-ipek',
    adSoyad: 'İpek Yavuz',
    avatarRengi: DERS_RENKLERI.turkce,
    ogrenciSayisi: 15,
    planTamamlama: 0.66,
    haftalikGorusme: 13,
    netDegisimi: 1.9,
    durum: 'iyi',
  },
  {
    id: 'koc-kerem',
    adSoyad: 'Kerem Arslan',
    avatarRengi: DERS_RENKLERI.sosyal,
    ogrenciSayisi: 12,
    planTamamlama: 0.54,
    haftalikGorusme: 8,
    netDegisimi: 0.6,
    durum: 'takipte',
  },
  {
    id: 'koc-naz',
    adSoyad: 'Naz Şahin',
    avatarRengi: DERS_RENKLERI.dil,
    ogrenciSayisi: 10,
    planTamamlama: 0.74,
    haftalikGorusme: 9,
    netDegisimi: 2.8,
    durum: 'iyi',
  },
];

export const ODEMELER: KocOdemesi[] = [
  {
    id: 'od-1',
    kocId: KOC.id,
    kocAdi: 'Merve Demir',
    donem: '2026-08-01',
    ogrenciSayisi: 14,
    gorusmeSayisi: 48,
    tutar: 28800,
    durum: 'bekliyor',
    odenmeTarihi: null,
  },
  {
    id: 'od-2',
    kocId: 'koc-baran',
    kocAdi: 'Baran Ekiz',
    donem: '2026-08-01',
    ogrenciSayisi: 16,
    gorusmeSayisi: 44,
    tutar: 26400,
    durum: 'bekliyor',
    odenmeTarihi: null,
  },
  {
    id: 'od-3',
    kocId: KOC.id,
    kocAdi: 'Merve Demir',
    donem: '2026-07-01',
    ogrenciSayisi: 13,
    gorusmeSayisi: 50,
    tutar: 30000,
    durum: 'odendi',
    odenmeTarihi: '2026-08-05',
  },
  {
    id: 'od-4',
    kocId: 'koc-ipek',
    kocAdi: 'İpek Yavuz',
    donem: '2026-07-01',
    ogrenciSayisi: 15,
    gorusmeSayisi: 46,
    tutar: 27600,
    durum: 'odendi',
    odenmeTarihi: '2026-08-05',
  },
];

// ---------- Blog ----------

export const YAZILAR: Yazi[] = [
  {
    id: 'y1',
    slug: 'matematik-neti-neden-artmiyor',
    kapakUrl: '/blog/matematik-neti-neden-artmiyor.svg',
    baslik: 'Matematik neti neden artmıyor? (ve 1 haftada nasıl kırılır)',
    ozet:
      'Soru sayısı artıyor ama net yerinde sayıyorsa sorun genellikle çalışma azlığı değil, konu seçimi. Eksik kapatma haftası nasıl kurulur?',
    kategori: 'Matematik',
    okumaDk: 7,
    yazarAdi: 'Rehber Eğitim & Sınav Koçu',
    yazarUnvani: 'Koçluk ekibi',
    yayinTarihi: '2026-08-12T09:00:00+03:00',
    oneCikan: true,
    icerik: icerikMatematik,
  },
  {
    id: 'y2',
    slug: 'deneme-analizi-20-dakika',
    kapakUrl: '/blog/deneme-analizi-20-dakika.svg',
    baslik: 'Deneme analizi: sınav sonrası 20 dakikalık yöntem',
    ozet: 'Yanlışları üçe ayırmak yetiyor: bilmiyordum, yanlış okudum, süre yetmedi. Her birinin çözümü farklı.',
    kategori: 'Strateji',
    okumaDk: 5,
    yazarAdi: 'Rehber Eğitim & Sınav Koçu',
    yazarUnvani: 'Koçluk ekibi',
    yayinTarihi: '2026-08-05T09:00:00+03:00',
    oneCikan: false,
    icerik: icerikDenemeAnalizi,
  },
  {
    id: 'y3',
    slug: 'lgs-son-100-gun',
    kapakUrl: '/blog/lgs-son-100-gun.svg',
    baslik: 'LGS’ye son 100 gün: haftalık ritim nasıl kurulur?',
    ozet: 'Gün gün değil, hafta hafta: 1 ana konu, 1 tekrar bloğu, 1 deneme.',
    kategori: 'Planlama',
    okumaDk: 6,
    yazarAdi: 'Rehber Eğitim & Sınav Koçu',
    yazarUnvani: 'Koçluk ekibi',
    yayinTarihi: '2026-07-28T09:00:00+03:00',
    oneCikan: false,
    icerik: icerikLgs100,
  },
  {
    id: 'y4',
    slug: 'paragrafta-hiz',
    kapakUrl: '/blog/paragrafta-hiz.svg',
    baslik: 'Paragrafta hız: 3 alışkanlık, 8 dakika kazanç',
    ozet: 'Önce soruyu okumak, seçeneğe erken dönmemek, kanıt cümlesini işaretlemek. Hepsi bu.',
    kategori: 'Türkçe',
    okumaDk: 4,
    yazarAdi: 'Rehber Eğitim & Sınav Koçu',
    yazarUnvani: 'Koçluk ekibi',
    yayinTarihi: '2026-07-21T09:00:00+03:00',
    oneCikan: false,
    icerik: icerikParagraf,
  },
  {
    id: 'y5',
    slug: 'aralikli-tekrar',
    kapakUrl: '/blog/aralikli-tekrar.svg',
    baslik: 'Ezber değil aralıklı tekrar: 10 dakikalık kurulum',
    ozet: 'Unutma eğrisiyle savaşmak yerine onu takvime bağlamak: 1 gün, 3 gün, 1 hafta.',
    kategori: 'Alışkanlık',
    okumaDk: 5,
    yazarAdi: 'Rehber Eğitim & Sınav Koçu',
    yazarUnvani: 'Koçluk ekibi',
    yayinTarihi: '2026-07-14T09:00:00+03:00',
    oneCikan: false,
    icerik: icerikAralikliTekrar,
  },
  {
    id: 'y6',
    slug: 'kaynak-secimi',
    kapakUrl: '/blog/kaynak-secimi.svg',
    baslik: 'Kaynak seçimi: az kitap, çok tur',
    ozet: 'Üç kaynağı bitirmiş görünmek mi, bir kaynağı üç tur dönmek mi? Veriyle bakalım.',
    kategori: 'Strateji',
    okumaDk: 6,
    yazarAdi: 'Rehber Eğitim & Sınav Koçu',
    yazarUnvani: 'Koçluk ekibi',
    yayinTarihi: '2026-07-07T09:00:00+03:00',
    oneCikan: false,
    icerik: icerikKaynak,
  },
  {
    id: 'y7',
    slug: 'sinav-yilinda-veli-olmak',
    kapakUrl: '/blog/sinav-yilinda-veli-olmak.svg',
    baslik: 'Sınav yılında veli olmak: destek ile baskının sınırı',
    ozet: '“Bugün kaç soru çözdün?” yerine sorulabilecek üç soru.',
    kategori: 'Veliler için',
    okumaDk: 5,
    yazarAdi: 'Rehber Eğitim & Sınav Koçu',
    yazarUnvani: 'Koçluk ekibi',
    yayinTarihi: '2026-06-30T09:00:00+03:00',
    oneCikan: false,
    icerik: icerikVeli,
  },
];
