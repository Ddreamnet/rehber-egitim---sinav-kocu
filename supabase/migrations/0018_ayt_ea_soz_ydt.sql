-- ============================================================
-- 0018 — AYT Eşit Ağırlık / Sözel ve YDT müfredatı
--
-- `ayt-ea` ve `ayt-soz` oturumları 0003_seed'de açılmış ama hiç doldurulmamıştı:
-- Eşit Ağırlık ya da Sözel öğrencisi müfredat, ilerleme ve Net Denge ekranlarında
-- boş liste görüyordu. "Dil" alanı seçilebiliyordu ama karşılığı olan YDT oturumu
-- hiç yoktu.
--
-- AYT Matematik, Sayısal ile Eşit Ağırlık'ta aynı sınav kitapçığından geliyor;
-- ikinci kez elle yazmak yerine kopyalanıyor.
-- ============================================================

insert into public.exam_sessions (exam_id, kod, ad, sira)
select id, 'ydt', 'YDT · Yabancı Dil', 5 from public.exams where kod = 'yks'
on conflict (exam_id, kod) do update set ad = excluded.ad, sira = excluded.sira;

-- ---------- AYT · Eşit Ağırlık ----------
do $$
declare o uuid; d uuid;
begin
  select id into o from public.exam_sessions where kod = 'ayt-ea';
  if o is null then return; end if;
  if exists (select 1 from public.subjects where session_id = o) then return; end if;

  insert into public.subjects (session_id, ad, renk, soru_sayisi, sira)
  values (o, 'Türk Dili ve Edebiyatı', 'turkce', 24, 1) returning id into d;
  insert into public.topics (subject_id, ad, sira, question_avg) values
    (d, 'Şiir Bilgisi ve Söz Sanatları', 1, 3),
    (d, 'Anlatım Biçimleri ve Düşünceyi Geliştirme Yolları', 2, 2),
    (d, 'İslamiyet Öncesi Türk Edebiyatı ve Geçiş Dönemi', 3, 2),
    (d, 'Halk Edebiyatı', 4, 3),
    (d, 'Divan Edebiyatı', 5, 3),
    (d, 'Tanzimat Edebiyatı', 6, 2),
    (d, 'Servet-i Fünûn ve Fecr-i Âti', 7, 2),
    (d, 'Millî Edebiyat', 8, 2),
    (d, 'Cumhuriyet Dönemi Türk Edebiyatı', 9, 4),
    (d, 'Edebî Akımlar ve Dünya Edebiyatı', 10, 1);

  insert into public.subjects (session_id, ad, renk, soru_sayisi, sira)
  values (o, 'Tarih-1', 'sosyal', 10, 2) returning id into d;
  insert into public.topics (subject_id, ad, sira, question_avg) values
    (d, 'Tarih Bilimi', 1, 1),
    (d, 'İlk ve Orta Çağlarda Dünya', 2, 1),
    (d, 'İlk Türk Devletleri', 3, 2),
    (d, 'İslam Tarihi ve Türklerin İslamiyet’i Kabulü', 4, 2),
    (d, 'Türkiye Tarihi: Selçuklu ve Beylikler', 5, 2),
    (d, 'Beylikten Devlete Osmanlı', 6, 1),
    (d, 'Dünya Gücü Osmanlı Devleti', 7, 1);

  insert into public.subjects (session_id, ad, renk, soru_sayisi, sira)
  values (o, 'Coğrafya-1', 'sosyal', 6, 3) returning id into d;
  insert into public.topics (subject_id, ad, sira, question_avg) values
    (d, 'Ekosistem ve Biyoçeşitlilik', 1, 1),
    (d, 'Nüfus Politikaları ve Şehirleşme', 2, 1),
    (d, 'Ekonomik Faaliyetler ve Doğal Kaynaklar', 3, 1),
    (d, 'Türkiye’nin Coğrafi Özellikleri', 4, 1),
    (d, 'Bölgeler ve Ülkeler', 5, 1),
    (d, 'Çevre ve Toplum', 6, 1);

end $$;

-- ---------- AYT · Sözel ----------
do $$
declare o uuid; d uuid;
begin
  select id into o from public.exam_sessions where kod = 'ayt-soz';
  if o is null then return; end if;
  if exists (select 1 from public.subjects where session_id = o) then return; end if;

  insert into public.subjects (session_id, ad, renk, soru_sayisi, sira)
  values (o, 'Türk Dili ve Edebiyatı', 'turkce', 24, 1) returning id into d;
  insert into public.topics (subject_id, ad, sira, question_avg) values
    (d, 'Şiir Bilgisi ve Söz Sanatları', 1, 3),
    (d, 'Anlatım Biçimleri ve Düşünceyi Geliştirme Yolları', 2, 2),
    (d, 'İslamiyet Öncesi Türk Edebiyatı ve Geçiş Dönemi', 3, 2),
    (d, 'Halk Edebiyatı', 4, 3),
    (d, 'Divan Edebiyatı', 5, 3),
    (d, 'Tanzimat Edebiyatı', 6, 2),
    (d, 'Servet-i Fünûn ve Fecr-i Âti', 7, 2),
    (d, 'Millî Edebiyat', 8, 2),
    (d, 'Cumhuriyet Dönemi Türk Edebiyatı', 9, 4),
    (d, 'Edebî Akımlar ve Dünya Edebiyatı', 10, 1);

  insert into public.subjects (session_id, ad, renk, soru_sayisi, sira)
  values (o, 'Tarih-1', 'sosyal', 10, 2) returning id into d;
  insert into public.topics (subject_id, ad, sira, question_avg) values
    (d, 'Tarih Bilimi', 1, 1),
    (d, 'İlk ve Orta Çağlarda Dünya', 2, 1),
    (d, 'İlk Türk Devletleri', 3, 2),
    (d, 'İslam Tarihi ve Türklerin İslamiyet’i Kabulü', 4, 2),
    (d, 'Türkiye Tarihi: Selçuklu ve Beylikler', 5, 2),
    (d, 'Beylikten Devlete Osmanlı', 6, 1),
    (d, 'Dünya Gücü Osmanlı Devleti', 7, 1);

  insert into public.subjects (session_id, ad, renk, soru_sayisi, sira)
  values (o, 'Coğrafya-1', 'sosyal', 6, 3) returning id into d;
  insert into public.topics (subject_id, ad, sira, question_avg) values
    (d, 'Ekosistem ve Biyoçeşitlilik', 1, 1),
    (d, 'Nüfus Politikaları ve Şehirleşme', 2, 1),
    (d, 'Ekonomik Faaliyetler ve Doğal Kaynaklar', 3, 1),
    (d, 'Türkiye’nin Coğrafi Özellikleri', 4, 1),
    (d, 'Bölgeler ve Ülkeler', 5, 1),
    (d, 'Çevre ve Toplum', 6, 1);

  insert into public.subjects (session_id, ad, renk, soru_sayisi, sira)
  values (o, 'Tarih-2', 'sosyal', 11, 4) returning id into d;
  insert into public.topics (subject_id, ad, sira, question_avg) values
    (d, 'Değişen Dünya Dengeleri Karşısında Osmanlı', 1, 2),
    (d, 'Devrimler Çağında Değişen Devlet-Toplum İlişkileri', 2, 2),
    (d, 'Sermaye, Emek ve Sanayi İnkılabı', 3, 1),
    (d, 'XX. Yüzyıl Başlarında Osmanlı ve I. Dünya Savaşı', 4, 2),
    (d, 'Millî Mücadele', 5, 2),
    (d, 'Atatürkçülük ve Türk İnkılabı', 6, 2);

  insert into public.subjects (session_id, ad, renk, soru_sayisi, sira)
  values (o, 'Coğrafya-2', 'sosyal', 11, 5) returning id into d;
  insert into public.topics (subject_id, ad, sira, question_avg) values
    (d, 'Doğal Sistemlerdeki Değişim', 1, 2),
    (d, 'Ekonomik Faaliyetlerin Sosyal ve Kültürel Etkileri', 2, 2),
    (d, 'Türkiye Ekonomisi ve Sektörler', 3, 2),
    (d, 'Türkiye’nin İşlevsel Bölgeleri ve Kalkınma Projeleri', 4, 2),
    (d, 'Küresel Ticaret ve Ulaşım Ağları', 5, 1),
    (d, 'Ülkeler Arası Etkileşim ve Jeopolitik Konum', 6, 1),
    (d, 'Çevre Sorunları ve Doğal Afetler', 7, 1);

  insert into public.subjects (session_id, ad, renk, soru_sayisi, sira)
  values (o, 'Felsefe Grubu', 'sosyal', 12, 6) returning id into d;
  insert into public.topics (subject_id, ad, sira, question_avg) values
    (d, 'Felsefenin Konusu ve Alanları', 1, 2),
    (d, 'Bilgi Felsefesi', 2, 1),
    (d, 'Varlık Felsefesi', 3, 1),
    (d, 'Ahlak ve Sanat Felsefesi', 4, 1),
    (d, 'Siyaset ve Din Felsefesi', 5, 1),
    (d, 'Psikolojiye Giriş ve Öğrenme', 6, 2),
    (d, 'Duyum, Algı ve Bellek', 7, 1),
    (d, 'Sosyolojiye Giriş ve Toplumsal Yapı', 8, 2),
    (d, 'Toplumsal Değişme ve Kurumlar', 9, 1);

  insert into public.subjects (session_id, ad, renk, soru_sayisi, sira)
  values (o, 'Din Kültürü ve Ahlak Bilgisi', 'sosyal', 6, 7) returning id into d;
  insert into public.topics (subject_id, ad, sira, question_avg) values
    (d, 'İnanç ve İbadet', 1, 1),
    (d, 'Kur’an’a Göre Hz. Muhammed', 2, 1),
    (d, 'Ahlak ve Değerler', 3, 1),
    (d, 'İslam Düşüncesinde Yorumlar ve Mezhepler', 4, 1),
    (d, 'İslam, Bilim ve Kültür', 5, 1),
    (d, 'Yaşayan Dinler', 6, 1);

end $$;

-- ---------- YDT · Yabancı Dil ----------
do $$
declare o uuid; d uuid;
begin
  select id into o from public.exam_sessions where kod = 'ydt';
  if o is null then return; end if;
  if exists (select 1 from public.subjects where session_id = o) then return; end if;

  insert into public.subjects (session_id, ad, renk, soru_sayisi, sira)
  values (o, 'Yabancı Dil (İngilizce)', 'dil', 80, 1) returning id into d;
  insert into public.topics (subject_id, ad, sira, question_avg) values
    (d, 'Kelime Bilgisi', 1, 8),
    (d, 'Dil Bilgisi', 2, 10),
    (d, 'Cloze Test', 3, 5),
    (d, 'Cümle Tamamlama', 4, 8),
    (d, 'İngilizce–Türkçe Çeviri', 5, 6),
    (d, 'Türkçe–İngilizce Çeviri', 6, 6),
    (d, 'Paragraf Soruları', 7, 15),
    (d, 'Diyalog Tamamlama', 8, 5),
    (d, 'Anlamca En Yakın Cümle', 9, 5),
    (d, 'Paragrafta Anlam Bütünlüğü', 10, 4),
    (d, 'Duruma Uygun Düşen Cümle', 11, 4),
    (d, 'Anlatım Bozukluğu', 12, 4);

end $$;

-- ---------- AYT Matematik: Sayısal'dan Eşit Ağırlık'a ----------
do $$
declare kaynak uuid; hedef uuid; yeni_d uuid;
begin
  select s.id into kaynak
  from public.subjects s join public.exam_sessions o on o.id = s.session_id
  where o.kod = 'ayt-say' and s.ad = 'Matematik';

  select id into hedef from public.exam_sessions where kod = 'ayt-ea';
  if kaynak is null or hedef is null then return; end if;
  if exists (select 1 from public.subjects where session_id = hedef and ad = 'Matematik') then return; end if;

  insert into public.subjects (session_id, ad, renk, soru_sayisi, sira)
  select hedef, 'Matematik', 'matematik', soru_sayisi, 4 from public.subjects where id = kaynak
  returning id into yeni_d;

  insert into public.topics (subject_id, ad, sira, question_avg, past_questions_url)
  select yeni_d, ad, sira, question_avg, past_questions_url
  from public.topics where subject_id = kaynak order by sira;
end $$;

-- AYT Sayısal'da Kimya 'sosyal', Biyoloji 'dil' renginde tohumlanmıştı; ikisi de
-- fen dersi, panelde yanlış renkte görünüyorlardı.
update public.subjects set renk = 'fen' where ad in ('Kimya', 'Biyoloji') and renk <> 'fen';
