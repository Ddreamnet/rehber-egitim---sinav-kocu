-- ============================================================
-- PUSULA — Artık 'ogrenci' rolü temizliği (0008)
--
-- Bulgu (panel denetiminde yakalandı): `yeni_kullanici` tetikleyicisi her yeni
-- auth kullanıcısına varsayılan 'ogrenci' rolü veriyor. Koç, veli ve admin
-- hesapları da bu rolü taşıdığı için:
--   * admin panelindeki "Tüm öğrenciler" tablosunda görünüyorlardı,
--   * "Aktif öğrenci" sayacı ve öğrenci büyümesi grafiği şişiyordu,
--   * raporlardaki durum dağılımı yanlış çıkıyordu.
--
-- Kalıcı çözüm `koc-ekle` / `ogrenci-ekle` Edge Function'larında: rolü
-- atadıktan sonra varsayılan 'ogrenci' satırı siliniyor. Bu migration daha önce
-- açılmış hesapları hizalar. (İstemci tarafı da savunma amaçlı süzüyor.)
-- ============================================================

delete from public.user_roles ur
where ur.rol = 'ogrenci'
  and exists (
    select 1 from public.user_roles x
    where x.user_id = ur.user_id and x.rol in ('koc', 'veli', 'admin')
  );
