-- ============================================================
-- PUSULA — Şema (0001)
-- YKS/LGS koçluk platformu. Roller: ogrenci | veli | koc | admin
-- Not: RLS policy'leri 0002_rls.sql dosyasındadır.
--
-- EWD (English with Dilara) devralımı: yetkinin ayrı `user_roles` tablosunda
-- tutulması, koç bakiyesi + hareket defteri, ödev yükleme, push bildirim
-- altyapısı ve kaynak tablosu EWD kalıbından alındı. Adlandırma ve ekran akışı
-- bu paketin planına göredir (çakışmada bu plan esastır).
-- ============================================================

create extension if not exists "pgcrypto";

-- ---------- Roller ve profiller ----------

-- Yetki rolü profil satırında DEĞİL ayrı tabloda tutulur: kullanıcı kendi
-- profilini güncelleyebildiği için rol profilde olsaydı yetki yükseltilebilirdi.
do $$ begin
  create type kullanici_rolu as enum ('ogrenci', 'veli', 'koc', 'admin');
exception when duplicate_object then null; end $$;

create table if not exists public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  ad_soyad      text not null,
  eposta        text,
  telefon       text,
  sinif         text,                       -- "12. sınıf"
  hedef_alan    text,                       -- "Sayısal" | "Eşit Ağırlık" | "Sözel" | "LGS"
  avatar_rengi  text,                       -- ders pastellerinden biri (token adı)
  aktif         boolean not null default true,
  created_at    timestamptz not null default now()
);

comment on table public.profiles is 'auth.users ile 1-1. Yetki rolü user_roles tablosundadır.';

create table if not exists public.user_roles (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  rol         kullanici_rolu not null,
  created_at  timestamptz not null default now(),
  unique (user_id, rol)
);

comment on table public.user_roles is
  'Yetkinin tek kaynağı. Politikalar public.has_rol() üzerinden okur.';

-- Koç ↔ öğrenci ataması
create table if not exists public.coach_students (
  coach_id     uuid not null references public.profiles(id) on delete cascade,
  student_id   uuid not null references public.profiles(id) on delete cascade,
  baslangic    date not null default current_date,
  aktif        boolean not null default true,
  arsivlendi   boolean not null default false,
  arsiv_tarihi timestamptz,
  hakkinda     text,                        -- koç/admin'in öğrenci hakkındaki notu
  primary key (coach_id, student_id)
);

-- Veli ↔ öğrenci bağı. detay_seviyesi'ni koç/admin belirler:
--   ozet  → yalnız plan + sonraki görüşme + paylaşılan rapor
--   tam   → ders bazlı ilerleme ve deneme tablosu da görünür
create table if not exists public.parent_students (
  parent_id       uuid not null references public.profiles(id) on delete cascade,
  student_id      uuid not null references public.profiles(id) on delete cascade,
  detay_seviyesi  text not null default 'ozet' check (detay_seviyesi in ('ozet', 'tam')),
  primary key (parent_id, student_id)
);

-- ---------- Müfredat: sınav → oturum → ders → konu ----------

create table if not exists public.exams (
  id      uuid primary key default gen_random_uuid(),
  kod     text not null unique,            -- 'yks' | 'lgs'
  ad      text not null,
  yil     int  not null,
  tarih   timestamptz not null             -- Europe/Istanbul saatiyle girilir
);

create table if not exists public.exam_sessions (
  id        uuid primary key default gen_random_uuid(),
  exam_id   uuid not null references public.exams(id) on delete cascade,
  kod       text not null,                 -- 'tyt' | 'ayt-say' | 'ayt-ea' | 'ayt-soz' | 'lgs'
  ad        text not null,                 -- "TYT", "AYT · Sayısal"
  sira      int  not null default 0,
  unique (exam_id, kod)
);

create table if not exists public.subjects (
  id          uuid primary key default gen_random_uuid(),
  session_id  uuid not null references public.exam_sessions(id) on delete cascade,
  ad          text not null,               -- "Matematik"
  renk        text not null,               -- 'matematik' | 'turkce' | 'fen' | 'sosyal' | 'dil'
  soru_sayisi int not null default 0,      -- oturumdaki soru sayısı (net max'ı)
  sira        int not null default 0
);

create table if not exists public.topics (
  id                 uuid primary key default gen_random_uuid(),
  subject_id         uuid not null references public.subjects(id) on delete cascade,
  ad                 text not null,
  sira               int  not null default 0,
  question_avg       numeric(4,1) not null default 0,  -- "~X soru çıkıyor"
  past_questions_url text                              -- çıkmış sorular
);

create index if not exists topics_subject_idx on public.topics(subject_id);

-- Konu kaynakları (EWD: global_topic_resources) — konu akordeonundaki bağlantılar
create table if not exists public.topic_resources (
  id          uuid primary key default gen_random_uuid(),
  topic_id    uuid not null references public.topics(id) on delete cascade,
  baslik      text not null,
  aciklama    text,
  tur         text not null default 'link'
                check (tur in ('link', 'video', 'pdf', 'test', 'kitap')),
  url         text not null,
  sira        int  not null default 0,
  created_at  timestamptz not null default now()
);

create index if not exists topic_resources_topic_idx on public.topic_resources(topic_id, sira);

-- ---------- Öğrenci ilerlemesi ----------

do $$ begin
  create type konu_durumu as enum ('baslanmadi', 'devam', 'tamam');
exception when duplicate_object then null; end $$;

create table if not exists public.topic_progress (
  student_id  uuid not null references public.profiles(id) on delete cascade,
  topic_id    uuid not null references public.topics(id) on delete cascade,
  durum       konu_durumu not null default 'baslanmadi',
  cozulen     int not null default 0,
  hedef       int not null default 40,
  updated_at  timestamptz not null default now(),
  primary key (student_id, topic_id)
);

create table if not exists public.question_entries (
  id          uuid primary key default gen_random_uuid(),
  student_id  uuid not null references public.profiles(id) on delete cascade,
  topic_id    uuid references public.topics(id) on delete set null,
  dogru       int not null default 0 check (dogru >= 0),
  yanlis      int not null default 0 check (yanlis >= 0),
  bos         int not null default 0 check (bos >= 0),
  -- net = doğru − yanlış/4
  net         numeric(6,2) generated always as (dogru - yanlis / 4.0) stored,
  created_at  timestamptz not null default now()
);

create index if not exists question_entries_student_idx
  on public.question_entries(student_id, created_at desc);

create table if not exists public.mock_exams (
  id          uuid primary key default gen_random_uuid(),
  student_id  uuid not null references public.profiles(id) on delete cascade,
  session_id  uuid references public.exam_sessions(id) on delete set null,
  ad          text not null,               -- "TYT D3"
  tarih       date not null,
  net         numeric(6,2) not null,
  created_at  timestamptz not null default now()
);

create index if not exists mock_exams_student_idx on public.mock_exams(student_id, tarih desc);

-- ---------- Net Denge ----------

do $$ begin
  create type hedef_tipi as enum ('puan', 'siralama');
exception when duplicate_object then null; end $$;

create table if not exists public.net_targets (
  id              uuid primary key default gen_random_uuid(),
  student_id      uuid not null references public.profiles(id) on delete cascade,
  session_id      uuid references public.exam_sessions(id) on delete set null,
  tip             hedef_tipi not null default 'siralama',
  hedef_puan      numeric(5,1),
  hedef_siralama  int,
  guncel          boolean not null default true,
  updated_at      timestamptz not null default now()
);

create table if not exists public.net_allocations (
  target_id   uuid not null references public.net_targets(id) on delete cascade,
  subject_id  uuid not null references public.subjects(id) on delete cascade,
  net         int not null default 0 check (net >= 0),
  max_net     int not null default 40,
  locked      boolean not null default false,   -- "sabitle" kilidi
  primary key (target_id, subject_id)
);

-- Tahmini sıralama interpolasyon tablosu (gerçek yerleştirme verisiyle güncellenir)
create table if not exists public.net_siralama_tablosu (
  exam_kod   text not null,
  net        int  not null,
  siralama   int  not null,
  primary key (exam_kod, net)
);

-- ---------- Görüşmeler ----------

do $$ begin
  create type gorusme_durumu as enum ('planlandi', 'tamamlandi', 'iptal');
exception when duplicate_object then null; end $$;

-- EWD `lesson_instances` kalıbı: her görüşme tekil bir örnektir; erteleme
-- geçmişi ve paket döngüsü satırda taşınır.
create table if not exists public.meetings (
  id                 uuid primary key default gen_random_uuid(),
  student_id         uuid not null references public.profiles(id) on delete cascade,
  coach_id           uuid not null references public.profiles(id) on delete cascade,
  baslangic          timestamptz not null,
  sure_dk            int not null default 30,
  tur                text not null default 'goruntulu'
                       check (tur in ('goruntulu', 'yuz_yuze', 'tanisma')),
  durum              gorusme_durumu not null default 'planlandi',
  gundem             text[] not null default '{}',
  katilim_url        text,
  sira_no            int,                    -- pakette kaçıncı görüşme
  paket_dongusu      int not null default 1,
  orijinal_baslangic timestamptz,            -- ertelendiyse ilk planlanan zaman
  erteleme_sayisi    int not null default 0,
  created_at         timestamptz not null default now()
);

create index if not exists meetings_student_idx on public.meetings(student_id, baslangic desc);
create index if not exists meetings_coach_idx on public.meetings(coach_id, baslangic desc);

-- Öğrencinin paket takibi (EWD: student_lesson_tracking)
create table if not exists public.student_packages (
  id                uuid primary key default gen_random_uuid(),
  student_id        uuid not null references public.profiles(id) on delete cascade,
  coach_id          uuid references public.profiles(id) on delete set null,
  haftalik_gorusme  int  not null default 1,
  donem_baslangic   date not null default date_trunc('month', current_date)::date,
  paket_dongusu     int  not null default 1,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  unique (student_id, donem_baslangic, paket_dongusu)
);

create table if not exists public.meeting_notes (
  id                  uuid primary key default gen_random_uuid(),
  meeting_id          uuid references public.meetings(id) on delete set null,
  student_id          uuid not null references public.profiles(id) on delete cascade,
  coach_id            uuid not null references public.profiles(id) on delete cascade,
  metin               text not null,
  shared_with_parent  boolean not null default false,   -- veli yalnızca true olanı görür
  etiketler           text[] not null default '{}',
  created_at          timestamptz not null default now()
);

create index if not exists meeting_notes_student_idx
  on public.meeting_notes(student_id, created_at desc);

-- ---------- Haftalık plan ----------

create table if not exists public.weekly_plans (
  id              uuid primary key default gen_random_uuid(),
  student_id      uuid not null references public.profiles(id) on delete cascade,
  coach_id        uuid references public.profiles(id) on delete set null,
  hafta_baslangic date not null,                       -- pazartesi
  gonderildi      boolean not null default false,
  created_at      timestamptz not null default now(),
  unique (student_id, hafta_baslangic)
);

create table if not exists public.plan_items (
  id           uuid primary key default gen_random_uuid(),
  plan_id      uuid not null references public.weekly_plans(id) on delete cascade,
  topic_id     uuid references public.topics(id) on delete set null,
  baslik       text not null,
  tamamlandi   boolean not null default false,
  gun          date,
  baslangic    time,                                   -- "Bugünün akışı" saat çizelgesi
  bitis        time,
  sira         int not null default 0
);

create index if not exists plan_items_plan_idx on public.plan_items(plan_id);

-- ---------- Veli → koç mesajı ("Koça mesaj bırak") ----------

create table if not exists public.parent_messages (
  id          uuid primary key default gen_random_uuid(),
  parent_id   uuid not null references public.profiles(id) on delete cascade,
  student_id  uuid not null references public.profiles(id) on delete cascade,
  coach_id    uuid references public.profiles(id) on delete set null,
  metin       text not null,
  okundu      boolean not null default false,
  created_at  timestamptz not null default now()
);

create index if not exists parent_messages_coach_idx
  on public.parent_messages(coach_id, created_at desc);

-- ---------- Ödev (EWD: homework_submissions) ----------

create table if not exists public.homework_submissions (
  id            uuid primary key default gen_random_uuid(),
  student_id    uuid not null references public.profiles(id) on delete cascade,
  coach_id      uuid not null references public.profiles(id) on delete cascade,
  topic_id      uuid references public.topics(id) on delete set null,
  baslik        text not null,
  aciklama      text,
  dosya_url     text,
  dosya_tipi    text,
  dosya_adi     text,
  -- Aynı anda yüklenen dosyaları tek bildirimde toplamak için
  grup_id       uuid not null default gen_random_uuid(),
  yukleyen_id   uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  created_at    timestamptz not null default now()
);

create index if not exists homework_student_idx
  on public.homework_submissions(student_id, created_at desc);

-- ---------- Koç ödemeleri (EWD: teacher_balance + balance_events + payment_history) ----------

-- Hakediş dakika üzerinden birikir; her değişiklik hareket defterine yazılır.
create table if not exists public.coach_balance (
  id                        uuid primary key default gen_random_uuid(),
  coach_id                  uuid not null unique references public.profiles(id) on delete cascade,
  toplam_dakika             int not null default 0,
  tamamlanan_gorusme        int not null default 0,
  tamamlanan_tanisma        int not null default 0,
  gorusme_dakika            int not null default 0,
  tanisma_dakika            int not null default 0,
  manuel_duzeltme_dakika    int not null default 0,
  updated_at                timestamptz not null default now()
);

create table if not exists public.balance_events (
  id             uuid primary key default gen_random_uuid(),
  coach_id       uuid not null references public.profiles(id) on delete cascade,
  tur            text not null check (tur in (
                   'gorusme_tamam', 'gorusme_geri_al',
                   'tanisma_tamam', 'tanisma_geri_al',
                   'manuel_duzeltme', 'odeme', 'sifirlama')),
  dakika         int not null,
  meeting_id     uuid references public.meetings(id) on delete set null,
  student_id     uuid references public.profiles(id) on delete set null,
  paket_dongusu  int,
  notlar         text,
  created_at     timestamptz not null default now()
);

create index if not exists balance_events_coach_idx
  on public.balance_events(coach_id, created_at desc);

create table if not exists public.coach_payments (
  id             uuid primary key default gen_random_uuid(),
  coach_id       uuid not null references public.profiles(id) on delete cascade,
  donem          date not null,                        -- ayın ilk günü
  ogrenci_sayisi int not null default 0,
  gorusme_sayisi int not null default 0,
  dakika         int not null default 0,               -- hakedişin dakika karşılığı
  tutar          numeric(10,2) not null default 0,
  para_birimi    text not null default 'TRY',
  durum          text not null default 'bekliyor' check (durum in ('bekliyor', 'odendi')),
  odenme_tarihi  date,
  notlar         text,
  created_at     timestamptz not null default now(),
  unique (coach_id, donem)
);

-- ---------- Blog (CMS) ----------

create table if not exists public.posts (
  id            uuid primary key default gen_random_uuid(),
  slug          text not null unique,
  baslik        text not null,
  ozet          text,
  kategori      text,                                  -- chip'te ders rengiyle gösterilir
  kapak_url     text,
  icerik        text,                                  -- markdown
  okuma_dk      int not null default 5,
  yazar_id      uuid references public.profiles(id) on delete set null,
  yazar_adi     text,
  yazar_unvani  text,
  one_cikan     boolean not null default false,
  yayinda       boolean not null default false,
  yayin_tarihi  timestamptz,
  created_at    timestamptz not null default now()
);

create index if not exists posts_yayin_idx on public.posts(yayinda, yayin_tarihi desc);

-- ---------- Başvuru formu ----------

create table if not exists public.applications (
  id          uuid primary key default gen_random_uuid(),
  ad_soyad    text not null,
  telefon     text not null,
  eposta      text,
  sinav       text not null,                           -- 'yks' | 'lgs'
  hedef       text,
  notlar      text,
  durum       text not null default 'yeni' check (durum in ('yeni', 'arandi', 'kaydoldu', 'kapandi')),
  created_at  timestamptz not null default now()
);

-- ---------- Bildirimler (EWD: notifications + push_tokens + reminder log) ----------

-- Üst bardaki zil: kullanıcıya düşen bildirimler
create table if not exists public.notifications (
  id                 uuid primary key default gen_random_uuid(),
  recipient_id       uuid not null references public.profiles(id) on delete cascade,
  tur                text not null default 'genel'
                       check (tur in ('genel', 'plan', 'gorusme', 'odev', 'rapor', 'uyari')),
  baslik             text not null,
  metin              text,
  ilgili_yol         text,                             -- uygulama içi hedef rota
  meeting_id         uuid references public.meetings(id) on delete cascade,
  homework_id        uuid references public.homework_submissions(id) on delete cascade,
  okundu             boolean not null default false,
  push_islemde       timestamptz,
  push_gonderildi    timestamptz,
  created_at         timestamptz not null default now()
);

create index if not exists notifications_recipient_idx
  on public.notifications(recipient_id, okundu, created_at desc);

-- Capacitor push kayıtları
create table if not exists public.push_tokens (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  token       text not null unique,
  platform    text not null check (platform in ('ios', 'android', 'web')),
  aktif       boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Görüşme hatırlatmasının iki kez gitmesini engelleyen kayıt
create table if not exists public.reminder_log (
  id            uuid primary key default gen_random_uuid(),
  recipient_id  uuid not null references public.profiles(id) on delete cascade,
  meeting_id    uuid references public.meetings(id) on delete cascade,
  tur           text not null default 'gorusme_10dk',
  gonderildi_at timestamptz not null default now(),
  unique (recipient_id, meeting_id, tur)
);

-- ---------- Aktivite akışı (admin "son aktiviteler") ----------

create table if not exists public.activities (
  id          uuid primary key default gen_random_uuid(),
  tur         text not null,                           -- 'kayit' | 'uyari' | 'gorusme' | 'blog'
  metin       text not null,
  aktor_id    uuid references public.profiles(id) on delete set null,
  created_at  timestamptz not null default now()
);

create index if not exists activities_idx on public.activities(created_at desc);
