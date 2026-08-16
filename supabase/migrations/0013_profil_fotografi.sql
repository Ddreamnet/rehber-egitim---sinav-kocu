-- ============================================================
-- REHBER — Profil fotoğrafı ve aktivite temizleme (0013)
--
-- 1) Koç ve öğrenciler isimlerinin yanındaki yuvarlağa kendi fotoğraflarını
--    koyabilsin: `profiles.avatar_url` + herkese açık `avatarlar` bucket'ı.
--    Yazma yalnız kişinin kendi klasörüne (avatarlar/<user_id>/...).
-- 2) Admin panelindeki "Son aktiviteler" akışı sürekli birikiyordu; silme
--    politikası olmadığı için temizlenemiyordu.
-- ============================================================

alter table public.profiles add column if not exists avatar_url text;

comment on column public.profiles.avatar_url is
  'Storage''daki profil fotoğrafının herkese açık adresi. Boşsa baş harf avatarı gösterilir.';

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatarlar', 'avatarlar', true, 2097152,
        array['image/jpeg','image/png','image/webp'])
on conflict (id) do update
  set public = true,
      file_size_limit = 2097152,
      allowed_mime_types = array['image/jpeg','image/png','image/webp'];

drop policy if exists avatar_oku on storage.objects;
create policy avatar_oku on storage.objects for select
  to anon, authenticated using (bucket_id = 'avatarlar');

drop policy if exists avatar_ekle on storage.objects;
create policy avatar_ekle on storage.objects for insert to authenticated
  with check (bucket_id = 'avatarlar' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists avatar_guncelle on storage.objects;
create policy avatar_guncelle on storage.objects for update to authenticated
  using (bucket_id = 'avatarlar' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'avatarlar' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists avatar_sil on storage.objects;
create policy avatar_sil on storage.objects for delete to authenticated
  using (bucket_id = 'avatarlar' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists activities_delete_admin on public.activities;
create policy activities_delete_admin on public.activities for delete
  to authenticated using (public.admin_mi());
