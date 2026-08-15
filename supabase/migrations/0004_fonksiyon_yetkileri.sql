-- ============================================================
-- PUSULA — Yardımcı fonksiyon yüzeyi (0004)
--
-- Neden: Supabase güvenlik denetimi, `security definer` yardımcıların
-- `/rest/v1/rpc/...` üzerinden çağrılabilir olmasını uyarı olarak veriyor.
--
-- ÖNEMLİ: EXECUTE hakkını tamamen geri almak RLS'i BOZAR — policy ifadeleri
-- çağıran kullanıcının yetkisiyle değerlendirilir, yani `authenticated`/`anon`
-- rollerinin bu fonksiyonlar üzerinde EXECUTE hakkı olmak zorundadır.
-- (Denendi: "permission denied for function admin_mi" ile her sorgu düştü.)
--
-- Bu yüzden yüzeyi daraltıyoruz:
--   * `has_rol(user_id, rol)` API'den çıkarılır — tek gerçek sızıntı buydu,
--     çünkü rastgele bir kullanıcının rolü yoklanabiliyordu. Yalnızca
--     `admin_mi()` içinden çağrıldığı için `yetki` şemasına taşınır
--     (PostgREST yalnız `public` şemasını yayınlar).
--   * `gecerli_rol()` ve `ogrenciyi_gorebilir()` hiçbir policy'de kullanılmıyor;
--     kaldırılır.
--   * Kalanlar (`admin_mi`, `kocu_muyum`, `velisi_miyim`, `veli_detay_tam`)
--     yalnızca ÇAĞIRANIN kendi durumunu döndürür (auth.uid() üzerinden), bu
--     yüzden RPC'den çağrılabilir olmaları bilgi sızdırmaz.
-- ============================================================

-- ---------- Policy'lerin ihtiyaç duyduğu EXECUTE haklarını geri ver ----------

grant execute on function public.admin_mi() to anon, authenticated;
grant execute on function public.kocu_muyum(uuid) to anon, authenticated;
grant execute on function public.velisi_miyim(uuid) to anon, authenticated;
grant execute on function public.veli_detay_tam(uuid) to anon, authenticated;

-- ---------- has_rol'ü yayınlanmayan şemaya taşı ----------

create schema if not exists yetki;
revoke all on schema yetki from public;
grant usage on schema yetki to authenticated, anon;

create or replace function yetki.has_rol(_user_id uuid, _rol kullanici_rolu)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.user_roles where user_id = _user_id and rol = _rol
  );
$$;

-- admin_mi security definer olduğu için yetki.has_rol'ü çağıranın hakkı olmadan da çağırabilir
create or replace function public.admin_mi()
returns boolean language sql stable security definer set search_path = public, yetki as $$
  select yetki.has_rol(auth.uid(), 'admin');
$$;

grant execute on function public.admin_mi() to anon, authenticated;
revoke execute on function yetki.has_rol(uuid, kullanici_rolu) from anon, authenticated, public;

drop function if exists public.has_rol(uuid, kullanici_rolu);

-- ---------- Kullanılmayan yardımcıları kaldır ----------

drop function if exists public.gecerli_rol();
drop function if exists public.ogrenciyi_gorebilir(uuid);

-- Trigger fonksiyonu: tetikleyici sistem tarafından çalıştırılır, çağıranın
-- EXECUTE hakkına gerek yoktur; RPC yüzeyinden kaldırılabilir.
revoke execute on function public.yeni_kullanici() from anon, authenticated, public;
