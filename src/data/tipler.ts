/** Uygulama tipleri — supabase/migrations/0001_sema.sql şemasıyla birebir. */

export type Rol = 'ogrenci' | 'veli' | 'koc' | 'admin';
export type KonuDurumu = 'baslanmadi' | 'devam' | 'tamam';
export type HedefTipi = 'puan' | 'siralama';
export type GorusmeDurumu = 'planlandi' | 'tamamlandi' | 'iptal';

export interface Profil {
  id: string;
  rol: Rol;
  adSoyad: string;
  eposta?: string | null;
  sinif?: string | null;
  hedefAlan?: string | null;
  avatarRengi?: string | null;
}

export interface Oturum {
  id: string;
  sinavKodu: string;
  kod: string;
  ad: string;
}

export interface Konu {
  id: string;
  ad: string;
  soruOrtalamasi: number;
  cikmisSorularUrl?: string | null;
  kaynaklar: Array<{ ad: string; url: string }>;
  durum: KonuDurumu;
  cozulen: number;
  hedef: number;
  /** Haftalık planda bu hafta atanmışsa */
  buHafta?: boolean;
}

export interface Ders {
  id: string;
  ad: string;
  renk: string;
  soruSayisi: number;
  konular: Konu[];
  /** tamamlanan / toplam konu */
  tamamlanan: number;
  toplamKonu: number;
}

export interface SoruGirisi {
  id: string;
  konuId: string | null;
  konuAdi: string;
  renk: string;
  dogru: number;
  yanlis: number;
  bos: number;
  net: number;
  tarih: string;
}

export interface HaftalikSeri {
  etiket: string;
  cozulenSoru: number;
  ortalamaNet: number;
}

export interface DersDagilimi {
  ad: string;
  renk: string;
  soru: number;
  oran: number;
}

export interface Deneme {
  id: string;
  ad: string;
  tarih: string;
  net: number;
  degisim: number | null;
}

export interface NetHedefi {
  id: string;
  tip: HedefTipi;
  hedefPuan: number | null;
  hedefSiralama: number | null;
  dagilim: Array<{ dersId: string; ad: string; renk: string; net: number; maxNet: number; kilitli: boolean }>;
}

export interface Gorusme {
  id: string;
  ogrenciId: string;
  ogrenciAdi: string;
  kocId: string;
  kocAdi: string;
  baslangic: string;
  sureDk: number;
  tur: string;
  durum: GorusmeDurumu;
  gundem: string[];
  katilimUrl?: string | null;
}

export interface GorusmeNotu {
  id: string;
  ogrenciId: string;
  kocAdi: string;
  metin: string;
  veliylePaylasildi: boolean;
  etiketler: string[];
  tarih: string;
}

export interface PlanMaddesi {
  id: string;
  baslik: string;
  konuId: string | null;
  dersAdi: string | null;
  renk: string;
  tamamlandi: boolean;
  soruOrtalamasi: number | null;
  gun?: string | null;
  baslangicSaat?: string | null;
  bitisSaat?: string | null;
  bugun?: boolean;
}

export interface HaftalikPlan {
  id: string;
  haftaBaslangic: string;
  maddeler: PlanMaddesi[];
  /** 0–1 arası tamamlanma oranı */
  oran: number;
}

export interface OgrenciOzeti {
  id: string;
  adSoyad: string;
  avatarRengi: string;
  sinav: string;
  planOrani: number;
  netTrendi: number[];
  sonNet: number | null;
  sonrakiGorusme: string | null;
  durum: 'yolunda' | 'gecikti' | 'riskli' | 'yeni';
}

export interface KocOzeti {
  id: string;
  adSoyad: string;
  avatarRengi: string;
  ogrenciSayisi: number;
  planTamamlama: number;
  haftalikGorusme: number;
  netDegisimi: number;
  durum: 'cokIyi' | 'iyi' | 'takipte';
}

export interface Aktivite {
  id: string;
  tur: 'kayit' | 'uyari' | 'gorusme' | 'blog';
  metin: string;
  zaman: string;
}

export interface Yazi {
  id: string;
  slug: string;
  baslik: string;
  ozet: string;
  kategori: string;
  okumaDk: number;
  yazarAdi: string;
  yazarUnvani: string;
  yayinTarihi: string;
  oneCikan: boolean;
  kapakUrl?: string | null;
  icerik?: string | null;
}

export interface KocOdemesi {
  id: string;
  kocId: string;
  kocAdi: string;
  donem: string;
  ogrenciSayisi: number;
  gorusmeSayisi: number;
  tutar: number;
  durum: 'bekliyor' | 'odendi';
  odenmeTarihi: string | null;
}

export interface Basvuru {
  adSoyad: string;
  telefon: string;
  eposta?: string;
  sinav: 'yks' | 'lgs';
  hedef?: string;
}
