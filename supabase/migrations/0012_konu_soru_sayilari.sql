-- ============================================================
-- REHBER — Konu listesi ve "~kaç soru çıkıyor" düzeltmesi (0012)
--
-- Bulgular:
--  1) LGS'de üç dersin (T.C. İnkılap Tarihi, Yabancı Dil, Din Kültürü) hiç
--     konusu yoktu; öğrenci müfredatta boş ders görüyordu.
--  2) TYT Matematik'te konuların soru ortalamaları toplamı 48, dersin soru
--     sayısı 40 — yani bir dersten çıkabilecekten fazla soru vaat ediliyordu.
--     Aynı sorun Sosyal Bilimler'de (22 / 20).
--
-- Buradaki soru ortalamaları YAKLAŞIK değerlerdir; her dersin konu toplamı artık
-- o dersin sınavdaki soru sayısına eşit. Gerçek ÖSYM/MEB dağılımıyla ince ayar
-- yapılacaksa güncellenecek tek yer `topics.question_avg`.
-- ============================================================

-- ---------- 1) LGS: eksik konu listeleri ----------

insert into public.topics (subject_id, ad, sira, question_avg)
select s.id, v.ad, v.sira, v.soru
from public.subjects s
join public.exam_sessions es on es.id = s.session_id
cross join (values
  ('Bir Kahraman Doğuyor', 1, 1.0),
  ('Millî Uyanış: Bağımsızlık Yolunda Atılan Adımlar', 2, 2.0),
  ('Millî Bir Destan: Ya İstiklal Ya Ölüm', 3, 2.0),
  ('Atatürkçülük ve Çağdaşlaşan Türkiye', 4, 2.0),
  ('Demokratikleşme Çabaları', 5, 1.0),
  ('Atatürk Dönemi Türk Dış Politikası', 6, 1.0),
  ('Atatürk''ün Ölümü ve Sonrası', 7, 1.0)
) as v(ad, sira, soru)
where es.kod = 'lgs' and s.ad = 'T.C. İnkılap Tarihi'
  and not exists (select 1 from public.topics t where t.subject_id = s.id);

insert into public.topics (subject_id, ad, sira, question_avg)
select s.id, v.ad, v.sira, v.soru
from public.subjects s
join public.exam_sessions es on es.id = s.session_id
cross join (values
  ('Friendship', 1, 1.0), ('Teen Life', 2, 1.0), ('In the Kitchen', 3, 1.0),
  ('On the Phone', 4, 1.0), ('The Internet', 5, 1.0), ('Adventures', 6, 1.0),
  ('Tourism', 7, 1.0), ('Chores', 8, 1.0), ('Science', 9, 1.0),
  ('Natural Forces', 10, 1.0)
) as v(ad, sira, soru)
where es.kod = 'lgs' and s.ad = 'Yabancı Dil'
  and not exists (select 1 from public.topics t where t.subject_id = s.id);

insert into public.topics (subject_id, ad, sira, question_avg)
select s.id, v.ad, v.sira, v.soru
from public.subjects s
join public.exam_sessions es on es.id = s.session_id
cross join (values
  ('Kader İnancı', 1, 2.0),
  ('Zekât ve Sadaka', 2, 2.0),
  ('Din ve Hayat', 3, 2.0),
  ('Hz. Muhammed''in Örnekliği', 4, 2.0),
  ('Kur''an-ı Kerim ve Özellikleri', 5, 2.0)
) as v(ad, sira, soru)
where es.kod = 'lgs' and s.ad = 'Din Kültürü'
  and not exists (select 1 from public.topics t where t.subject_id = s.id);

-- ---------- 2) TYT: dersi aşan soru ortalamaları ----------

update public.topics t set question_avg = v.soru
from (values
  ('Temel Kavramlar', 2.0), ('Sayı Basamakları', 1.0), ('Bölme ve Bölünebilme', 2.0),
  ('EBOB — EKOK', 1.0), ('Rasyonel Sayılar', 1.0), ('Basit Eşitsizlikler', 1.0),
  ('Mutlak Değer', 1.0), ('Üslü Sayılar', 2.0), ('Köklü Sayılar', 2.0),
  ('Çarpanlara Ayırma', 1.0), ('Oran — Orantı', 2.0), ('Problemler', 7.0),
  ('Kümeler', 2.0), ('Fonksiyonlar', 2.0), ('Permütasyon — Kombinasyon', 1.0),
  ('Olasılık', 2.0)
) as v(ad, soru)
where t.ad = v.ad
  and t.subject_id in (
    select s.id from public.subjects s
    join public.exam_sessions es on es.id = s.session_id
    where es.kod = 'tyt' and s.ad = 'Matematik'
  );

update public.topics t set question_avg = v.soru
from (values
  ('Tarih — İlk Uygarlıklar', 1.0), ('Tarih — İslamiyet Öncesi Türkler', 1.0),
  ('Tarih — Osmanlı Kuruluş', 1.0), ('Tarih — İnkılap Tarihi', 2.0),
  ('Coğrafya — Harita Bilgisi', 2.0), ('Coğrafya — İklim', 2.0),
  ('Coğrafya — Nüfus ve Yerleşme', 1.0),
  ('Felsefe — Bilgi Felsefesi', 3.0), ('Felsefe — Ahlak Felsefesi', 2.0),
  ('Din Kültürü', 5.0)
) as v(ad, soru)
where t.ad = v.ad
  and t.subject_id in (
    select s.id from public.subjects s
    join public.exam_sessions es on es.id = s.session_id
    where es.kod = 'tyt' and s.ad = 'Sosyal Bilimler'
  );
