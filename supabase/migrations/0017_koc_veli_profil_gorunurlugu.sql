-- ============================================================
-- 0017 — Koç, öğrencisinin velisini görebilsin
--
-- Mesajlaşma açıldığında ortaya çıktı: koç veliyle yazışabiliyor ama velinin
-- profil satırını okuyamadığı için ad, avatar ve konuşma başlığı "Bilinmeyen"
-- geliyordu. Yön tek taraflıydı — öğrenci/veli ilgili koçu zaten görüyordu.
-- ============================================================

create or replace function public.ogrencimin_velisi_mi(p_veli uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1
    from public.parent_students ps
    join public.coach_students cs on cs.student_id = ps.student_id
    where ps.parent_id = p_veli
      and cs.coach_id = auth.uid()
      and cs.aktif
  );
$$;

drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles for select to authenticated
using (
  id = auth.uid()
  or public.admin_mi()
  or public.kocu_muyum(id)                      -- koç → öğrencisi
  or public.ogrencimin_velisi_mi(id)            -- koç → öğrencisinin velisi
  or public.velisi_miyim(id)                    -- veli → çocuğu
  or exists (                                   -- öğrenci/veli → ilgili koç
    select 1 from public.coach_students cs
    where cs.coach_id = profiles.id
      and (cs.student_id = auth.uid() or public.velisi_miyim(cs.student_id))
  )
);
