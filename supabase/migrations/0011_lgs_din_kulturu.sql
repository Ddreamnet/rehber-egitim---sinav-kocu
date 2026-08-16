-- ============================================================
-- REHBER — LGS müfredatında eksik ders (0011)
--
-- Bulgu: LGS oturumunda 5 ders vardı ve soru sayıları toplamı 80 çıkıyordu;
-- oysa LGS 90 soru. "Din Kültürü ve Ahlak Bilgisi" hiç tanımlanmamış.
-- Sonuç: Net Denge'de LGS hedefleri tutturulamıyor, çapa tablosundaki 90 net
-- hiçbir zaman ulaşılamaz görünüyordu.
-- ============================================================

insert into public.subjects (session_id, ad, renk, soru_sayisi, sira)
select es.id, 'Din Kültürü', 'sosyal', 10, 6
from public.exam_sessions es
where es.kod = 'lgs'
  and not exists (
    select 1 from public.subjects s
    where s.session_id = es.id and s.ad = 'Din Kültürü'
  );
