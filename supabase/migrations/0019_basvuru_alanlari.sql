-- ============================================================
-- 0019 — Başvuru formu alanları
--
-- Form artık ad/soyad'ı ayrı alıyor ve öğrencinin sınıfını, alanını,
-- ilgilendiği programı ve paketi soruyor. Sınav adayı olmayan (ara dönem
-- 7/9/10. sınıf) öğrenciler de başvurabildiği için 'sinav' tek başına yetmiyor.
--
-- Eski 'ad_soyad' ve 'sinav' sütunları yerinde bırakıldı: mevcut satırlar
-- oradan okunuyor, yeni satırlarda ikisi de doldurulmaya devam ediyor.
-- ============================================================

alter table public.applications
  add column if not exists ad      text,
  add column if not exists soyad   text,
  add column if not exists sinif   text,
  add column if not exists alan    text,
  add column if not exists program text,
  add column if not exists paket   text,
  -- KVKK: 18 yaş altı öğrencide veli onayı formda açıkça alınır.
  add column if not exists veli_onayi boolean;

-- Geçerli değerler uygulamadaki listelerle aynı (src/config/site.ts).
alter table public.applications drop constraint if exists applications_sinif_check;
alter table public.applications
  add constraint applications_sinif_check
  check (sinif is null or sinif in ('5', '6', '7', '8', '9', '10', '11', '12', 'mezun'));

alter table public.applications drop constraint if exists applications_alan_check;
alter table public.applications
  add constraint applications_alan_check
  check (alan is null or alan in ('say', 'ea', 'soz'));

alter table public.applications drop constraint if exists applications_program_check;
alter table public.applications
  add constraint applications_program_check
  check (program is null or program in ('lgs', 'ara', 'yks'));

-- Yeni başvuruları admin panelinde tarihe göre listelemek için
create index if not exists applications_created_idx
  on public.applications (created_at desc);

-- ------------------------------------------------------------
-- Not: `applications` üzerinde anon'un SELECT politikası yok (0002_rls.sql).
-- Bu doğru; ancak istemci insert'i `.select('id')` ile zincirliyordu ve
-- RETURNING satırı okunamadığı için her başvuru hata dönüyordu. Düzeltme
-- istemci tarafında (src/data/repo.ts): artık dönüş istenmiyor.
-- Politikalar değişmedi.
-- ------------------------------------------------------------
