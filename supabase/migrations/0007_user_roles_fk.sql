-- ============================================================
-- REHBER — user_roles ↔ profiles ilişkisi (0007)
--
-- Bulgu: rol `user_roles` tablosuna taşındıktan sonra admin ve veli
-- panellerindeki sorgular hâlâ `profiles.rol` sütununu kullanıyordu ve
-- 400 dönüyordu. Sorguları user_roles üzerinden yazabilmek için PostgREST'in
-- iki tabloyu ilişkilendirebilmesi gerekiyor; bunun için user_roles.user_id
-- auth.users yerine public.profiles(id)'ye bağlanır (profiles.id zaten
-- auth.users.id ile aynı ve ondan cascade siliniyor).
-- ============================================================

alter table public.user_roles drop constraint if exists user_roles_user_id_fkey;

alter table public.user_roles
  add constraint user_roles_user_id_fkey
  foreign key (user_id) references public.profiles(id) on delete cascade;

create index if not exists user_roles_rol_idx on public.user_roles(rol);
