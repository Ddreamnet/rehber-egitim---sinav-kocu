-- ============================================================
-- REHBER — Net Denge: puan çapaları ve LGS tablosu (0010)
--
-- Bulgu: Net Denge'de hedef (sıralama/puan) hiçbir hesabı beslemiyordu; hedefi
-- değiştirmek ekranda hiçbir şeyi değiştirmiyor, "Hedef puan" seçeneği ise
-- karşılığı olmadığı için "0 puan" gösteriyordu.
--
-- Düzeltme, hedeften gereken toplam neti hesaplayıp derslere dağıtmak. Bunun
-- için tabloda net ↔ puan karşılığı da gerekiyor.
--
-- ÖNEMLİ: Buradaki sıralama ve puan değerleri YAKLAŞIK ÇAPALARDIR; tıpkı 0003
-- seed'indeki sıralama değerleri gibi gerçek ÖSYM yerleştirme verisiyle
-- değiştirilmelidir. Arayüzde sonuç her zaman "tahmini" etiketiyle gösterilir.
-- Güncellenecek tek yer bu tablodur.
-- ============================================================

alter table public.net_siralama_tablosu add column if not exists puan numeric(5,1);

comment on column public.net_siralama_tablosu.puan is
  'Aynı net için yaklaşık yerleştirme puanı. Boşsa puan hedefi kullanılamaz.';

-- ---------- YKS çapaları ----------
update public.net_siralama_tablosu set puan = v.puan
from (values (110, 480.0), (100, 455.0), (90, 430.0), (80, 405.0),
             (70, 380.0), (60, 350.0), (50, 320.0), (0, 180.0)) as v(net, puan)
where net_siralama_tablosu.exam_kod = 'yks' and net_siralama_tablosu.net = v.net;

-- ---------- LGS çapaları ----------
-- LGS'de hiç satır yoktu; LGS öğrencisinde tablo boş dönüyor ve hesap
-- varsayılan YKS eğrisine düşüyordu.
insert into public.net_siralama_tablosu (exam_kod, net, siralama, puan) values
  ('lgs', 90, 1000, 500.0),
  ('lgs', 85, 5000, 480.0),
  ('lgs', 75, 30000, 445.0),
  ('lgs', 65, 90000, 410.0),
  ('lgs', 55, 200000, 375.0),
  ('lgs', 45, 380000, 340.0),
  ('lgs', 30, 700000, 290.0),
  ('lgs', 0, 1200000, 200.0)
on conflict (exam_kod, net) do update
  set siralama = excluded.siralama, puan = excluded.puan;
