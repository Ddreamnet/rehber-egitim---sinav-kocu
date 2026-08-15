-- ============================================================
-- PUSULA — RLS (0002)
-- İlke: öğrenci yalnız kendi verisi · veli bağlı öğrenciyi SALT-OKUNUR
-- (not/rapor yalnız shared_with_parent=true) · koç yalnız kendi öğrencileri
-- · admin tümü · blog herkese açık okuma.
-- ============================================================

-- ---------- Yardımcı fonksiyonlar (RLS özyinelemesini önlemek için security definer) ----------

-- EWD `has_role()` kalıbı: yetki profil satırından değil user_roles'tan okunur,
-- böylece kullanıcı kendi profilini güncelleyerek rol yükseltemez.
create or replace function public.has_rol(_user_id uuid, _rol kullanici_rolu)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.user_roles where user_id = _user_id and rol = _rol
  );
$$;

create or replace function public.gecerli_rol()
returns kullanici_rolu language sql stable security definer set search_path = public as $$
  select rol from public.user_roles
  where user_id = auth.uid()
  -- Birden fazla rol varsa en yetkilisi kazanır
  order by case rol when 'admin' then 0 when 'koc' then 1 when 'veli' then 2 else 3 end
  limit 1;
$$;

create or replace function public.admin_mi()
returns boolean language sql stable security definer set search_path = public as $$
  select public.has_rol(auth.uid(), 'admin');
$$;

-- auth.uid() bu öğrencinin koçu mu?
create or replace function public.kocu_muyum(p_student uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.coach_students
    where coach_id = auth.uid() and student_id = p_student and aktif
  );
$$;

-- auth.uid() bu öğrencinin velisi mi?
create or replace function public.velisi_miyim(p_student uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.parent_students
    where parent_id = auth.uid() and student_id = p_student
  );
$$;

-- Veliye "tam" detay açılmış mı? (koç belirler)
create or replace function public.veli_detay_tam(p_student uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.parent_students
    where parent_id = auth.uid() and student_id = p_student and detay_seviyesi = 'tam'
  );
$$;

-- Öğrenciyi görme hakkı olan herkes (kendisi, koçu, velisi, admin)
create or replace function public.ogrenciyi_gorebilir(p_student uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select p_student = auth.uid()
      or public.admin_mi()
      or public.kocu_muyum(p_student)
      or public.velisi_miyim(p_student);
$$;

-- ---------- Yeni kullanıcı → profil ----------

-- Profil + varsayılan rol. Rol yükseltmeyi yalnızca admin yapar (bkz. user_roles
-- politikaları); buradaki metadata rolü yalnızca 'ogrenci' | 'veli' olabilir.
create or replace function public.yeni_kullanici()
returns trigger language plpgsql security definer set search_path = public, auth, pg_temp as $$
declare
  istenen kullanici_rolu;
begin
  insert into public.profiles (id, ad_soyad, eposta)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'ad_soyad', split_part(new.email, '@', 1)),
    new.email
  )
  on conflict (id) do nothing;

  istenen := coalesce((new.raw_user_meta_data ->> 'rol')::kullanici_rolu, 'ogrenci');
  if istenen not in ('ogrenci', 'veli') then
    istenen := 'ogrenci';
  end if;

  insert into public.user_roles (user_id, rol)
  values (new.id, istenen)
  on conflict (user_id, rol) do nothing;

  return new;
exception when others then
  raise warning 'Profil oluşturulamadı (%): %', new.id, sqlerrm;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.yeni_kullanici();

-- ---------- RLS'i aç ----------

alter table public.profiles            enable row level security;
alter table public.user_roles          enable row level security;
alter table public.topic_resources     enable row level security;
alter table public.student_packages    enable row level security;
alter table public.homework_submissions enable row level security;
alter table public.coach_balance       enable row level security;
alter table public.balance_events      enable row level security;
alter table public.notifications       enable row level security;
alter table public.push_tokens         enable row level security;
alter table public.reminder_log        enable row level security;
alter table public.coach_students      enable row level security;
alter table public.parent_students     enable row level security;
alter table public.exams               enable row level security;
alter table public.exam_sessions       enable row level security;
alter table public.subjects            enable row level security;
alter table public.topics              enable row level security;
alter table public.topic_progress      enable row level security;
alter table public.question_entries    enable row level security;
alter table public.mock_exams          enable row level security;
alter table public.net_targets         enable row level security;
alter table public.net_allocations     enable row level security;
alter table public.net_siralama_tablosu enable row level security;
alter table public.meetings            enable row level security;
alter table public.meeting_notes       enable row level security;
alter table public.weekly_plans        enable row level security;
alter table public.plan_items          enable row level security;
alter table public.parent_messages     enable row level security;
alter table public.coach_payments      enable row level security;
alter table public.posts               enable row level security;
alter table public.applications        enable row level security;
alter table public.activities          enable row level security;

-- ---------- profiles ----------

drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles for select to authenticated
using (
  id = auth.uid()
  or public.admin_mi()
  or public.kocu_muyum(id)                      -- koç → öğrencisi
  or public.velisi_miyim(id)                    -- veli → çocuğu
  or exists (                                   -- öğrenci/veli → ilgili koç
    select 1 from public.coach_students cs
    where cs.coach_id = profiles.id
      and (cs.student_id = auth.uid() or public.velisi_miyim(cs.student_id))
  )
);

drop policy if exists profiles_update_self on public.profiles;
create policy profiles_update_self on public.profiles for update to authenticated
using (id = auth.uid() or public.admin_mi())
with check (id = auth.uid() or public.admin_mi());

drop policy if exists profiles_insert_admin on public.profiles;
create policy profiles_insert_admin on public.profiles for insert to authenticated
with check (public.admin_mi() or id = auth.uid());

-- ---------- user_roles: herkes kendi rolünü görür, yalnız admin yazar ----------

drop policy if exists user_roles_select on public.user_roles;
create policy user_roles_select on public.user_roles for select to authenticated
using (user_id = auth.uid() or public.admin_mi());

drop policy if exists user_roles_write_admin on public.user_roles;
create policy user_roles_write_admin on public.user_roles for all to authenticated
using (public.admin_mi()) with check (public.admin_mi());

-- ---------- Eşleşme tabloları ----------

drop policy if exists coach_students_select on public.coach_students;
create policy coach_students_select on public.coach_students for select to authenticated
using (
  coach_id = auth.uid() or student_id = auth.uid()
  or public.admin_mi() or public.velisi_miyim(student_id)
);

drop policy if exists coach_students_write_admin on public.coach_students;
create policy coach_students_write_admin on public.coach_students for all to authenticated
using (public.admin_mi()) with check (public.admin_mi());

drop policy if exists parent_students_select on public.parent_students;
create policy parent_students_select on public.parent_students for select to authenticated
using (
  parent_id = auth.uid() or student_id = auth.uid()
  or public.admin_mi() or public.kocu_muyum(student_id)
);

-- Detay seviyesini koç veya admin belirler
drop policy if exists parent_students_write on public.parent_students;
create policy parent_students_write on public.parent_students for all to authenticated
using (public.admin_mi() or public.kocu_muyum(student_id))
with check (public.admin_mi() or public.kocu_muyum(student_id));

-- ---------- Müfredat: giriş yapan herkes okur, admin yazar ----------

do $$
declare t text;
begin
  foreach t in array array[
    'exams', 'exam_sessions', 'subjects', 'topics', 'topic_resources', 'net_siralama_tablosu'
  ]
  loop
    execute format('drop policy if exists %I_select on public.%I', t, t);
    execute format(
      'create policy %I_select on public.%I for select to authenticated, anon using (true)', t, t);
    execute format('drop policy if exists %I_write on public.%I', t, t);
    execute format(
      'create policy %I_write on public.%I for all to authenticated using (public.admin_mi()) with check (public.admin_mi())',
      t, t);
  end loop;
end $$;

-- ---------- topic_progress ----------

drop policy if exists topic_progress_select on public.topic_progress;
create policy topic_progress_select on public.topic_progress for select to authenticated
using (
  student_id = auth.uid()
  or public.admin_mi()
  or public.kocu_muyum(student_id)
  or public.veli_detay_tam(student_id)          -- veli: yalnız detay açıksa
);

drop policy if exists topic_progress_write on public.topic_progress;
create policy topic_progress_write on public.topic_progress for all to authenticated
using (student_id = auth.uid() or public.admin_mi() or public.kocu_muyum(student_id))
with check (student_id = auth.uid() or public.admin_mi() or public.kocu_muyum(student_id));

-- ---------- question_entries ----------

drop policy if exists question_entries_select on public.question_entries;
create policy question_entries_select on public.question_entries for select to authenticated
using (
  student_id = auth.uid()
  or public.admin_mi()
  or public.kocu_muyum(student_id)
  or public.veli_detay_tam(student_id)
);

drop policy if exists question_entries_write on public.question_entries;
create policy question_entries_write on public.question_entries for all to authenticated
using (student_id = auth.uid() or public.admin_mi() or public.kocu_muyum(student_id))
with check (student_id = auth.uid() or public.admin_mi() or public.kocu_muyum(student_id));

-- ---------- mock_exams ----------

drop policy if exists mock_exams_select on public.mock_exams;
create policy mock_exams_select on public.mock_exams for select to authenticated
using (
  student_id = auth.uid()
  or public.admin_mi()
  or public.kocu_muyum(student_id)
  or public.velisi_miyim(student_id)            -- net gelişimi velinin özetinde de var
);

drop policy if exists mock_exams_write on public.mock_exams;
create policy mock_exams_write on public.mock_exams for all to authenticated
using (student_id = auth.uid() or public.admin_mi() or public.kocu_muyum(student_id))
with check (student_id = auth.uid() or public.admin_mi() or public.kocu_muyum(student_id));

-- ---------- Net Denge ----------

drop policy if exists net_targets_select on public.net_targets;
create policy net_targets_select on public.net_targets for select to authenticated
using (student_id = auth.uid() or public.admin_mi() or public.kocu_muyum(student_id));

drop policy if exists net_targets_write on public.net_targets;
create policy net_targets_write on public.net_targets for all to authenticated
using (student_id = auth.uid() or public.admin_mi() or public.kocu_muyum(student_id))
with check (student_id = auth.uid() or public.admin_mi() or public.kocu_muyum(student_id));

drop policy if exists net_allocations_select on public.net_allocations;
create policy net_allocations_select on public.net_allocations for select to authenticated
using (exists (
  select 1 from public.net_targets t
  where t.id = net_allocations.target_id
    and (t.student_id = auth.uid() or public.admin_mi() or public.kocu_muyum(t.student_id))
));

drop policy if exists net_allocations_write on public.net_allocations;
create policy net_allocations_write on public.net_allocations for all to authenticated
using (exists (
  select 1 from public.net_targets t
  where t.id = net_allocations.target_id
    and (t.student_id = auth.uid() or public.admin_mi() or public.kocu_muyum(t.student_id))
))
with check (exists (
  select 1 from public.net_targets t
  where t.id = net_allocations.target_id
    and (t.student_id = auth.uid() or public.admin_mi() or public.kocu_muyum(t.student_id))
));

-- ---------- Görüşmeler ----------

drop policy if exists meetings_select on public.meetings;
create policy meetings_select on public.meetings for select to authenticated
using (
  student_id = auth.uid() or coach_id = auth.uid()
  or public.admin_mi() or public.velisi_miyim(student_id)   -- veli: sonraki görüşmeyi görür
);

-- Koç yalnız KENDİ öğrencisine görüşme açabilir: coach_id kontrolü tek başına
-- yetmez, aksi halde koç herhangi bir öğrenciye kayıt yazabilirdi.
drop policy if exists meetings_write on public.meetings;
create policy meetings_write on public.meetings for all to authenticated
using (public.admin_mi() or (coach_id = auth.uid() and public.kocu_muyum(student_id)))
with check (public.admin_mi() or (coach_id = auth.uid() and public.kocu_muyum(student_id)));

-- Not: veli yalnızca koçun "veliyle paylaş" işaretlediği notu görür.
drop policy if exists meeting_notes_select on public.meeting_notes;
create policy meeting_notes_select on public.meeting_notes for select to authenticated
using (
  student_id = auth.uid()
  or coach_id = auth.uid()
  or public.admin_mi()
  or (public.velisi_miyim(student_id) and shared_with_parent)
);

drop policy if exists meeting_notes_write on public.meeting_notes;
create policy meeting_notes_write on public.meeting_notes for all to authenticated
using (public.admin_mi() or (coach_id = auth.uid() and public.kocu_muyum(student_id)))
with check (public.admin_mi() or (coach_id = auth.uid() and public.kocu_muyum(student_id)));

-- ---------- Haftalık plan ----------

drop policy if exists weekly_plans_select on public.weekly_plans;
create policy weekly_plans_select on public.weekly_plans for select to authenticated
using (
  student_id = auth.uid() or coach_id = auth.uid()
  or public.admin_mi() or public.velisi_miyim(student_id)
);

drop policy if exists weekly_plans_write on public.weekly_plans;
create policy weekly_plans_write on public.weekly_plans for all to authenticated
using (public.admin_mi() or public.kocu_muyum(student_id))
with check (public.admin_mi() or public.kocu_muyum(student_id));

drop policy if exists plan_items_select on public.plan_items;
create policy plan_items_select on public.plan_items for select to authenticated
using (exists (
  select 1 from public.weekly_plans p
  where p.id = plan_items.plan_id
    and (p.student_id = auth.uid() or p.coach_id = auth.uid()
         or public.admin_mi() or public.velisi_miyim(p.student_id))
));

-- Öğrenci yalnız "tamamlandı" işaretler; plan içeriğini koç kurar.
drop policy if exists plan_items_update_student on public.plan_items;
create policy plan_items_update_student on public.plan_items for update to authenticated
using (exists (
  select 1 from public.weekly_plans p
  where p.id = plan_items.plan_id and p.student_id = auth.uid()
))
with check (exists (
  select 1 from public.weekly_plans p
  where p.id = plan_items.plan_id and p.student_id = auth.uid()
));

drop policy if exists plan_items_write_coach on public.plan_items;
create policy plan_items_write_coach on public.plan_items for all to authenticated
using (exists (
  select 1 from public.weekly_plans p
  where p.id = plan_items.plan_id and (public.admin_mi() or public.kocu_muyum(p.student_id))
))
with check (exists (
  select 1 from public.weekly_plans p
  where p.id = plan_items.plan_id and (public.admin_mi() or public.kocu_muyum(p.student_id))
));

-- ---------- Öğrenci paketi ----------

drop policy if exists student_packages_select on public.student_packages;
create policy student_packages_select on public.student_packages for select to authenticated
using (
  student_id = auth.uid() or coach_id = auth.uid()
  or public.admin_mi() or public.velisi_miyim(student_id)
);

drop policy if exists student_packages_write on public.student_packages;
create policy student_packages_write on public.student_packages for all to authenticated
using (public.admin_mi() or public.kocu_muyum(student_id))
with check (public.admin_mi() or public.kocu_muyum(student_id));

-- ---------- Ödev ----------
-- Öğrenci kendi ödevini yükler ve görür; koç kendi öğrencilerininkini yönetir.

drop policy if exists homework_select on public.homework_submissions;
create policy homework_select on public.homework_submissions for select to authenticated
using (
  student_id = auth.uid()
  or coach_id = auth.uid()
  or public.admin_mi()
  or public.kocu_muyum(student_id)
  or public.veli_detay_tam(student_id)
);

drop policy if exists homework_insert on public.homework_submissions;
create policy homework_insert on public.homework_submissions for insert to authenticated
with check (
  yukleyen_id = auth.uid()
  and (student_id = auth.uid() or public.admin_mi() or public.kocu_muyum(student_id))
);

drop policy if exists homework_update_own on public.homework_submissions;
create policy homework_update_own on public.homework_submissions for update to authenticated
using (yukleyen_id = auth.uid() or public.admin_mi() or public.kocu_muyum(student_id))
with check (yukleyen_id = auth.uid() or public.admin_mi() or public.kocu_muyum(student_id));

drop policy if exists homework_delete_own on public.homework_submissions;
create policy homework_delete_own on public.homework_submissions for delete to authenticated
using (yukleyen_id = auth.uid() or public.admin_mi());

-- ---------- Koç ödemeleri ve bakiye ----------
-- Koç kendi bakiyesini yalnızca OKUR; yazma admin'e ve tetikleyicilere aittir.

drop policy if exists coach_balance_select on public.coach_balance;
create policy coach_balance_select on public.coach_balance for select to authenticated
using (coach_id = auth.uid() or public.admin_mi());

drop policy if exists coach_balance_write on public.coach_balance;
create policy coach_balance_write on public.coach_balance for all to authenticated
using (public.admin_mi()) with check (public.admin_mi());

drop policy if exists balance_events_select on public.balance_events;
create policy balance_events_select on public.balance_events for select to authenticated
using (coach_id = auth.uid() or public.admin_mi());

drop policy if exists balance_events_write on public.balance_events;
create policy balance_events_write on public.balance_events for all to authenticated
using (public.admin_mi()) with check (public.admin_mi());

drop policy if exists coach_payments_select on public.coach_payments;
create policy coach_payments_select on public.coach_payments for select to authenticated
using (coach_id = auth.uid() or public.admin_mi());

drop policy if exists coach_payments_write on public.coach_payments;
create policy coach_payments_write on public.coach_payments for all to authenticated
using (public.admin_mi()) with check (public.admin_mi());

-- ---------- Bildirimler ve push ----------

drop policy if exists notifications_select on public.notifications;
create policy notifications_select on public.notifications for select to authenticated
using (recipient_id = auth.uid() or public.admin_mi());

drop policy if exists notifications_update_own on public.notifications;
create policy notifications_update_own on public.notifications for update to authenticated
using (recipient_id = auth.uid()) with check (recipient_id = auth.uid());

drop policy if exists notifications_write on public.notifications;
create policy notifications_write on public.notifications for insert to authenticated
with check (public.admin_mi() or public.kocu_muyum(recipient_id) or recipient_id = auth.uid());

drop policy if exists notifications_delete_admin on public.notifications;
create policy notifications_delete_admin on public.notifications for delete to authenticated
using (public.admin_mi());

drop policy if exists push_tokens_own on public.push_tokens;
create policy push_tokens_own on public.push_tokens for all to authenticated
using (user_id = auth.uid() or public.admin_mi())
with check (user_id = auth.uid() or public.admin_mi());

drop policy if exists reminder_log_select on public.reminder_log;
create policy reminder_log_select on public.reminder_log for select to authenticated
using (recipient_id = auth.uid() or public.admin_mi());

drop policy if exists reminder_log_write_admin on public.reminder_log;
create policy reminder_log_write_admin on public.reminder_log for all to authenticated
using (public.admin_mi()) with check (public.admin_mi());

-- ---------- Veli mesajları ----------

drop policy if exists parent_messages_select on public.parent_messages;
create policy parent_messages_select on public.parent_messages for select to authenticated
using (parent_id = auth.uid() or coach_id = auth.uid() or public.admin_mi());

drop policy if exists parent_messages_insert on public.parent_messages;
create policy parent_messages_insert on public.parent_messages for insert to authenticated
with check (parent_id = auth.uid() and public.velisi_miyim(student_id));

drop policy if exists parent_messages_update_coach on public.parent_messages;
create policy parent_messages_update_coach on public.parent_messages for update to authenticated
using (coach_id = auth.uid() or public.admin_mi())
with check (coach_id = auth.uid() or public.admin_mi());

-- ---------- Blog: herkese açık okuma ----------

drop policy if exists posts_select_public on public.posts;
create policy posts_select_public on public.posts for select to anon, authenticated
using (yayinda or public.admin_mi());

drop policy if exists posts_write_admin on public.posts;
create policy posts_write_admin on public.posts for all to authenticated
using (public.admin_mi()) with check (public.admin_mi());

-- ---------- Başvuru: herkes gönderir, admin okur ----------

drop policy if exists applications_insert_public on public.applications;
create policy applications_insert_public on public.applications for insert to anon, authenticated
with check (true);

drop policy if exists applications_read_admin on public.applications;
create policy applications_read_admin on public.applications for select to authenticated
using (public.admin_mi());

drop policy if exists applications_update_admin on public.applications;
create policy applications_update_admin on public.applications for update to authenticated
using (public.admin_mi()) with check (public.admin_mi());

-- ---------- Aktivite akışı: admin ----------

drop policy if exists activities_select_admin on public.activities;
create policy activities_select_admin on public.activities for select to authenticated
using (public.admin_mi());

drop policy if exists activities_insert on public.activities;
create policy activities_insert on public.activities for insert to authenticated
with check (public.admin_mi() or aktor_id = auth.uid());

-- ---------- Tablo ayrıcalıkları ----------
-- Satır erişimini yukarıdaki policy'ler belirler; bunlar yalnızca tablo düzeyi
-- izinlerdir (varsayılan ayrıcalıklar farklı yapılandırılmışsa da çalışsın diye).

grant usage on schema public to anon, authenticated;
grant select on all tables in schema public to anon, authenticated;
grant insert, update, delete on all tables in schema public to authenticated;
grant insert on public.applications to anon;
