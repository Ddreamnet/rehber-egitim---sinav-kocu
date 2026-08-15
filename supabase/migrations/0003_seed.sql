-- ============================================================
-- PUSULA — Başlangıç verisi (0003)
-- Müfredat ağacı, tahmini sıralama tablosu ve blog yazıları.
-- Idempotent: tekrar çalıştırılabilir.
-- ============================================================

-- ---------- Sınavlar ----------

insert into public.exams (kod, ad, yil, tarih) values
  ('yks', 'YKS', 2027, '2027-06-20T10:15:00+03:00'),
  ('lgs', 'LGS', 2027, '2027-06-06T09:30:00+03:00')
on conflict (kod) do update set tarih = excluded.tarih, yil = excluded.yil;

insert into public.exam_sessions (exam_id, kod, ad, sira)
select e.id, v.kod, v.ad, v.sira
from public.exams e
join (values
  ('yks', 'tyt',     'TYT',              1),
  ('yks', 'ayt-say', 'AYT · Sayısal',    2),
  ('yks', 'ayt-ea',  'AYT · Eşit Ağırlık', 3),
  ('yks', 'ayt-soz', 'AYT · Sözel',      4),
  ('lgs', 'lgs',     'LGS',              1)
) as v(exam_kod, kod, ad, sira) on v.exam_kod = e.kod
on conflict (exam_id, kod) do update set ad = excluded.ad;

-- ---------- Dersler ----------

insert into public.subjects (session_id, ad, renk, soru_sayisi, sira)
select s.id, v.ad, v.renk, v.soru, v.sira
from public.exam_sessions s
join (values
  ('tyt',     'Türkçe',           'turkce',    40, 1),
  ('tyt',     'Matematik',        'matematik', 40, 2),
  ('tyt',     'Fen Bilimleri',    'fen',       20, 3),
  ('tyt',     'Sosyal Bilimler',  'sosyal',    20, 4),
  ('ayt-say', 'Matematik',        'matematik', 40, 1),
  ('ayt-say', 'Fizik',            'fen',       14, 2),
  ('ayt-say', 'Kimya',            'sosyal',    13, 3),
  ('ayt-say', 'Biyoloji',         'dil',       13, 4),
  ('lgs',     'Türkçe',           'turkce',    20, 1),
  ('lgs',     'Matematik',        'matematik', 20, 2),
  ('lgs',     'Fen Bilimleri',    'fen',       20, 3),
  ('lgs',     'T.C. İnkılap Tarihi', 'sosyal', 10, 4),
  ('lgs',     'Yabancı Dil',      'dil',       10, 5)
) as v(oturum, ad, renk, soru, sira) on v.oturum = s.kod
where not exists (
  select 1 from public.subjects x where x.session_id = s.id and x.ad = v.ad
);

-- ---------- Konular ----------

insert into public.topics (subject_id, ad, sira, question_avg)
select sub.id, v.ad, v.sira, v.ort
from public.subjects sub
join public.exam_sessions ses on ses.id = sub.session_id
join (values
  -- TYT Matematik
  ('tyt', 'Matematik', 'Temel Kavramlar',            1, 3.0),
  ('tyt', 'Matematik', 'Sayı Basamakları',           2, 2.0),
  ('tyt', 'Matematik', 'Bölme ve Bölünebilme',       3, 2.0),
  ('tyt', 'Matematik', 'EBOB — EKOK',                4, 1.0),
  ('tyt', 'Matematik', 'Rasyonel Sayılar',           5, 2.0),
  ('tyt', 'Matematik', 'Basit Eşitsizlikler',        6, 1.0),
  ('tyt', 'Matematik', 'Mutlak Değer',               7, 2.0),
  ('tyt', 'Matematik', 'Üslü Sayılar',               8, 2.0),
  ('tyt', 'Matematik', 'Köklü Sayılar',              9, 3.0),
  ('tyt', 'Matematik', 'Çarpanlara Ayırma',         10, 2.0),
  ('tyt', 'Matematik', 'Oran — Orantı',             11, 2.0),
  ('tyt', 'Matematik', 'Problemler',                12, 8.0),
  ('tyt', 'Matematik', 'Kümeler',                   13, 2.0),
  ('tyt', 'Matematik', 'Fonksiyonlar',              14, 2.0),
  ('tyt', 'Matematik', 'Permütasyon — Kombinasyon', 15, 2.0),
  ('tyt', 'Matematik', 'Olasılık',                  16, 2.0),
  ('tyt', 'Matematik', 'Geometri — Üçgenler',       17, 4.0),
  ('tyt', 'Matematik', 'Geometri — Çokgenler',      18, 2.0),
  ('tyt', 'Matematik', 'Geometri — Çember ve Daire', 19, 2.0),
  ('tyt', 'Matematik', 'Geometri — Katı Cisimler',  20, 2.0),
  -- TYT Türkçe
  ('tyt', 'Türkçe', 'Sözcükte Anlam',        1, 4.0),
  ('tyt', 'Türkçe', 'Cümlede Anlam',         2, 5.0),
  ('tyt', 'Türkçe', 'Paragrafta Anlam',      3, 12.0),
  ('tyt', 'Türkçe', 'Ses Bilgisi',           4, 1.0),
  ('tyt', 'Türkçe', 'Yazım Kuralları',       5, 2.0),
  ('tyt', 'Türkçe', 'Noktalama İşaretleri',  6, 2.0),
  ('tyt', 'Türkçe', 'Sözcük Türleri',        7, 3.0),
  ('tyt', 'Türkçe', 'Cümlenin Ögeleri',      8, 2.0),
  ('tyt', 'Türkçe', 'Fiilimsiler',           9, 2.0),
  ('tyt', 'Türkçe', 'Anlatım Bozukluğu',    10, 2.0),
  -- TYT Fen
  ('tyt', 'Fen Bilimleri', 'Fizik — Kuvvet ve Hareket',   1, 3.0),
  ('tyt', 'Fen Bilimleri', 'Fizik — Basınç',              2, 2.0),
  ('tyt', 'Fen Bilimleri', 'Fizik — Isı ve Sıcaklık',     3, 2.0),
  ('tyt', 'Fen Bilimleri', 'Fizik — Elektrik',            4, 2.0),
  ('tyt', 'Fen Bilimleri', 'Kimya — Maddenin Halleri',    5, 2.0),
  ('tyt', 'Fen Bilimleri', 'Kimya — Karışımlar',          6, 2.0),
  ('tyt', 'Fen Bilimleri', 'Kimya — Asit ve Bazlar',      7, 2.0),
  ('tyt', 'Fen Bilimleri', 'Biyoloji — Hücre',            8, 2.0),
  ('tyt', 'Fen Bilimleri', 'Biyoloji — Canlılar Dünyası', 9, 2.0),
  ('tyt', 'Fen Bilimleri', 'Biyoloji — Ekosistem',       10, 1.0),
  -- TYT Sosyal
  ('tyt', 'Sosyal Bilimler', 'Tarih — İlk Uygarlıklar',       1, 2.0),
  ('tyt', 'Sosyal Bilimler', 'Tarih — İslamiyet Öncesi Türkler', 2, 2.0),
  ('tyt', 'Sosyal Bilimler', 'Tarih — Osmanlı Kuruluş',       3, 2.0),
  ('tyt', 'Sosyal Bilimler', 'Tarih — İnkılap Tarihi',        4, 3.0),
  ('tyt', 'Sosyal Bilimler', 'Coğrafya — Harita Bilgisi',     5, 2.0),
  ('tyt', 'Sosyal Bilimler', 'Coğrafya — İklim',              6, 2.0),
  ('tyt', 'Sosyal Bilimler', 'Coğrafya — Nüfus ve Yerleşme',  7, 2.0),
  ('tyt', 'Sosyal Bilimler', 'Felsefe — Bilgi Felsefesi',     8, 2.0),
  ('tyt', 'Sosyal Bilimler', 'Felsefe — Ahlak Felsefesi',     9, 2.0),
  ('tyt', 'Sosyal Bilimler', 'Din Kültürü',                  10, 3.0),
  -- AYT Sayısal
  ('ayt-say', 'Matematik', 'Fonksiyonlar',      1, 3.0),
  ('ayt-say', 'Matematik', 'Polinomlar',        2, 2.0),
  ('ayt-say', 'Matematik', 'İkinci Dereceden Denklemler', 3, 3.0),
  ('ayt-say', 'Matematik', 'Trigonometri',      4, 4.0),
  ('ayt-say', 'Matematik', 'Logaritma',         5, 3.0),
  ('ayt-say', 'Matematik', 'Diziler',           6, 2.0),
  ('ayt-say', 'Matematik', 'Limit ve Süreklilik', 7, 3.0),
  ('ayt-say', 'Matematik', 'Türev',             8, 5.0),
  ('ayt-say', 'Matematik', 'İntegral',          9, 5.0),
  ('ayt-say', 'Fizik', 'Vektörler',             1, 2.0),
  ('ayt-say', 'Fizik', 'Kuvvet ve Hareket',     2, 3.0),
  ('ayt-say', 'Fizik', 'Elektrik ve Manyetizma', 3, 3.0),
  ('ayt-say', 'Fizik', 'Dalgalar',              4, 2.0),
  ('ayt-say', 'Fizik', 'Modern Fizik',          5, 2.0),
  ('ayt-say', 'Kimya', 'Modern Atom Teorisi',   1, 3.0),
  ('ayt-say', 'Kimya', 'Kimyasal Tepkimeler',   2, 2.0),
  ('ayt-say', 'Kimya', 'Gazlar',                3, 2.0),
  ('ayt-say', 'Kimya', 'Kimyasal Denge',        4, 2.0),
  ('ayt-say', 'Kimya', 'Organik Kimya',         5, 3.0),
  ('ayt-say', 'Biyoloji', 'Sinir Sistemi',      1, 3.0),
  ('ayt-say', 'Biyoloji', 'Kalıtım',            2, 3.0),
  ('ayt-say', 'Biyoloji', 'Bitki Biyolojisi',   3, 3.0),
  ('ayt-say', 'Biyoloji', 'Ekosistem Ekolojisi', 4, 2.0),
  -- LGS
  ('lgs', 'Matematik', 'Çarpanlar ve Katlar',   1, 2.0),
  ('lgs', 'Matematik', 'Üslü İfadeler',         2, 2.0),
  ('lgs', 'Matematik', 'Kareköklü İfadeler',    3, 2.0),
  ('lgs', 'Matematik', 'Veri Analizi',          4, 2.0),
  ('lgs', 'Matematik', 'Olasılık',              5, 2.0),
  ('lgs', 'Matematik', 'Cebirsel İfadeler',     6, 3.0),
  ('lgs', 'Matematik', 'Denklemler ve Eşitsizlikler', 7, 3.0),
  ('lgs', 'Matematik', 'Üçgenler',              8, 2.0),
  ('lgs', 'Matematik', 'Dönüşüm Geometrisi',    9, 1.0),
  ('lgs', 'Türkçe', 'Sözcükte Anlam',           1, 3.0),
  ('lgs', 'Türkçe', 'Cümlede Anlam',            2, 3.0),
  ('lgs', 'Türkçe', 'Paragraf',                 3, 8.0),
  ('lgs', 'Türkçe', 'Fiilimsiler',              4, 2.0),
  ('lgs', 'Türkçe', 'Cümlenin Ögeleri',         5, 2.0),
  ('lgs', 'Fen Bilimleri', 'Mevsimler ve İklim', 1, 2.0),
  ('lgs', 'Fen Bilimleri', 'DNA ve Genetik Kod', 2, 3.0),
  ('lgs', 'Fen Bilimleri', 'Basınç',             3, 2.0),
  ('lgs', 'Fen Bilimleri', 'Madde ve Endüstri',  4, 3.0),
  ('lgs', 'Fen Bilimleri', 'Basit Makineler',    5, 2.0),
  ('lgs', 'Fen Bilimleri', 'Enerji Dönüşümleri', 6, 2.0),
  ('lgs', 'Fen Bilimleri', 'Elektrik Yükleri',   7, 2.0)
) as v(oturum, ders, ad, sira, ort)
  on v.oturum = ses.kod and v.ders = sub.ad
where not exists (
  select 1 from public.topics t where t.subject_id = sub.id and t.ad = v.ad
);

-- ---------- Tahmini sıralama tablosu ----------
-- Tasarımdaki interpolasyon noktaları; gerçek yerleştirme verisiyle güncellenecek.

insert into public.net_siralama_tablosu (exam_kod, net, siralama) values
  ('yks', 110, 5000),
  ('yks', 100, 15000),
  ('yks',  90, 52000),
  ('yks',  80, 110000),
  ('yks',  70, 210000),
  ('yks',  60, 380000),
  ('yks',  50, 650000),
  ('yks',   0, 2400000)
on conflict (exam_kod, net) do update set siralama = excluded.siralama;

-- ---------- Blog ----------

insert into public.posts
  (slug, baslik, ozet, kategori, okuma_dk, yazar_adi, yazar_unvani, one_cikan, yayinda, yayin_tarihi, icerik)
values
  ('matematik-neti-neden-artmiyor',
   'Matematik neti neden artmıyor? (ve 1 haftada nasıl kırılır)',
   'Soru sayısı artıyor ama net yerinde sayıyorsa sorun çalışkanlık değil, seçim: çözdüğün sorular zaten bildiklerin. Eksik kapama haftası nasıl kurulur, adım adım.',
   'Matematik', 7, 'Merve Demir', 'Matematik koçu', true, true, '2026-08-12T09:00:00+03:00',
   'Günde 60 soru çözüyorsun, net üç aydır 12''de. Sorun çalışkanlık değil, seçim.'),
  ('deneme-analizi-20-dakika',
   'Deneme analizi: sınav sonrası 20 dakikalık yöntem',
   'Yanlışları üçe ayır: bilmiyordum, yanlış okudum, süre yetmedi. Her birinin ilacı farklı.',
   'Strateji', 5, 'Merve Demir', 'Koç', false, true, '2026-08-05T09:00:00+03:00', ''),
  ('lgs-son-100-gun',
   'LGS''ye son 100 gün: haftalık ritim nasıl kurulur?',
   'Gün gün değil hafta hafta düşün: 1 ana konu, 1 tekrar bloğu, 1 deneme.',
   'Planlama', 6, 'İpek Yavuz', 'Koç', false, true, '2026-07-28T09:00:00+03:00', ''),
  ('paragrafta-hiz',
   'Paragrafta hız: 3 alışkanlık, 8 dakika kazanç',
   'Soruyu önce oku, seçeneğe dönme, kanıt cümlesini işaretle. Hepsi bu.',
   'Türkçe', 4, 'Naz Şahin', 'Koç', false, true, '2026-07-21T09:00:00+03:00', ''),
  ('aralikli-tekrar',
   'Ezber değil aralıklı tekrar: 10 dakikalık kurulum',
   'Unutma eğrisiyle savaşma, onu takvime bağla: 1 gün, 3 gün, 1 hafta.',
   'Alışkanlık', 5, 'Baran Ekiz', 'Koç', false, true, '2026-07-14T09:00:00+03:00', ''),
  ('kaynak-secimi',
   'Kaynak seçimi: az kitap, çok tur',
   'Üç kaynağı bitirmiş görünmek mi, bir kaynağı üç tur dönmek mi? Veriyle bakalım.',
   'Strateji', 6, 'Merve Demir', 'Koç', false, true, '2026-07-07T09:00:00+03:00', ''),
  ('sinav-yilinda-veli-olmak',
   'Sınav yılında veli olmak: destek ile baskının sınırı',
   '"Bugün kaç soru çözdün?" yerine sorulabilecek üç soru.',
   'Veliler için', 5, 'Kerem Arslan', 'Koç', false, true, '2026-06-30T09:00:00+03:00', '')
on conflict (slug) do update
  set baslik = excluded.baslik, ozet = excluded.ozet, kategori = excluded.kategori;
