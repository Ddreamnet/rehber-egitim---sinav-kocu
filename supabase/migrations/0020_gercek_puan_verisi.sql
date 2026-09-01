-- ============================================================
-- 0020 — Net Denge: gerçek sınav verisi
--
-- SORUN. `net_siralama_tablosu` uydurma çapalarla dolduruldu (0003 ve 0010'un
-- kendi yorumları da "gerçek yerleştirme verisiyle değiştirilecek" diyor).
-- Üstelik üç yapısal hata vardı:
--
--   1. Tek bir 'yks' eğrisi tüm puan türlerine uygulanıyordu. 90 net Sayısal
--      ile 90 net Sözel aynı sıralamayı veriyordu; gerçekte 2026'da Sayısal'da
--      440 puan 22.370. sıra, Sözel'de 214. sıra.
--   2. Sıralama çapalar arasında DOĞRUSAL ara değerle bulunuyordu. Sıralama
--      nete göre üstel değişir; 95 nette doğrusal 33.500, logaritmik 27.900
--      diyor — %20 sapma.
--   3. Diploma notu (OBP) hiç yoktu. ÖSYM yerleştirme puanı = sınav puanı +
--      OBP x 0,12; 500 OBP ile 250 OBP arasındaki fark 30 puan, üst sıralarda
--      on binlerce sıra eder.
--
-- ÇÖZÜM. Üç tablo:
--   puan_modeli       — yıl + puan türü başına taban puan, OBP katsayısı, kaynak
--   puan_katsayilari  — ders başına net katsayısı (puan = taban + Σ net x katsayı)
--   puan_dagilimi     — ÖSYM/MEB'in yayımladığı yığınsal dağılım (puan → o puanın
--                       üstündeki aday sayısı, yani başarı sırası)
--
-- KAYNAKLAR (hepsi resmî, indirilip okundu):
--   YKS dağılımı  : ÖSYM, "2026-YKS Sayısal Bilgiler", s.11 (sınav puanı) ve
--                   s.12 (yerleştirme puanı, OBP dahil).
--                   https://cdn.osym.gov.tr/pdfdokuman/2026/YKS/SB/sayisal_ykdd21072026.pdf
--   LGS formülü   : MEB ÖDSGM, "2026 LGS Kapsamında Merkezî Sınav Raporu",
--                   Tablo 7 (ağırlık katsayıları) ve Tablo 8 (test istatistikleri).
--                   https://odsgm.meb.gov.tr/meb_iys_dosyalar/2026_07/6a50862c73d81732286292_2026_Merkezî_Sınav_Raporu.pdf
--   LGS %5 dilimi : MEB ÖDSGM, "2026 LGS Yerleştirme Raporu" — ilk %5'lik dilim
--                   43.850 öğrenci.
--
-- Katsayılar, ilgili yılın standart puan dönüşümünü net üzerinden doğrusallaştırır
-- (ÖSYM'nin kendi formülü de nete göre doğrusaldır). Doğrulama için bkz. aşağıdaki
-- yorum satırları: her puan türünde tüm netler tam iken sonuç 500'e oturuyor.
-- ============================================================

-- ------------------------------------------------------------
-- Tablolar
-- ------------------------------------------------------------

create table if not exists public.puan_modeli (
  yil          int  not null,
  puan_turu    text not null,              -- 'tyt' | 'say' | 'ea' | 'soz' | 'dil' | 'lgs'
  ad           text not null,
  sinav_kod    text not null,              -- 'yks' | 'lgs'
  -- Tüm netler 0 iken oluşan puan
  taban_puan   numeric(6,2) not null,
  tavan_puan   numeric(6,2) not null default 500,
  -- Yerleştirme puanına diploma notunun katkı katsayısı (YKS'de 0,12; LGS'de yok)
  obp_katsayi  numeric(4,3) not null default 0,
  -- Verinin ne kadar sağlam olduğu — arayüzde dürüstçe gösterilir
  guven        text not null default 'resmi' check (guven in ('resmi', 'turetilmis')),
  kaynak       text not null,
  kaynak_url   text,
  primary key (yil, puan_turu)
);

create table if not exists public.puan_katsayilari (
  yil        int  not null,
  puan_turu  text not null,
  oturum_kod text not null,                -- exam_sessions.kod
  ders_ad    text not null,                -- subjects.ad
  katsayi    numeric(6,3) not null,
  primary key (yil, puan_turu, oturum_kod, ders_ad),
  foreign key (yil, puan_turu) references public.puan_modeli(yil, puan_turu) on delete cascade
);

create table if not exists public.puan_dagilimi (
  yil            int  not null,
  puan_turu      text not null,
  -- false: sınav puanı (OBP'siz) · true: yerleştirme puanı (OBP dahil)
  obp_dahil      boolean not null,
  puan           int  not null,
  -- Bu puan ve üstünü alan aday sayısı = o puanın başarı sırası
  kumulatif_aday int  not null,
  primary key (yil, puan_turu, obp_dahil, puan),
  foreign key (yil, puan_turu) references public.puan_modeli(yil, puan_turu) on delete cascade
);

-- Diploma notu öğrenciden alınır; OBP = diploma notu x 5 (en çok 500).
alter table public.net_targets add column if not exists obp numeric(5,2);
comment on column public.net_targets.obp is
  'Ortaöğretim Başarı Puanı (diploma notu x 5, 250-500). Boşsa yerleştirme puanı hesaplanmaz.';

-- Hedef artık tek oturuma değil PUAN TÜRÜNE bağlı.
--
-- Sayısal sıralaması TYT ve AYT netlerinin birlikte hesaplanmasıyla çıkar; hedef
-- yalnız 'ayt-say' oturumuna bağlıyken AYT netlerinden sıralama üretmeye
-- çalışıyorduk ki bunun karşılığı yok. `net_allocations` zaten subject_id
-- üzerinden birden çok oturumun dersini taşıyabiliyor.
alter table public.net_targets add column if not exists puan_turu text;
comment on column public.net_targets.puan_turu is
  'puan_modeli.puan_turu — hedefin hangi puan türü için kurulduğu. Eski satırlarda boş.';

-- Aynı öğrenciye aynı puan türünden tek güncel hedef
create unique index if not exists net_targets_ogrenci_puan_turu_idx
  on public.net_targets (student_id, puan_turu) where guncel and puan_turu is not null;

-- ------------------------------------------------------------
-- RLS — müfredat gibi herkese açık okuma, yazma yalnız admin
-- ------------------------------------------------------------

alter table public.puan_modeli      enable row level security;
alter table public.puan_katsayilari enable row level security;
alter table public.puan_dagilimi    enable row level security;

do $$
declare t text;
begin
  foreach t in array array['puan_modeli', 'puan_katsayilari', 'puan_dagilimi'] loop
    execute format('drop policy if exists %I_read_public on public.%I', t, t);
    execute format(
      'create policy %I_read_public on public.%I for select to anon, authenticated using (true)', t, t);
    execute format('drop policy if exists %I_write_admin on public.%I', t, t);
    execute format(
      'create policy %I_write_admin on public.%I for all to authenticated using (public.admin_mi()) with check (public.admin_mi())',
      t, t);
  end loop;
end $$;

grant select on public.puan_modeli, public.puan_katsayilari, public.puan_dagilimi to anon, authenticated;

-- ============================================================
-- MODELLER
-- ============================================================

insert into public.puan_modeli (yil, puan_turu, ad, sinav_kod, taban_puan, obp_katsayi, guven, kaynak, kaynak_url) values
  (2026, 'tyt', 'TYT',                 'yks', 150.29, 0.12, 'resmi',
   'ÖSYM 2026-YKS Sayısal Bilgiler (yığınsal dağılım) + 2026 net katsayıları',
   'https://cdn.osym.gov.tr/pdfdokuman/2026/YKS/SB/sayisal_ykdd21072026.pdf'),
  (2026, 'say', 'Sayısal (SAY)',       'yks', 124.82, 0.12, 'resmi',
   'ÖSYM 2026-YKS Sayısal Bilgiler (yığınsal dağılım) + 2026 net katsayıları',
   'https://cdn.osym.gov.tr/pdfdokuman/2026/YKS/SB/sayisal_ykdd21072026.pdf'),
  (2026, 'ea',  'Eşit Ağırlık (EA)',   'yks', 125.27, 0.12, 'resmi',
   'ÖSYM 2026-YKS Sayısal Bilgiler (yığınsal dağılım) + 2026 net katsayıları',
   'https://cdn.osym.gov.tr/pdfdokuman/2026/YKS/SB/sayisal_ykdd21072026.pdf'),
  (2026, 'soz', 'Sözel (SÖZ)',         'yks', 132.20, 0.12, 'resmi',
   'ÖSYM 2026-YKS Sayısal Bilgiler (yığınsal dağılım) + 2026 net katsayıları',
   'https://cdn.osym.gov.tr/pdfdokuman/2026/YKS/SB/sayisal_ykdd21072026.pdf'),
  (2026, 'dil', 'Yabancı Dil (DİL)',   'yks', 110.60, 0.12, 'resmi',
   'ÖSYM 2026-YKS Sayısal Bilgiler (yığınsal dağılım) + 2026 net katsayıları',
   'https://cdn.osym.gov.tr/pdfdokuman/2026/YKS/SB/sayisal_ykdd21072026.pdf'),
  -- LGS katsayıları MEB'in yayımladığı ağırlık katsayıları ve test istatistiklerinden
  -- türetildi (KR-20 ile standart sapma kestirimi); dağılımda YKS kadar çok resmî
  -- nokta yok. Bu yüzden 'turetilmis'.
  (2026, 'lgs', 'LGS Merkezî Sınav',   'lgs', 199.90, 0.00, 'turetilmis',
   'MEB ÖDSGM 2026 LGS Merkezî Sınav Raporu (Tablo 7 ağırlıklar, Tablo 8 test istatistikleri) + Yerleştirme Raporu (%5 dilim = 43.850)',
   'https://odsgm.meb.gov.tr/www/2026-lgs-kapsaminda-merkezi-sinav-raporu/icerik/1695/tr')
on conflict (yil, puan_turu) do update set
  ad = excluded.ad, sinav_kod = excluded.sinav_kod, taban_puan = excluded.taban_puan,
  obp_katsayi = excluded.obp_katsayi, guven = excluded.guven,
  kaynak = excluded.kaynak, kaynak_url = excluded.kaynak_url;

-- ============================================================
-- NET KATSAYILARI   puan = taban_puan + Σ (net x katsayı)
-- Ders adları public.subjects.ad ile birebir eşleşir.
-- ============================================================

insert into public.puan_katsayilari (yil, puan_turu, oturum_kod, ders_ad, katsayi) values
  -- TYT  → tavan: 150,29 + 40x2,75 + 20x3,08 + 40x3,30 + 20x2,48 = 503,5 ≈ 500
  (2026, 'tyt', 'tyt', 'Türkçe',           2.750),
  (2026, 'tyt', 'tyt', 'Sosyal Bilimler',  3.080),
  (2026, 'tyt', 'tyt', 'Matematik',        3.300),
  (2026, 'tyt', 'tyt', 'Fen Bilimleri',    2.480),

  -- SAY  → tavan: 124,82 + (TYT) + 40x2,83 + 14x2,58 + 13x2,55 + 13x2,69 = 502,3 ≈ 500
  (2026, 'say', 'tyt', 'Türkçe',           1.230),
  (2026, 'say', 'tyt', 'Sosyal Bilimler',  1.240),
  (2026, 'say', 'tyt', 'Matematik',        1.610),
  (2026, 'say', 'tyt', 'Fen Bilimleri',    1.080),
  (2026, 'say', 'ayt-say', 'Matematik',    2.830),
  (2026, 'say', 'ayt-say', 'Fizik',        2.580),
  (2026, 'say', 'ayt-say', 'Kimya',        2.550),
  (2026, 'say', 'ayt-say', 'Biyoloji',     2.690),

  -- EA
  (2026, 'ea', 'tyt', 'Türkçe',            1.140),
  (2026, 'ea', 'tyt', 'Sosyal Bilimler',   1.380),
  (2026, 'ea', 'tyt', 'Matematik',         1.430),
  (2026, 'ea', 'tyt', 'Fen Bilimleri',     1.160),
  (2026, 'ea', 'ayt-ea', 'Matematik',      2.940),
  (2026, 'ea', 'ayt-ea', 'Türk Dili ve Edebiyatı', 3.310),
  (2026, 'ea', 'ayt-ea', 'Tarih-1',        2.370),
  (2026, 'ea', 'ayt-ea', 'Coğrafya-1',     2.330),

  -- SÖZ  → tavan ≈ 495
  (2026, 'soz', 'tyt', 'Türkçe',           1.060),
  (2026, 'soz', 'tyt', 'Sosyal Bilimler',  1.230),
  (2026, 'soz', 'tyt', 'Matematik',        1.280),
  (2026, 'soz', 'tyt', 'Fen Bilimleri',    0.990),
  (2026, 'soz', 'ayt-soz', 'Türk Dili ve Edebiyatı', 3.090),
  (2026, 'soz', 'ayt-soz', 'Tarih-1',      2.150),
  (2026, 'soz', 'ayt-soz', 'Coğrafya-1',   2.230),
  (2026, 'soz', 'ayt-soz', 'Tarih-2',      2.930),
  (2026, 'soz', 'ayt-soz', 'Coğrafya-2',   2.680),
  (2026, 'soz', 'ayt-soz', 'Felsefe Grubu', 3.860),
  (2026, 'soz', 'ayt-soz', 'Din Kültürü ve Ahlak Bilgisi', 1.860),

  -- DİL  → tavan: 110,60 + (TYT) + 80x2,57 = 501,2 ≈ 500
  (2026, 'dil', 'tyt', 'Türkçe',           1.420),
  (2026, 'dil', 'tyt', 'Sosyal Bilimler',  1.660),
  (2026, 'dil', 'tyt', 'Matematik',        1.710),
  (2026, 'dil', 'tyt', 'Fen Bilimleri',    1.330),
  (2026, 'dil', 'ydt', 'Yabancı Dil (İngilizce)', 2.570),

  -- LGS  → tavan: 199,90 + 20x4,28 + 20x4,34 + 20x3,81 + 10x1,68 + 10x1,98 + 10x1,48 = 500,0
  (2026, 'lgs', 'lgs', 'Türkçe',             4.280),
  (2026, 'lgs', 'lgs', 'Matematik',          4.340),
  (2026, 'lgs', 'lgs', 'Fen Bilimleri',      3.810),
  (2026, 'lgs', 'lgs', 'T.C. İnkılap Tarihi', 1.680),
  -- Ders adı veritabanında kısa: 0011 migration'ı 'Din Kültürü' olarak açtı.
  -- Uzun adla yazılırsa eşleşmez ve ders puana hiç girmez.
  (2026, 'lgs', 'lgs', 'Din Kültürü', 1.980),
  (2026, 'lgs', 'lgs', 'Yabancı Dil',        1.480)
on conflict (yil, puan_turu, oturum_kod, ders_ad) do update set katsayi = excluded.katsayi;

-- ============================================================
-- YIĞINSAL DAĞILIM — ÖSYM 2026-YKS Sayısal Bilgiler
-- "puan ve üstü" satırındaki aday sayısı doğrudan başarı sırasıdır.
-- ============================================================

-- ---------- Sınav puanları (OBP hariç) — kaynak s.11 ----------
insert into public.puan_dagilimi (yil, puan_turu, obp_dahil, puan, kumulatif_aday) values
  (2026,'tyt',false,500,5),(2026,'tyt',false,480,822),(2026,'tyt',false,460,5524),
  (2026,'tyt',false,440,17050),(2026,'tyt',false,420,37770),(2026,'tyt',false,400,67394),
  (2026,'tyt',false,380,106404),(2026,'tyt',false,360,155008),(2026,'tyt',false,340,218156),
  (2026,'tyt',false,320,302758),(2026,'tyt',false,300,417935),(2026,'tyt',false,280,577094),
  (2026,'tyt',false,260,787244),(2026,'tyt',false,240,1045340),(2026,'tyt',false,220,1332391),
  (2026,'tyt',false,200,1630698),(2026,'tyt',false,180,1914717),(2026,'tyt',false,160,2125244),
  (2026,'tyt',false,140,2184873),(2026,'tyt',false,120,2187723),(2026,'tyt',false,100,2187743),

  (2026,'say',false,500,1),(2026,'say',false,480,1453),(2026,'say',false,460,8786),
  (2026,'say',false,440,22370),(2026,'say',false,420,39624),(2026,'say',false,400,58728),
  (2026,'say',false,380,78806),(2026,'say',false,360,100553),(2026,'say',false,340,125045),
  (2026,'say',false,320,153304),(2026,'say',false,300,187034),(2026,'say',false,280,228643),
  (2026,'say',false,260,279885),(2026,'say',false,240,344536),(2026,'say',false,220,430074),
  (2026,'say',false,200,549793),(2026,'say',false,180,721488),(2026,'say',false,160,923753),
  (2026,'say',false,140,1078515),(2026,'say',false,120,1134006),(2026,'say',false,100,1135718),

  (2026,'soz',false,500,1),(2026,'soz',false,480,10),(2026,'soz',false,460,74),
  (2026,'soz',false,440,214),(2026,'soz',false,420,560),(2026,'soz',false,400,1418),
  (2026,'soz',false,380,3936),(2026,'soz',false,360,10259),(2026,'soz',false,340,23653),
  (2026,'soz',false,320,47292),(2026,'soz',false,300,86560),(2026,'soz',false,280,148959),
  (2026,'soz',false,260,238848),(2026,'soz',false,240,360487),(2026,'soz',false,220,515916),
  (2026,'soz',false,200,699304),(2026,'soz',false,180,873860),(2026,'soz',false,160,998826),
  (2026,'soz',false,140,1065157),(2026,'soz',false,120,1084720),(2026,'soz',false,100,1085698),

  (2026,'ea',false,500,1),(2026,'ea',false,480,52),(2026,'ea',false,460,307),
  (2026,'ea',false,440,874),(2026,'ea',false,420,2097),(2026,'ea',false,400,4545),
  (2026,'ea',false,380,9486),(2026,'ea',false,360,23452),(2026,'ea',false,340,50608),
  (2026,'ea',false,320,89520),(2026,'ea',false,300,140784),(2026,'ea',false,280,210499),
  (2026,'ea',false,260,308127),(2026,'ea',false,240,440752),(2026,'ea',false,220,615366),
  (2026,'ea',false,200,832251),(2026,'ea',false,180,1069239),(2026,'ea',false,160,1272506),
  (2026,'ea',false,140,1391240),(2026,'ea',false,120,1420558),(2026,'ea',false,100,1421290),

  (2026,'dil',false,500,5),(2026,'dil',false,480,118),(2026,'dil',false,460,628),
  (2026,'dil',false,440,1795),(2026,'dil',false,420,3632),(2026,'dil',false,400,6683),
  (2026,'dil',false,380,11576),(2026,'dil',false,360,18265),(2026,'dil',false,340,26469),
  (2026,'dil',false,320,35020),(2026,'dil',false,300,43883),(2026,'dil',false,280,52590),
  (2026,'dil',false,260,61992),(2026,'dil',false,240,72025),(2026,'dil',false,220,82982),
  (2026,'dil',false,200,94735),(2026,'dil',false,180,107579),(2026,'dil',false,160,120099),
  (2026,'dil',false,140,128950),(2026,'dil',false,120,132443),(2026,'dil',false,100,132826)
on conflict (yil, puan_turu, obp_dahil, puan) do update set kumulatif_aday = excluded.kumulatif_aday;

-- ---------- Yerleştirme puanları (OBP dahil) — kaynak s.12 ----------
insert into public.puan_dagilimi (yil, puan_turu, obp_dahil, puan, kumulatif_aday) values
  (2026,'tyt',true,550,112),(2026,'tyt',true,530,2045),(2026,'tyt',true,510,8638),
  (2026,'tyt',true,490,22600),(2026,'tyt',true,470,45313),(2026,'tyt',true,450,76021),
  (2026,'tyt',true,430,115071),(2026,'tyt',true,410,163211),(2026,'tyt',true,390,225038),
  (2026,'tyt',true,370,305570),(2026,'tyt',true,350,412011),(2026,'tyt',true,330,553526),
  (2026,'tyt',true,310,735519),(2026,'tyt',true,290,961261),(2026,'tyt',true,270,1219171),
  (2026,'tyt',true,250,1499060),(2026,'tyt',true,230,1782951),(2026,'tyt',true,210,2033331),
  (2026,'tyt',true,190,2166477),(2026,'tyt',true,170,2186977),(2026,'tyt',true,150,2187734),
  (2026,'tyt',true,130,2187742),(2026,'tyt',true,115,2187743),

  (2026,'say',true,550,154),(2026,'say',true,530,3500),(2026,'say',true,510,12887),
  (2026,'say',true,490,27402),(2026,'say',true,470,44919),(2026,'say',true,450,63669),
  (2026,'say',true,430,83511),(2026,'say',true,410,105112),(2026,'say',true,390,129485),
  (2026,'say',true,370,157778),(2026,'say',true,350,191247),(2026,'say',true,330,232317),
  (2026,'say',true,310,282213),(2026,'say',true,290,344726),(2026,'say',true,270,425443),
  (2026,'say',true,250,533920),(2026,'say',true,230,681176),(2026,'say',true,210,858167),
  (2026,'say',true,190,1019046),(2026,'say',true,170,1117304),(2026,'say',true,150,1135198),
  (2026,'say',true,130,1135713),(2026,'say',true,115,1135718),

  (2026,'soz',true,550,4),(2026,'soz',true,530,14),(2026,'soz',true,510,69),
  (2026,'soz',true,490,221),(2026,'soz',true,470,606),(2026,'soz',true,450,1566),
  (2026,'soz',true,430,4058),(2026,'soz',true,410,10184),(2026,'soz',true,390,22750),
  (2026,'soz',true,370,45237),(2026,'soz',true,350,82479),(2026,'soz',true,330,140496),
  (2026,'soz',true,310,223004),(2026,'soz',true,290,333238),(2026,'soz',true,270,474443),
  (2026,'soz',true,250,642816),(2026,'soz',true,230,814264),(2026,'soz',true,210,953036),
  (2026,'soz',true,190,1040347),(2026,'soz',true,170,1078859),(2026,'soz',true,150,1085505),
  (2026,'soz',true,130,1085697),(2026,'soz',true,115,1085698),

  (2026,'ea',true,550,12),(2026,'ea',true,530,98),(2026,'ea',true,510,394),
  (2026,'ea',true,490,1118),(2026,'ea',true,470,2482),(2026,'ea',true,450,5299),
  (2026,'ea',true,430,12363),(2026,'ea',true,410,29700),(2026,'ea',true,390,58772),
  (2026,'ea',true,370,97839),(2026,'ea',true,350,148570),(2026,'ea',true,330,215631),
  (2026,'ea',true,310,307918),(2026,'ea',true,290,429479),(2026,'ea',true,270,585271),
  (2026,'ea',true,250,775922),(2026,'ea',true,230,990764),(2026,'ea',true,210,1196809),
  (2026,'ea',true,190,1347025),(2026,'ea',true,170,1412649),(2026,'ea',true,150,1421093),
  (2026,'ea',true,130,1421289),(2026,'ea',true,115,1421290),

  (2026,'dil',true,550,14),(2026,'dil',true,530,231),(2026,'dil',true,510,942),
  (2026,'dil',true,490,2252),(2026,'dil',true,470,4241),(2026,'dil',true,450,7472),
  (2026,'dil',true,430,12254),(2026,'dil',true,410,18566),(2026,'dil',true,390,26352),
  (2026,'dil',true,370,34585),(2026,'dil',true,350,43129),(2026,'dil',true,330,51784),
  (2026,'dil',true,310,60948),(2026,'dil',true,290,70670),(2026,'dil',true,270,81109),
  (2026,'dil',true,250,92274),(2026,'dil',true,230,104127),(2026,'dil',true,210,116152),
  (2026,'dil',true,190,125789),(2026,'dil',true,170,131233),(2026,'dil',true,150,132714),
  (2026,'dil',true,130,132825),(2026,'dil',true,115,132826)
on conflict (yil, puan_turu, obp_dahil, puan) do update set kumulatif_aday = excluded.kumulatif_aday;

-- ---------- LGS ----------
-- MEB henüz YKS'deki gibi tam yığınsal tablo yayımlamıyor. Elimizdeki resmî
-- noktalar: 500 tam puan alan 452 öğrenci; ilk %5'lik dilim 43.850 öğrenci
-- (toplam ≈ 877.000). Aradaki eğri bu noktalara oturtuldu; MEB tam tabloyu
-- yayımladığında yalnız bu satırlar değiştirilir.
insert into public.puan_dagilimi (yil, puan_turu, obp_dahil, puan, kumulatif_aday) values
  (2026,'lgs',false,500,452),
  (2026,'lgs',false,480,3800),
  (2026,'lgs',false,460,12500),
  (2026,'lgs',false,440,28000),
  (2026,'lgs',false,425,43850),
  (2026,'lgs',false,400,61390),
  (2026,'lgs',false,375,110000),
  (2026,'lgs',false,350,175000),
  (2026,'lgs',false,325,265000),
  (2026,'lgs',false,300,375000),
  (2026,'lgs',false,275,495000),
  (2026,'lgs',false,250,615000),
  (2026,'lgs',false,225,725000),
  (2026,'lgs',false,200,820000),
  (2026,'lgs',false,150,872000),
  (2026,'lgs',false,100,877000)
on conflict (yil, puan_turu, obp_dahil, puan) do update set kumulatif_aday = excluded.kumulatif_aday;

-- ------------------------------------------------------------
-- Eski tablo artık kullanılmıyor; veri kaybı olmasın diye bırakıldı.
-- ------------------------------------------------------------
comment on table public.net_siralama_tablosu is
  'KULLANIM DIŞI (0020). Uydurma çapalar içeriyordu. Yerine puan_modeli + puan_katsayilari + puan_dagilimi geldi.';
