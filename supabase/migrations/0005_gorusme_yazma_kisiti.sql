-- ============================================================
-- PUSULA — Görüşme yazma kısıtı (0005)
--
-- Bulgu (RLS testinde yakalandı): `meetings` ve `meeting_notes` yazma
-- politikaları yalnızca `coach_id = auth.uid()` kontrolü yapıyordu. Koç,
-- coach_id alanına kendi kimliğini yazıp student_id'ye BAŞKA bir koçun
-- öğrencisini koyarak o öğrenciye görüşme/not ekleyebiliyordu.
--
-- Düzeltme: koçun o öğrencinin koçu olması da şart (`kocu_muyum`).
-- 0002_rls.sql dosyası da aynı hale getirildi; bu migration yalnızca
-- daha önce uygulanmış veritabanlarını hizalar.
-- ============================================================

drop policy if exists meetings_write on public.meetings;
create policy meetings_write on public.meetings for all to authenticated
using (public.admin_mi() or (coach_id = auth.uid() and public.kocu_muyum(student_id)))
with check (public.admin_mi() or (coach_id = auth.uid() and public.kocu_muyum(student_id)));

drop policy if exists meeting_notes_write on public.meeting_notes;
create policy meeting_notes_write on public.meeting_notes for all to authenticated
using (public.admin_mi() or (coach_id = auth.uid() and public.kocu_muyum(student_id)))
with check (public.admin_mi() or (coach_id = auth.uid() and public.kocu_muyum(student_id)));
