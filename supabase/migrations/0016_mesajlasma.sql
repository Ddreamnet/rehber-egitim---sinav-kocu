-- ============================================================
-- 0016 — Sistem içi mesajlaşma
--
-- Koç ile öğrenci/veli arasındaki iletişim sistem dışındaydı (telefon,
-- WhatsApp); ne admin görebiliyordu ne de kayıt kalıyordu. Konuşma iki kişi
-- arasında birebir; `ogrenci_id` konuşmanın hangi öğrenci hakkında olduğunu
-- tutar (veli konuşmasında karşı taraf veli, konu öğrencidir).
-- ============================================================

create table if not exists public.conversations (
  id           uuid primary key default gen_random_uuid(),
  koc_id       uuid not null references public.profiles(id) on delete cascade,
  kisi_id      uuid not null references public.profiles(id) on delete cascade,
  ogrenci_id   uuid references public.profiles(id) on delete set null,
  tur          text not null check (tur in ('ogrenci', 'veli')),
  son_mesaj_at timestamptz,
  created_at   timestamptz not null default now(),
  unique (koc_id, kisi_id)
);

create index if not exists conversations_koc_idx  on public.conversations(koc_id, son_mesaj_at desc);
create index if not exists conversations_kisi_idx on public.conversations(kisi_id, son_mesaj_at desc);

create table if not exists public.messages (
  id              uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  gonderen_id     uuid not null references public.profiles(id) on delete cascade,
  metin           text not null check (length(btrim(metin)) > 0),
  duzenlendi      boolean not null default false,
  okundu_at       timestamptz,
  created_at      timestamptz not null default now()
);

create index if not exists messages_conv_idx on public.messages(conversation_id, created_at);

-- Konuşmanın katılımcısı mıyım? Admin her konuşmayı görür ve düzenler.
create or replace function public.konusmada_miyim(p_conv uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.conversations c
    where c.id = p_conv and (c.koc_id = auth.uid() or c.kisi_id = auth.uid())
  ) or public.admin_mi();
$$;

create or replace function public.koc_muyum()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = auth.uid() and rol = 'koc');
$$;

alter table public.conversations enable row level security;
alter table public.messages      enable row level security;

drop policy if exists conversations_select on public.conversations;
create policy conversations_select on public.conversations for select to authenticated
  using (koc_id = auth.uid() or kisi_id = auth.uid() or public.admin_mi());

-- Konuşmayı koç kendi öğrenci/velisiyle açar; admin herkes için açabilir.
drop policy if exists conversations_insert on public.conversations;
create policy conversations_insert on public.conversations for insert to authenticated
  with check (public.admin_mi() or (koc_id = auth.uid() and public.koc_muyum()));

drop policy if exists conversations_update on public.conversations;
create policy conversations_update on public.conversations for update to authenticated
  using (koc_id = auth.uid() or kisi_id = auth.uid() or public.admin_mi())
  with check (koc_id = auth.uid() or kisi_id = auth.uid() or public.admin_mi());

drop policy if exists conversations_delete on public.conversations;
create policy conversations_delete on public.conversations for delete to authenticated
  using (public.admin_mi());

drop policy if exists messages_select on public.messages;
create policy messages_select on public.messages for select to authenticated
  using (public.konusmada_miyim(conversation_id));

-- Kimse başkasının adına yazamaz; admin de kendi adına yazar.
drop policy if exists messages_insert on public.messages;
create policy messages_insert on public.messages for insert to authenticated
  with check (gonderen_id = auth.uid() and public.konusmada_miyim(conversation_id));

-- Okundu işaretlemesi katılımcının, metin düzenlemesi adminin.
drop policy if exists messages_update on public.messages;
create policy messages_update on public.messages for update to authenticated
  using (public.konusmada_miyim(conversation_id))
  with check (public.konusmada_miyim(conversation_id));

drop policy if exists messages_delete on public.messages;
create policy messages_delete on public.messages for delete to authenticated
  using (public.admin_mi() or gonderen_id = auth.uid());

-- Konuşma listesinin sıralaması son mesaja göre; tetikleyici olmadan
-- her gönderimde ikinci bir update yazmak gerekirdi.
create or replace function public.konusma_zamani()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  update public.conversations set son_mesaj_at = new.created_at where id = new.conversation_id;
  return new;
end $$;

drop trigger if exists messages_konusma_zamani on public.messages;
create trigger messages_konusma_zamani after insert on public.messages
  for each row execute function public.konusma_zamani();

grant select, insert, update, delete on public.conversations to authenticated;
grant select, insert, update, delete on public.messages to authenticated;
