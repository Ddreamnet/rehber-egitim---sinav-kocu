-- ============================================================
-- REHBER — Haftalık program maddesine koç notu (0014)
--
-- Koç, programdaki her maddeye kısa bir yönerge yazabilsin; öğrenci bunu
-- kendi panelinde maddenin altında görsün. (Saat aralığı alanları arayüzden
-- kaldırıldı; `baslangic`/`bitis` sütunları eski kayıtlar için şemada duruyor.)
-- ============================================================

alter table public.plan_items add column if not exists not_metni text;

comment on column public.plan_items.not_metni is
  'Koçun o maddeye yazdığı yönerge; öğrencinin panelinde maddenin altında görünür.';
