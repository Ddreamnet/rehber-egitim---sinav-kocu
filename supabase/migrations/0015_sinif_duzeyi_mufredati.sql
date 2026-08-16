-- ============================================================
-- 0015 — Sınıf düzeyi müfredatı
--
-- Platform yalnız YKS ve LGS adaylarını tanıyordu; sınava hazırlanmayan bir
-- öğrenci (ör. 9. sınıf, hedefi "düzenli çalışmak") panelde kendi müfredatını
-- göremiyordu. `exams.tur = 'duzey'` ile sınava bağlı olmayan bir program
-- ekleniyor; her sınıf düzeyi bir exam_session.
--
-- 8 ve 12. sınıf düzey müfredatı LGS / TYT konularından kopyalanıyor: aynı
-- içeriği ikinci kez elle yazmak, iki listenin zamanla ayrışması demek.
-- ============================================================

alter table public.exams add column if not exists tur text not null default 'sinav';

do $$ begin
  alter table public.exams add constraint exams_tur_check check (tur in ('sinav', 'duzey'));
exception when duplicate_object then null; end $$;

comment on column public.exams.tur is
  'sinav = geri sayımı olan gerçek sınav; duzey = sınıf düzeyi müfredatı (geri sayım yok).';

-- Öğrencinin kendi cümlesiyle hedefi. Sınava bağlı olmayan öğrencide panelin
-- ve koçun tek yön göstericisi bu alan.
alter table public.profiles add column if not exists hedef text;

comment on column public.profiles.hedef is
  'Öğrencinin hedefi, serbest metin. Ör. "haftada 5 gün düzenli çalışmak".';

insert into public.exams (kod, ad, yil, tarih, tur)
values ('okul', 'Okul Müfredatı', 0, 'infinity', 'duzey')
on conflict (kod) do update set ad = excluded.ad, tur = excluded.tur;

insert into public.exam_sessions (exam_id, kod, ad, sira)
select e.id, 'sinif-' || g, g || '. sınıf', g
from public.exams e, generate_series(5, 12) g
where e.kod = 'okul'
on conflict (exam_id, kod) do update set ad = excluded.ad, sira = excluded.sira;

-- ---------- 8 ve 12: hazır listelerden kopya ----------
create or replace function public.mufredat_kopyala(kaynak_kod text, hedef_kod text)
returns void language plpgsql as $$
declare kaynak uuid; hedef uuid; d record; yeni_d uuid;
begin
  select id into kaynak from public.exam_sessions where kod = kaynak_kod;
  select id into hedef  from public.exam_sessions where kod = hedef_kod;
  if kaynak is null or hedef is null then return; end if;
  -- Yeniden çalışırsa konular ikiye katlanmasın
  if exists (select 1 from public.subjects where session_id = hedef) then return; end if;

  for d in select * from public.subjects where session_id = kaynak order by sira loop
    insert into public.subjects (session_id, ad, renk, soru_sayisi, sira)
    values (hedef, d.ad, d.renk, 0, d.sira)
    returning id into yeni_d;

    insert into public.topics (subject_id, ad, sira, question_avg)
    select yeni_d, t.ad, t.sira, 0 from public.topics t where t.subject_id = d.id order by t.sira;
  end loop;
end $$;

select public.mufredat_kopyala('lgs', 'sinif-8');
select public.mufredat_kopyala('tyt', 'sinif-12');
drop function if exists public.mufredat_kopyala(text, text);

-- ---------- 5. sınıf ----------
do $$
declare o uuid; d uuid;
begin
  select id into o from public.exam_sessions where kod = 'sinif-5';
  if o is null then return; end if;
  if exists (select 1 from public.subjects where session_id = o) then return; end if;

  insert into public.subjects (session_id, ad, renk, soru_sayisi, sira)
  values (o, 'Türkçe', 'turkce', 0, 1) returning id into d;
  insert into public.topics (subject_id, ad, sira, question_avg) values
    (d, 'Sözcükte Anlam', 1, 0),
    (d, 'Cümlede Anlam', 2, 0),
    (d, 'Paragrafta Anlam', 3, 0),
    (d, 'Deyimler ve Atasözleri', 4, 0),
    (d, 'İsimler', 5, 0),
    (d, 'Sıfatlar', 6, 0),
    (d, 'Fiiller ve Kip', 7, 0),
    (d, 'Yazım Kuralları', 8, 0),
    (d, 'Noktalama İşaretleri', 9, 0),
    (d, 'Metin Türleri', 10, 0);

  insert into public.subjects (session_id, ad, renk, soru_sayisi, sira)
  values (o, 'Matematik', 'matematik', 0, 2) returning id into d;
  insert into public.topics (subject_id, ad, sira, question_avg) values
    (d, 'Doğal Sayılar ve İşlemler', 1, 0),
    (d, 'Kesirler', 2, 0),
    (d, 'Kesirlerle İşlemler', 3, 0),
    (d, 'Ondalık Gösterim', 4, 0),
    (d, 'Yüzdeler', 5, 0),
    (d, 'Temel Geometrik Kavramlar', 6, 0),
    (d, 'Üçgen ve Dörtgenler', 7, 0),
    (d, 'Uzunluk ve Zaman Ölçme', 8, 0),
    (d, 'Alan Ölçme', 9, 0),
    (d, 'Geometrik Cisimler', 10, 0),
    (d, 'Veri Toplama ve Değerlendirme', 11, 0);

  insert into public.subjects (session_id, ad, renk, soru_sayisi, sira)
  values (o, 'Fen Bilimleri', 'fen', 0, 3) returning id into d;
  insert into public.topics (subject_id, ad, sira, question_avg) values
    (d, 'Güneş, Dünya ve Ay', 1, 0),
    (d, 'Canlılar Dünyası', 2, 0),
    (d, 'Kuvvetin Ölçülmesi ve Sürtünme', 3, 0),
    (d, 'Madde ve Değişim', 4, 0),
    (d, 'Işığın Yayılması', 5, 0),
    (d, 'İnsan ve Çevre', 6, 0),
    (d, 'Elektrik Devre Elemanları', 7, 0);

  insert into public.subjects (session_id, ad, renk, soru_sayisi, sira)
  values (o, 'Sosyal Bilgiler', 'sosyal', 0, 4) returning id into d;
  insert into public.topics (subject_id, ad, sira, question_avg) values
    (d, 'Birey ve Toplum', 1, 0),
    (d, 'Kültür ve Miras', 2, 0),
    (d, 'İnsanlar, Yerler ve Çevreler', 3, 0),
    (d, 'Bilim, Teknoloji ve Toplum', 4, 0),
    (d, 'Üretim, Dağıtım ve Tüketim', 5, 0),
    (d, 'Etkin Vatandaşlık', 6, 0),
    (d, 'Küresel Bağlantılar', 7, 0);

  insert into public.subjects (session_id, ad, renk, soru_sayisi, sira)
  values (o, 'İngilizce', 'dil', 0, 5) returning id into d;
  insert into public.topics (subject_id, ad, sira, question_avg) values
    (d, 'Hello', 1, 0),
    (d, 'My Town', 2, 0),
    (d, 'Games and Hobbies', 3, 0),
    (d, 'My Daily Routine', 4, 0),
    (d, 'Health', 5, 0),
    (d, 'Movies', 6, 0),
    (d, 'Party', 7, 0),
    (d, 'Fitness', 8, 0),
    (d, 'The Animal Shelter', 9, 0),
    (d, 'Festivals', 10, 0);

  insert into public.subjects (session_id, ad, renk, soru_sayisi, sira)
  values (o, 'Din Kültürü ve Ahlak Bilgisi', 'sosyal', 0, 6) returning id into d;
  insert into public.topics (subject_id, ad, sira, question_avg) values
    (d, 'Allah İnancı', 1, 0),
    (d, 'Ramazan ve Oruç', 2, 0),
    (d, 'Adap ve Nezaket', 3, 0),
    (d, 'Hz. Muhammed ve Aile Hayatı', 4, 0),
    (d, 'Çevremizde Dinin İzleri', 5, 0);

end $$;

-- ---------- 6. sınıf ----------
do $$
declare o uuid; d uuid;
begin
  select id into o from public.exam_sessions where kod = 'sinif-6';
  if o is null then return; end if;
  if exists (select 1 from public.subjects where session_id = o) then return; end if;

  insert into public.subjects (session_id, ad, renk, soru_sayisi, sira)
  values (o, 'Türkçe', 'turkce', 0, 1) returning id into d;
  insert into public.topics (subject_id, ad, sira, question_avg) values
    (d, 'Sözcükte Anlam', 1, 0),
    (d, 'Cümlede Anlam', 2, 0),
    (d, 'Paragrafta Anlam', 3, 0),
    (d, 'Fiillerde Kip ve Kişi', 4, 0),
    (d, 'Fiilde Yapı', 5, 0),
    (d, 'Zarflar', 6, 0),
    (d, 'Söz Sanatları', 7, 0),
    (d, 'Yazım Kuralları', 8, 0),
    (d, 'Noktalama İşaretleri', 9, 0),
    (d, 'Metin Türleri', 10, 0);

  insert into public.subjects (session_id, ad, renk, soru_sayisi, sira)
  values (o, 'Matematik', 'matematik', 0, 2) returning id into d;
  insert into public.topics (subject_id, ad, sira, question_avg) values
    (d, 'Doğal Sayılarla İşlemler', 1, 0),
    (d, 'Çarpanlar ve Katlar', 2, 0),
    (d, 'Kümeler', 3, 0),
    (d, 'Tam Sayılar', 4, 0),
    (d, 'Kesirlerle İşlemler', 5, 0),
    (d, 'Oran', 6, 0),
    (d, 'Cebirsel İfadeler', 7, 0),
    (d, 'Açılar', 8, 0),
    (d, 'Alan Ölçme', 9, 0),
    (d, 'Çember ve Daire', 10, 0),
    (d, 'Veri Analizi', 11, 0);

  insert into public.subjects (session_id, ad, renk, soru_sayisi, sira)
  values (o, 'Fen Bilimleri', 'fen', 0, 3) returning id into d;
  insert into public.topics (subject_id, ad, sira, question_avg) values
    (d, 'Güneş Sistemi ve Tutulmalar', 1, 0),
    (d, 'Vücudumuzdaki Sistemler', 2, 0),
    (d, 'Kuvvet ve Hareket', 3, 0),
    (d, 'Madde ve Isı', 4, 0),
    (d, 'Ses ve Özellikleri', 5, 0),
    (d, 'Vücudumuzdaki Sistemler ve Sağlığımız', 6, 0),
    (d, 'Elektriğin İletimi', 7, 0);

  insert into public.subjects (session_id, ad, renk, soru_sayisi, sira)
  values (o, 'Sosyal Bilgiler', 'sosyal', 0, 4) returning id into d;
  insert into public.topics (subject_id, ad, sira, question_avg) values
    (d, 'Birey ve Toplum', 1, 0),
    (d, 'Kültür ve Miras', 2, 0),
    (d, 'İnsanlar, Yerler ve Çevreler', 3, 0),
    (d, 'Bilim, Teknoloji ve Toplum', 4, 0),
    (d, 'Üretim, Dağıtım ve Tüketim', 5, 0),
    (d, 'Etkin Vatandaşlık', 6, 0),
    (d, 'Küresel Bağlantılar', 7, 0);

  insert into public.subjects (session_id, ad, renk, soru_sayisi, sira)
  values (o, 'İngilizce', 'dil', 0, 5) returning id into d;
  insert into public.topics (subject_id, ad, sira, question_avg) values
    (d, 'Life', 1, 0),
    (d, 'Yummy Breakfast', 2, 0),
    (d, 'Downtown', 3, 0),
    (d, 'Weather and Emotions', 4, 0),
    (d, 'At the Fair', 5, 0),
    (d, 'Occupations', 6, 0),
    (d, 'Holidays', 7, 0),
    (d, 'Bookworms', 8, 0),
    (d, 'Saving the Planet', 9, 0),
    (d, 'Democracy', 10, 0);

  insert into public.subjects (session_id, ad, renk, soru_sayisi, sira)
  values (o, 'Din Kültürü ve Ahlak Bilgisi', 'sosyal', 0, 6) returning id into d;
  insert into public.topics (subject_id, ad, sira, question_avg) values
    (d, 'Peygamber ve İlahi Kitap İnancı', 1, 0),
    (d, 'Namaz', 2, 0),
    (d, 'Zararlı Alışkanlıklar', 3, 0),
    (d, 'Hz. Muhammed’in Hayatı', 4, 0),
    (d, 'Temel Değerlerimiz', 5, 0);

end $$;

-- ---------- 7. sınıf ----------
do $$
declare o uuid; d uuid;
begin
  select id into o from public.exam_sessions where kod = 'sinif-7';
  if o is null then return; end if;
  if exists (select 1 from public.subjects where session_id = o) then return; end if;

  insert into public.subjects (session_id, ad, renk, soru_sayisi, sira)
  values (o, 'Türkçe', 'turkce', 0, 1) returning id into d;
  insert into public.topics (subject_id, ad, sira, question_avg) values
    (d, 'Sözcükte Anlam', 1, 0),
    (d, 'Cümlede Anlam', 2, 0),
    (d, 'Paragrafta Anlam', 3, 0),
    (d, 'Fiilimsiler', 4, 0),
    (d, 'Cümlenin Ögeleri', 5, 0),
    (d, 'Söz Sanatları', 6, 0),
    (d, 'Yazım Kuralları', 7, 0),
    (d, 'Noktalama İşaretleri', 8, 0),
    (d, 'Anlatım Bozuklukları', 9, 0),
    (d, 'Metin Türleri', 10, 0);

  insert into public.subjects (session_id, ad, renk, soru_sayisi, sira)
  values (o, 'Matematik', 'matematik', 0, 2) returning id into d;
  insert into public.topics (subject_id, ad, sira, question_avg) values
    (d, 'Tam Sayılarla İşlemler', 1, 0),
    (d, 'Rasyonel Sayılar', 2, 0),
    (d, 'Cebirsel İfadeler', 3, 0),
    (d, 'Eşitlik ve Denklem', 4, 0),
    (d, 'Oran ve Orantı', 5, 0),
    (d, 'Yüzdeler', 6, 0),
    (d, 'Doğrular ve Açılar', 7, 0),
    (d, 'Çokgenler', 8, 0),
    (d, 'Çember ve Daire', 9, 0),
    (d, 'Cisimlerin Yüzey Alanı', 10, 0),
    (d, 'Veri Analizi', 11, 0),
    (d, 'Bilinçli Tüketim Aritmetiği', 12, 0);

  insert into public.subjects (session_id, ad, renk, soru_sayisi, sira)
  values (o, 'Fen Bilimleri', 'fen', 0, 3) returning id into d;
  insert into public.topics (subject_id, ad, sira, question_avg) values
    (d, 'Güneş Sistemi ve Ötesi', 1, 0),
    (d, 'Hücre ve Bölünmeler', 2, 0),
    (d, 'Kuvvet ve Enerji', 3, 0),
    (d, 'Saf Madde ve Karışımlar', 4, 0),
    (d, 'Işığın Madde ile Etkileşimi', 5, 0),
    (d, 'Canlılarda Üreme, Büyüme ve Gelişme', 6, 0),
    (d, 'Elektrik Devreleri', 7, 0);

  insert into public.subjects (session_id, ad, renk, soru_sayisi, sira)
  values (o, 'Sosyal Bilgiler', 'sosyal', 0, 4) returning id into d;
  insert into public.topics (subject_id, ad, sira, question_avg) values
    (d, 'İletişim ve İnsan İlişkileri', 1, 0),
    (d, 'Türk Tarihinde Yolculuk', 2, 0),
    (d, 'Ülkemizde Nüfus', 3, 0),
    (d, 'Bilim, Teknoloji ve Toplum', 4, 0),
    (d, 'Ekonomi ve Sosyal Hayat', 5, 0),
    (d, 'Yaşayan Demokrasi', 6, 0),
    (d, 'Ülkeler Arası Köprüler', 7, 0);

  insert into public.subjects (session_id, ad, renk, soru_sayisi, sira)
  values (o, 'İngilizce', 'dil', 0, 5) returning id into d;
  insert into public.topics (subject_id, ad, sira, question_avg) values
    (d, 'Appearance and Personality', 1, 0),
    (d, 'Sports', 2, 0),
    (d, 'Biographies', 3, 0),
    (d, 'Wild Animals', 4, 0),
    (d, 'Television', 5, 0),
    (d, 'Celebrations', 6, 0),
    (d, 'Dreams', 7, 0),
    (d, 'Public Buildings', 8, 0),
    (d, 'Environment', 9, 0),
    (d, 'Planets', 10, 0);

  insert into public.subjects (session_id, ad, renk, soru_sayisi, sira)
  values (o, 'Din Kültürü ve Ahlak Bilgisi', 'sosyal', 0, 6) returning id into d;
  insert into public.topics (subject_id, ad, sira, question_avg) values
    (d, 'Melek ve Ahiret İnancı', 1, 0),
    (d, 'Hac ve Kurban', 2, 0),
    (d, 'Ahlaki Davranışlar', 3, 0),
    (d, 'Allah’ın Kulu ve Elçisi Hz. Muhammed', 4, 0),
    (d, 'İslam Düşüncesinde Yorumlar', 5, 0);

end $$;

-- ---------- 9. sınıf ----------
do $$
declare o uuid; d uuid;
begin
  select id into o from public.exam_sessions where kod = 'sinif-9';
  if o is null then return; end if;
  if exists (select 1 from public.subjects where session_id = o) then return; end if;

  insert into public.subjects (session_id, ad, renk, soru_sayisi, sira)
  values (o, 'Türk Dili ve Edebiyatı', 'turkce', 0, 1) returning id into d;
  insert into public.topics (subject_id, ad, sira, question_avg) values
    (d, 'Edebiyat ve Bilimlerle İlişkisi', 1, 0),
    (d, 'Hikâye', 2, 0),
    (d, 'Şiir', 3, 0),
    (d, 'Masal ve Fabl', 4, 0),
    (d, 'Roman', 5, 0),
    (d, 'Tiyatro', 6, 0),
    (d, 'Biyografi ve Otobiyografi', 7, 0),
    (d, 'Mektup ve E-posta', 8, 0),
    (d, 'Günlük ve Blog', 9, 0),
    (d, 'Yazım ve Noktalama', 10, 0);

  insert into public.subjects (session_id, ad, renk, soru_sayisi, sira)
  values (o, 'Matematik', 'matematik', 0, 2) returning id into d;
  insert into public.topics (subject_id, ad, sira, question_avg) values
    (d, 'Mantık', 1, 0),
    (d, 'Kümeler', 2, 0),
    (d, 'Denklem ve Eşitsizlikler', 3, 0),
    (d, 'Mutlak Değer', 4, 0),
    (d, 'Üslü ve Köklü İfadeler', 5, 0),
    (d, 'Oran-Orantı ve Problemler', 6, 0),
    (d, 'Üçgenler', 7, 0),
    (d, 'Veri, Sayma ve Olasılık', 8, 0),
    (d, 'Fonksiyonlara Giriş', 9, 0);

  insert into public.subjects (session_id, ad, renk, soru_sayisi, sira)
  values (o, 'Fizik', 'fen', 0, 3) returning id into d;
  insert into public.topics (subject_id, ad, sira, question_avg) values
    (d, 'Fizik Bilimine Giriş', 1, 0),
    (d, 'Madde ve Özellikleri', 2, 0),
    (d, 'Hareket ve Kuvvet', 3, 0),
    (d, 'Enerji', 4, 0),
    (d, 'Isı ve Sıcaklık', 5, 0),
    (d, 'Elektrostatik', 6, 0);

  insert into public.subjects (session_id, ad, renk, soru_sayisi, sira)
  values (o, 'Kimya', 'fen', 0, 4) returning id into d;
  insert into public.topics (subject_id, ad, sira, question_avg) values
    (d, 'Kimya Bilimi', 1, 0),
    (d, 'Atom ve Periyodik Sistem', 2, 0),
    (d, 'Kimyasal Türler Arası Etkileşimler', 3, 0),
    (d, 'Maddenin Hâlleri', 4, 0),
    (d, 'Doğa ve Kimya', 5, 0);

  insert into public.subjects (session_id, ad, renk, soru_sayisi, sira)
  values (o, 'Biyoloji', 'fen', 0, 5) returning id into d;
  insert into public.topics (subject_id, ad, sira, question_avg) values
    (d, 'Yaşam Bilimi Biyoloji', 1, 0),
    (d, 'Hücre', 2, 0),
    (d, 'Canlılar Dünyası', 3, 0),
    (d, 'Canlıların Sınıflandırılması', 4, 0),
    (d, 'Hücre Bölünmelerine Giriş', 5, 0);

  insert into public.subjects (session_id, ad, renk, soru_sayisi, sira)
  values (o, 'Tarih', 'sosyal', 0, 6) returning id into d;
  insert into public.topics (subject_id, ad, sira, question_avg) values
    (d, 'Tarih ve Zaman', 1, 0),
    (d, 'İnsanlığın İlk Dönemleri', 2, 0),
    (d, 'Orta Çağ’da Dünya', 3, 0),
    (d, 'İlk ve Orta Çağlarda Türk Dünyası', 4, 0),
    (d, 'İslam Medeniyetinin Doğuşu', 5, 0),
    (d, 'Türklerin İslamiyet’i Kabulü', 6, 0);

  insert into public.subjects (session_id, ad, renk, soru_sayisi, sira)
  values (o, 'Coğrafya', 'sosyal', 0, 7) returning id into d;
  insert into public.topics (subject_id, ad, sira, question_avg) values
    (d, 'Doğa ve İnsan', 1, 0),
    (d, 'Dünya’nın Şekli ve Hareketleri', 2, 0),
    (d, 'Coğrafi Konum', 3, 0),
    (d, 'Harita Bilgisi', 4, 0),
    (d, 'Atmosfer ve Sıcaklık', 5, 0),
    (d, 'Basınç ve Rüzgârlar', 6, 0),
    (d, 'Nem ve Yağış', 7, 0),
    (d, 'Yer Şekilleri', 8, 0),
    (d, 'Beşerî Yapı', 9, 0);

  insert into public.subjects (session_id, ad, renk, soru_sayisi, sira)
  values (o, 'İngilizce', 'dil', 0, 8) returning id into d;
  insert into public.topics (subject_id, ad, sira, question_avg) values
    (d, 'Studying Abroad', 1, 0),
    (d, 'My Environment', 2, 0),
    (d, 'Movies', 3, 0),
    (d, 'Human in Nature', 4, 0),
    (d, 'Inspirational People', 5, 0),
    (d, 'Bridging Cultures', 6, 0),
    (d, 'World Heritage', 7, 0),
    (d, 'Emergency and Health', 8, 0);

end $$;

-- ---------- 10. sınıf ----------
do $$
declare o uuid; d uuid;
begin
  select id into o from public.exam_sessions where kod = 'sinif-10';
  if o is null then return; end if;
  if exists (select 1 from public.subjects where session_id = o) then return; end if;

  insert into public.subjects (session_id, ad, renk, soru_sayisi, sira)
  values (o, 'Türk Dili ve Edebiyatı', 'turkce', 0, 1) returning id into d;
  insert into public.topics (subject_id, ad, sira, question_avg) values
    (d, 'Giriş', 1, 0),
    (d, 'Hikâye', 2, 0),
    (d, 'Şiir', 3, 0),
    (d, 'Destan ve Efsane', 4, 0),
    (d, 'Roman', 5, 0),
    (d, 'Tiyatro', 6, 0),
    (d, 'Anı (Hatıra)', 7, 0),
    (d, 'Haber Metni', 8, 0),
    (d, 'Gezi Yazısı', 9, 0),
    (d, 'Yazım ve Noktalama', 10, 0);

  insert into public.subjects (session_id, ad, renk, soru_sayisi, sira)
  values (o, 'Matematik', 'matematik', 0, 2) returning id into d;
  insert into public.topics (subject_id, ad, sira, question_avg) values
    (d, 'Sayma ve Olasılık', 1, 0),
    (d, 'Fonksiyonlar', 2, 0),
    (d, 'Polinomlar', 3, 0),
    (d, 'İkinci Dereceden Denklemler', 4, 0),
    (d, 'Dörtgenler ve Çokgenler', 5, 0),
    (d, 'Katı Cisimler', 6, 0),
    (d, 'Analitik Geometri: Doğru', 7, 0);

  insert into public.subjects (session_id, ad, renk, soru_sayisi, sira)
  values (o, 'Fizik', 'fen', 0, 3) returning id into d;
  insert into public.topics (subject_id, ad, sira, question_avg) values
    (d, 'Elektrik ve Manyetizma', 1, 0),
    (d, 'Basınç ve Kaldırma Kuvveti', 2, 0),
    (d, 'Dalgalar', 3, 0),
    (d, 'Optik', 4, 0);

  insert into public.subjects (session_id, ad, renk, soru_sayisi, sira)
  values (o, 'Kimya', 'fen', 0, 4) returning id into d;
  insert into public.topics (subject_id, ad, sira, question_avg) values
    (d, 'Kimyanın Temel Kanunları', 1, 0),
    (d, 'Karışımlar', 2, 0),
    (d, 'Asitler, Bazlar ve Tuzlar', 3, 0),
    (d, 'Kimya Her Yerde', 4, 0);

  insert into public.subjects (session_id, ad, renk, soru_sayisi, sira)
  values (o, 'Biyoloji', 'fen', 0, 5) returning id into d;
  insert into public.topics (subject_id, ad, sira, question_avg) values
    (d, 'Hücre Bölünmeleri', 1, 0),
    (d, 'Kalıtımın Genel İlkeleri', 2, 0),
    (d, 'Ekosistem Ekolojisi', 3, 0),
    (d, 'Güncel Çevre Sorunları', 4, 0);

  insert into public.subjects (session_id, ad, renk, soru_sayisi, sira)
  values (o, 'Tarih', 'sosyal', 0, 6) returning id into d;
  insert into public.topics (subject_id, ad, sira, question_avg) values
    (d, 'Selçuklu Türkiyesi', 1, 0),
    (d, 'Beylikten Devlete Osmanlı Siyaseti', 2, 0),
    (d, 'Devletleşme Sürecinde Savaşçılar ve Askerler', 3, 0),
    (d, 'Beylikten Devlete Osmanlı Medeniyeti', 4, 0),
    (d, 'Dünya Gücü Osmanlı', 5, 0),
    (d, 'Sultan ve Osmanlı Merkez Teşkilatı', 6, 0),
    (d, 'Klasik Çağda Osmanlı Toplum Düzeni', 7, 0);

  insert into public.subjects (session_id, ad, renk, soru_sayisi, sira)
  values (o, 'Coğrafya', 'sosyal', 0, 7) returning id into d;
  insert into public.topics (subject_id, ad, sira, question_avg) values
    (d, 'Dünyanın Tektonik Oluşumu', 1, 0),
    (d, 'İç ve Dış Kuvvetler', 2, 0),
    (d, 'Türkiye’nin Yer Şekilleri', 3, 0),
    (d, 'Su Kaynakları', 4, 0),
    (d, 'Toprak ve Bitki Örtüsü', 5, 0),
    (d, 'Nüfus Politikaları', 6, 0),
    (d, 'Göçler', 7, 0),
    (d, 'Ekonomik Faaliyetler', 8, 0),
    (d, 'Doğal Afetler', 9, 0);

  insert into public.subjects (session_id, ad, renk, soru_sayisi, sira)
  values (o, 'İngilizce', 'dil', 0, 8) returning id into d;
  insert into public.topics (subject_id, ad, sira, question_avg) values
    (d, 'School Life', 1, 0),
    (d, 'Plans', 2, 0),
    (d, 'Legendary Figures', 3, 0),
    (d, 'Traditions', 4, 0),
    (d, 'Travel', 5, 0),
    (d, 'Helpful Tips', 6, 0),
    (d, 'Food and Festivals', 7, 0),
    (d, 'Digital Era', 8, 0);

end $$;

-- ---------- 11. sınıf ----------
do $$
declare o uuid; d uuid;
begin
  select id into o from public.exam_sessions where kod = 'sinif-11';
  if o is null then return; end if;
  if exists (select 1 from public.subjects where session_id = o) then return; end if;

  insert into public.subjects (session_id, ad, renk, soru_sayisi, sira)
  values (o, 'Türk Dili ve Edebiyatı', 'turkce', 0, 1) returning id into d;
  insert into public.topics (subject_id, ad, sira, question_avg) values
    (d, 'Giriş', 1, 0),
    (d, 'Hikâye', 2, 0),
    (d, 'Şiir', 3, 0),
    (d, 'Makale', 4, 0),
    (d, 'Sohbet ve Fıkra', 5, 0),
    (d, 'Roman', 6, 0),
    (d, 'Tiyatro', 7, 0),
    (d, 'Eleştiri', 8, 0),
    (d, 'Mülakat ve Röportaj', 9, 0),
    (d, 'Yazım ve Noktalama', 10, 0);

  insert into public.subjects (session_id, ad, renk, soru_sayisi, sira)
  values (o, 'Matematik', 'matematik', 0, 2) returning id into d;
  insert into public.topics (subject_id, ad, sira, question_avg) values
    (d, 'Trigonometri', 1, 0),
    (d, 'Analitik Geometri', 2, 0),
    (d, 'Fonksiyonlarda Uygulamalar', 3, 0),
    (d, 'Denklem ve Eşitsizlik Sistemleri', 4, 0),
    (d, 'Çember ve Daire', 5, 0),
    (d, 'Uzay Geometri', 6, 0),
    (d, 'Olasılık', 7, 0);

  insert into public.subjects (session_id, ad, renk, soru_sayisi, sira)
  values (o, 'Fizik', 'fen', 0, 3) returning id into d;
  insert into public.topics (subject_id, ad, sira, question_avg) values
    (d, 'Vektörler ve Kuvvet', 1, 0),
    (d, 'Tork ve Denge', 2, 0),
    (d, 'Basit Makineler', 3, 0),
    (d, 'Elektrik Alan ve Potansiyel', 4, 0),
    (d, 'Manyetizma ve Elektromanyetik İndüksiyon', 5, 0),
    (d, 'Alternatif Akım', 6, 0);

  insert into public.subjects (session_id, ad, renk, soru_sayisi, sira)
  values (o, 'Kimya', 'fen', 0, 4) returning id into d;
  insert into public.topics (subject_id, ad, sira, question_avg) values
    (d, 'Modern Atom Teorisi', 1, 0),
    (d, 'Gazlar', 2, 0),
    (d, 'Sıvı Çözeltiler ve Çözünürlük', 3, 0),
    (d, 'Kimyasal Tepkimelerde Enerji', 4, 0),
    (d, 'Kimyasal Tepkimelerde Hız', 5, 0),
    (d, 'Kimyasal Tepkimelerde Denge', 6, 0);

  insert into public.subjects (session_id, ad, renk, soru_sayisi, sira)
  values (o, 'Biyoloji', 'fen', 0, 5) returning id into d;
  insert into public.topics (subject_id, ad, sira, question_avg) values
    (d, 'Sinir Sistemi', 1, 0),
    (d, 'Denetleyici ve Düzenleyici Sistemler', 2, 0),
    (d, 'Duyu Organları', 3, 0),
    (d, 'Destek ve Hareket Sistemi', 4, 0),
    (d, 'Sindirim Sistemi', 5, 0),
    (d, 'Dolaşım ve Bağışıklık Sistemi', 6, 0),
    (d, 'Solunum Sistemi', 7, 0),
    (d, 'Üriner Sistem', 8, 0),
    (d, 'Üreme Sistemi ve Embriyonik Gelişim', 9, 0),
    (d, 'Komünite ve Popülasyon Ekolojisi', 10, 0);

  insert into public.subjects (session_id, ad, renk, soru_sayisi, sira)
  values (o, 'Tarih', 'sosyal', 0, 6) returning id into d;
  insert into public.topics (subject_id, ad, sira, question_avg) values
    (d, 'Değişen Dünya Dengeleri Karşısında Osmanlı', 1, 0),
    (d, 'Değişim Çağında Avrupa ve Osmanlı', 2, 0),
    (d, 'Uluslararası İlişkilerde Denge Stratejisi', 3, 0),
    (d, 'Devrimler Çağında Osmanlı', 4, 0),
    (d, 'Sermaye ve Emek', 5, 0),
    (d, 'Değişen Gündelik Hayat', 6, 0);

  insert into public.subjects (session_id, ad, renk, soru_sayisi, sira)
  values (o, 'Coğrafya', 'sosyal', 0, 7) returning id into d;
  insert into public.topics (subject_id, ad, sira, question_avg) values
    (d, 'Biyoçeşitlilik', 1, 0),
    (d, 'Ekosistemler ve Madde Döngüsü', 2, 0),
    (d, 'Nüfus Politikaları', 3, 0),
    (d, 'Şehirler ve Etki Alanları', 4, 0),
    (d, 'Üretim, Dağıtım ve Tüketim', 5, 0),
    (d, 'Türkiye’de Ulaşım', 6, 0),
    (d, 'Türkiye’nin Jeopolitik Konumu', 7, 0),
    (d, 'Doğal Kaynaklar ve Çevre', 8, 0);

  insert into public.subjects (session_id, ad, renk, soru_sayisi, sira)
  values (o, 'İngilizce', 'dil', 0, 8) returning id into d;
  insert into public.topics (subject_id, ad, sira, question_avg) values
    (d, 'Future Jobs', 1, 0),
    (d, 'Hobbies and Skills', 2, 0),
    (d, 'Hard Times', 3, 0),
    (d, 'What a Life', 4, 0),
    (d, 'Back to the Past', 5, 0),
    (d, 'Open Your Heart', 6, 0),
    (d, 'Facts About Turkey', 7, 0),
    (d, 'Sports', 8, 0);

end $$;

