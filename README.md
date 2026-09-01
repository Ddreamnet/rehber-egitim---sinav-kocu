# Rehber Eğitim & Sınav Koçu

`design_handoff_pusula/` paketindeki hifi tasarımın üretim uygulaması.
Alan adı: **rehbersinavkocu.com** · Instagram: **@rehbersinavkocu**
**React (Vite) + TypeScript + Capacitor + Supabase**, tamamı Türkçe, mobile-first.

---

## Hızlı başlangıç

```bash
npm install
npm run dev          # http://localhost:5173
```

`.env` **dolu ve canlı Supabase projesine bağlı** (`ycrcdfvkgttpgrhpsvks`);
uygulama gerçek veritabanıyla çalışır. `.env` git'e girmez.

> `.env` yalnızca **publishable (anon)** anahtarı içerir. `VITE_` ile başlayan
> her değişken tarayıcı paketine gömülür — **secret/service_role anahtarı asla
> buraya konmaz**, yalnızca sunucu tarafında (Edge Function, script) kullanılır.

`.env` silinir/boş bırakılırsa uygulama **demo moda** düşer: tüm ekranlar ve
etkileşimler tasarımdaki veriyle çalışır, `/giris`'ten rol seçip panelleri
gezebilirsin. Ekran kodu iki modda da aynıdır (`src/data/repo.ts`).

## Komutlar

| Komut | Ne yapar |
|---|---|
| `npm run dev` | Geliştirme sunucusu |
| `npm run build` | `tsc -b` + üretim derlemesi (`dist/`) |
| `npm run preview` | Derlenmiş çıktıyı servis eder |
| `npm run cap:sync` | Derleyip Capacitor platformlarına kopyalar |

Mobil platformlar henüz eklenmedi (Xcode/Android SDK gerekir):

```bash
npx cap add ios
npx cap add android
npm run cap:sync
```

---

## Mimari

```
src/
├─ styles/tokens.css      ← TEK DOĞRU KAYNAK (handoff'tan birebir kopya)
├─ styles/app.css         ← yalnız token'lardan türeyen ek sınıflar
├─ config/site.ts         ← marka, sınav tarihleri, ders renkleri, paketler/fiyatlar
├─ content/blog/*.md      ← blog yazılarının kaynağı (demo + seed aynı dosyadan)
├─ lib/                   ← geriSayim, netDenge, format (tr-TR), renk, markdown
├─ data/
│  ├─ tipler.ts           ← alan tipleri (şemayla birebir)
│  ├─ demo.ts             ← tasarımdaki veri kümesi
│  └─ repo.ts             ← veri erişimi: Supabase varsa gerçek, yoksa demo
├─ auth/Oturum.tsx        ← oturum + rol
├─ components/            ← ui/ (bileşen kütüphanesi), layout/, grafik/ (Chart.js)
└─ pages/                 ← landing, blog, panel/, veli/, koc/, admin/
supabase/migrations/      ← şema, RLS, seed ve düzeltmeler (0001 → 0006)
supabase/functions/       ← ogrenci-ekle (admin öğrenci kaydı)
```

### Token disiplini

Üç katman korunur: **primitive → semantic → component**. Bileşenlerde hex
yazılmaz; renk/gölge/radius yalnızca `tokens.css` değişkenlerinden gelir.

**Tek tema.** Koyu mod kaldırıldı; site her yerde tasarım dosyasındaki açık
paletle çalışır. Izgara çizgileri tasarımdakinden daha soluktur
(`--color-grid` .24 → .13).

Chart.js canvas'ı CSS değişkeni okuyamadığı için `lib/renk.ts → tokenRengi()`
token'ın hesaplanmış değerini çözer.

**Butonlar** 3B "basılabilir" kapaktır: katı bir alt kenar (`--btn-kenar`)
butonu yükseltir, hover'da 2px kalkar, tıklanınca kenarın tamamı kadar inip
kenarı yutar. Derinlik `--btn-derinlik` ile boyuta göre değişir (sm 3 / md 4 /
lg 5 px). Ghost varyantı sessiz kalır.

**Tipografi** üç fonttan oluşur: başlık Poppins, gövde Inter, vurgu için
el yazısı **Patrick Hand** (`--font-el`, `.el-yazi` sınıfı). El yazısı yalnızca
büyük puntolu birkaç yerde kullanılır — küçük metinde okunaklılığı düşürür.

**Header** sabittir (`position: fixed`) ve tamamen şeffaftır; sayfaların ilk
bölümü bunu karşılayacak üst boşlukla başlar.

### Net Denge

Hesap tamamen **gerçek sınav verisine** dayanır. Zincir:

```
hedef sıralama → gereken yerleştirme puanı → gereken sınav puanı → derslere net
dersler değişince → sınav puanı → (+ OBP) → yerleştirme puanı → tahmini sıralama
```

| Adım | Kaynak |
|---|---|
| net → puan | O yılın net katsayıları. Puan netlere göre doğrusaldır: `puan = taban + Σ (net × katsayı)` |
| puan → sıralama | ÖSYM/MEB'in yayımladığı **yığınsal dağılım**. "X puan ve üstü: N aday" satırındaki N, o puanın başarı sırasıdır — tahmin değil, sayım |
| OBP | Yerleştirme puanı = sınav puanı + `OBP × 0,12`; OBP = diploma notu × 5 |

Veri iki yerde durur ve ikisi de aynı kaynaktan gelir:
`supabase/migrations/0020_gercek_puan_verisi.sql` (admin güncelleyebilsin diye) ve
`src/data/puanVerisi.ts` (Supabase yokken ve DB'de o yılın satırı yoksa yedek).
Yeni yılın verisi geldiğinde `PUAN_VERISI_YILI` ile birlikte ikisi güncellenir.

**Kaynaklar** — ikisi de indirilip okundu:
- ÖSYM, *2026-YKS Sayısal Bilgiler* — s.11 sınav puanı, s.12 yerleştirme puanı
  yığınsal dağılımları (TYT/SAY/SÖZ/EA/DİL).
  <https://cdn.osym.gov.tr/pdfdokuman/2026/YKS/SB/sayisal_ykdd21072026.pdf>
- MEB ÖDSGM, *2026 LGS Kapsamında Merkezî Sınav Raporu* — Tablo 7 ağırlık
  katsayıları, Tablo 8 test istatistikleri; *2026 LGS Yerleştirme Raporu* — ilk
  %5'lik dilim 43.850 öğrenci.
  <https://odsgm.meb.gov.tr/www/2026-lgs-kapsaminda-merkezi-sinav-raporu/icerik/1695/tr>

**Doğrulama.** Her puan türünde tüm netler tam iken sonuç 500'e oturuyor
(TYT 503,5 · SAY 502,3 · EA 513,6 · SÖZ 498,4 · DİL 501,2 · LGS 499,9; tavan
500'e kırpılır). LGS'de tüm netler 0 iken 199,9 çıkıyor — bilinen "0 net ≈ 200
puan" ile örtüşüyor. Gidiş-dönüş sınaması: hedef ilk 100.000 → 360,5 puan →
derslere dağıtım → geri hesapta ~100.064. sıra.

**Düzeltilen üç hata** (öncesi `net_siralama_tablosu`):
1. Tablodaki değerler uydurmaydı — 0003 ve 0010'un kendi yorumları da "gerçek
   yerleştirme verisiyle değiştirilecek" diyordu.
2. Tek bir `yks` eğrisi tüm alanlara uygulanıyordu; 90 net Sayısal ile 90 net
   Sözel aynı sıralamayı veriyordu. Gerçekte 2026'da 440 puan Sayısal'da
   22.370. sıra, Sözel'de 214. sıra.
3. Sıralama çapalar arasında **doğrusal** ara değerle bulunuyordu; sıralama
   puana göre üstel değişir. Ara değer artık logaritmik (95 nette doğrusal
   33.500, logaritmik 27.900 diyordu — %20 sapma).

Ayrıca hedef artık tek sınav oturumuna değil **puan türüne** bağlı: sıralama TYT
ile AYT'nin birlikte hesabından çıktığı için ikisi tek hedefte durur
(`net_targets.puan_turu`). Sınava hazırlanmayan öğrencide (ara sınıf) sıralama
tahmini gösterilmez.

Bir dersi azaltınca fark kilitsiz derslere dağıtılır ve **puan** sabit kalır —
eskiden net toplamı sabit tutuluyordu, katsayılar farklı olduğu için bu puanı
korumuyordu. Sonuç her yerde **"tahmini"** etiketiyle ve kaynak satırıyla
gösterilir.

---

## Rota haritası

| Rota | Ekran | Erişim |
|---|---|---|
| `/` | Landing (çift canlı geri sayım, tek CTA) | herkes |
| `/nasil-calisir` | 3 adım, paketler, SSS | herkes |
| `/blog`, `/blog/:slug` | Blog indeks + yazı (CMS) | herkes |
| `/basvuru` | Başvuru formu | herkes |
| `/giris` | Supabase auth — **kayıt formu yok**, hesapları admin açar | herkes |
| `/admin/basvurular` | Gelen başvurular, durum takibi | admin |
| `/styleguide` | Token ve bileşen kütüphanesi | yalnız `npm run dev` |
| `/panel`, `/panel/mufredat`, `/panel/ilerleme`, `/panel/net-denge`, `/panel/gorusmeler` | Öğrenci paneli | öğrenci |
| `/veli`, `/veli/gorusmeler` | Veli paneli (salt-okunur) | veli |
| `/koc`, `/koc/ogrenci/:id`, `/koc/takvim`, `/koc/gorusmeler`, `/koc/odemeler` | Koç paneli | koç |
| `/admin`, `/admin/koclar`, `/admin/koc/:id`, `/admin/ogrenciler`, `/admin/ogrenci-ekle`, `/admin/ogrenci/:id`, `/admin/odemeler`, `/admin/raporlar` | Admin | admin |

Admin tüm panelleri görebilir; diğer roller kendi paneline yönlenir.

---

## Supabase

**Proje:** `ycrcdfvkgttpgrhpsvks` — migration'lar uygulandı ve doğrulandı.
Mevcut durum: 31 tablo, 69 policy (hepsinde RLS açık), 94 konu + 7 blog yazısı
seed'i yüklü, kullanıcı tablosu boş.

| Migration | İçerik |
|---|---|
| `0001_sema.sql` | Tablolar, enum'lar, indeksler |
| `0002_rls.sql` | Yardımcı fonksiyonlar, signup trigger'ı, politikalar, grant'ler |
| `0003_seed.sql` | Müfredat ağacı, sıralama tablosu, blog yazıları |
| `0004_fonksiyon_yetkileri.sql` | `has_rol`'ü API yüzeyinden çıkarır, kullanılmayan yardımcıları kaldırır |
| `0005_gorusme_yazma_kisiti.sql` | Koçun yalnız kendi öğrencisine görüşme/not yazabilmesi |
| `0006_blog_icerik.sql` | Blog yazı metinleri (src/content/blog'dan üretilir) + TYT Türkçe soru dağılımı |
| … | (0007–0018 ara migration'lar) |
| `0019_basvuru_alanlari.sql` | Başvuru formunun ad/soyad, sınıf, alan, program, paket sütunları |
| `0020_gercek_puan_verisi.sql` | Net Denge'nin gerçek verisi: puan modelleri, net katsayıları, ÖSYM/MEB yığınsal dağılımları, OBP |

> **Ders adları birebir eşleşmeli.** `puan_katsayilari.ders_ad` ile `subjects.ad`
> aynı değilse o ders puana **hiç girmez** ve hata da vermez. Canlıda tam olarak
> bu oldu: LGS dersi veritabanında `Din Kültürü`, katsayı satırı ise
> `Din Kültürü ve Ahlak Bilgisi` yazıyordu; LGS tavanı 500 yerine 480 çıkıyordu.
> Yeni yıl verisi yüklendikten sonra şu sorgu her puan türünde
> `eslesen_ders = tanimli_katsayi` vermeli:
>
> ```sql
> select m.puan_turu,
>        round(m.taban_puan + sum(k.katsayi * s.soru_sayisi), 1) as tavan,
>        count(*) as eslesen_ders,
>        (select count(*) from public.puan_katsayilari k2
>          where k2.yil = m.yil and k2.puan_turu = m.puan_turu) as tanimli_katsayi
> from public.puan_modeli m
> join public.puan_katsayilari k on k.yil = m.yil and k.puan_turu = m.puan_turu
> join public.exam_sessions es on es.kod = k.oturum_kod
> join public.subjects s on s.session_id = es.id and s.ad = k.ders_ad
> group by m.puan_turu, m.yil, m.taban_puan order by m.puan_turu;
> ```

Yeni bir ortama kurmak için:

```bash
supabase link --project-ref <ref>
supabase db push        # 0001 → 0020 sırayla
```

Ya da SQL editöründe `supabase/migrations/` dosyalarını sırayla çalıştır.

### RLS ilkeleri (`0002_rls.sql`)

- **Öğrenci** yalnız kendi verisi.
- **Veli** bağlı öğrenciyi **salt-okunur**; koç notu/raporu yalnız
  `shared_with_parent = true` ise; ders bazlı detay yalnız
  `parent_students.detay_seviyesi = 'tam'` ise.
- **Koç** yalnız kendi öğrencileri (yazma: plan, not, ilerleme, ödev).
- **Admin** tümü. **Blog** herkese açık okuma.

Politikalar `security definer` yardımcı fonksiyonlarla yazıldı
(`has_rol`, `kocu_muyum`, `velisi_miyim`, `veli_detay_tam`, `admin_mi`) — böylece
`profiles` üzerinde özyineleme oluşmuyor.

### Roller

Yetki **`user_roles`** tablosunda tutulur, `profiles` satırında değil (EWD
kalıbı). Sebebi: kullanıcı kendi profilini güncelleyebiliyor; rol profilde
olsaydı kendini admin yapabilirdi. Politikalar rolü `has_rol()` ile okur.

`auth.users`'a kayıt olan herkese trigger ile profil + `ogrenci` rolü açılır
(metadata ile istenebilecek rol `ogrenci`/`veli` ile sınırlıdır). Rol yükseltme
admin panelinden yapılır: **Admin → Koçlar → Koç ekle** (kişi önce
`/giris`'ten kayıt olur, sonra e-postasıyla rolü koça çevrilir).

**Öğrenci kaydı.** Sitede kayıt formu yoktur: ödemesini yapan öğrencileri
**Admin → Öğrenci ekle** sekmesinden sen açarsın. Form kullanıcı adı/şifre
üretir, istersen koç atar ve veli hesabını da aynı anda oluşturur. Kullanıcı
yaratmak service_role gerektirdiği için iş `supabase/functions/ogrenci-ekle`
Edge Function'ında yapılır; fonksiyon çağıranın admin olduğunu ayrıca doğrular.

**İlk admin** — veritabanında hiç kullanıcı yok. Kendi hesabın için:

1. Supabase panelinde **Authentication → Users → Add user** ile hesabını aç
   (e-posta + şifre, “Auto Confirm” işaretli).
2. SQL editöründe rolünü yükselt:

```sql
insert into public.user_roles (user_id, rol)
select id, 'admin' from public.profiles where eposta = 'sen@ornek.com'
on conflict (user_id, rol) do nothing;
```

3. `/giris`'ten gir → `/admin` açılır. Bundan sonra öğrenci ve koç eklemeyi
   panelden yaparsın.

### Doğrulama

Rol matrisi canlı projede gerçek oturumlarla sınandı (21/21 geçti): öğrenci
yalnız kendi verisini görüyor ve kendini admin yapamıyor; veli yalnız
`shared_with_parent = true` notu görüyor ve hiçbir yere yazamıyor; koç yalnız
kendi öğrencilerini görüyor ve yalnız onlara yazabiliyor; admin tümünü
görüyor; anonim kullanıcı yalnız yayındaki blog yazılarını okuyup başvuru
gönderebiliyor. Test kullanıcıları ve test satırları sonrasında silindi.

Bu sırada iki gerçek bulgu çıktı ve düzeltildi:

- **Koç, başka koçun öğrencisine görüşme notu yazabiliyordu** — politika
  yalnızca `coach_id = auth.uid()` kontrol ediyordu (`0005`).
- **Yardımcı fonksiyonlar RPC yüzeyindeydi**; `has_rol(user_id, rol)` ile
  rastgele bir kullanıcının rolü yoklanabiliyordu (`0004`).
  Not: EXECUTE hakkını tamamen geri almak RLS'i bozuyor — policy ifadeleri
  çağıranın yetkisiyle değerlendirilir. Bu yüzden yalnız `has_rol` yayınlanmayan
  `yetki` şemasına taşındı; kalan yardımcılar zaten sadece çağıranın kendi
  durumunu döndürüyor.

### EWD'den devralınanlar

`English with Dilara` (ref `hwwpbtcgppzuscbvjkde`) şeması introspect edildi ve
aşağıdaki kalıplar bu şemaya taşındı. Adlandırma ve ekran akışı bu paketin
planına göre; çakışan yerlerde bu plan esas alındı.

| EWD | Pusula karşılığı | Not |
|---|---|---|
| `user_roles` + `has_role()` | `user_roles` + `has_rol()` | Yetki profilden ayrıldı |
| `teacher_owns_student()` | `kocu_muyum()` | Aynı görev |
| `students.is_archived / about_text` | `coach_students.arsivlendi / hakkinda` | |
| `lesson_instances` | `meetings` (+ `sira_no`, `paket_dongusu`, `orijinal_baslangic`, `erteleme_sayisi`) | Erteleme geçmişi taşındı |
| `student_lesson_tracking` | `student_packages` | Haftalık görüşme + paket döngüsü |
| `trial_lessons` | `meetings.tur = 'tanisma'` | Ayrı tablo yerine tür |
| `teacher_balance` | `coach_balance` | Dakika bazlı hakediş |
| `balance_events` | `balance_events` | Hareket defteri |
| `payment_history` | `coach_payments` | Ödeme geçmişi (+ tutar) |
| `homework_submissions` | `homework_submissions` | Ödev yükleme + grup_id |
| `notifications` / `push_tokens` / `lesson_reminder_log` | `notifications` / `push_tokens` / `reminder_log` | Capacitor push altyapısı |
| `global_topic_resources` | `topic_resources` | Konu kaynakları jsonb yerine tablo |
| `blog_posts` | `posts` | Bu paketin alan adlarıyla |

EWD'de olup **bilinçli alınmayanlar:** `profiles.user_id` ayrımı (burada
`profiles.id = auth.users.id`), öğrenci başına kopyalanan `topics`/`resources`
(Pusula'da müfredat global, ilerleme `topic_progress`'te tutulur).

---

## Sınav tarihleri

Tek yerden yönetilir: `.env` (`VITE_YKS_TARIHI`, `VITE_LGS_TARIHI`) → yoksa
`src/config/site.ts` varsayılanları (YKS 20 Haziran 2027 10:15, LGS 6 Haziran
2027 09:30, +03:00). Sınava **30 günden az** kalınca gün rakamı amber'e döner.

Landing hero'sunda iki sayaç birden durur. Masaüstünde görselin köşelerinde
yüzerler; ≤880px'te görselin altında iki sütuna inerler (eskiden LGS sayacı
`hide-m` ile telefonda tamamen gizleniyordu).

---

## Başvuru formu

Alanlar `src/config/site.ts`'te tek listede: `BASVURU_SINIFLARI` (5–12 ve
mezun), `BASVURU_ALANLARI` (SAY/EA/SÖZ — yalnız 11, 12 ve mezuna sorulur),
`BASVURU_PROGRAMLARI` (LGS / Ara Sınıflar / YKS koçluğu) ve paketler
`PAKETLER`'den türetilir. Sınıf seçilince program otomatik işaretlenir; öğrenci
değiştirirse üzerine yazılmaz.

**Bildirim.** Form gönderildiğinde başvuru, admin'in gerçek adresine mail atan
form servisine (Formspree) POST edilir. Uç nokta `BASVURU_FORM_ENDPOINT`;
`.env`'de `VITE_BASVURU_ENDPOINT` ile ezilebilir. Gidecek adres Formspree
panelinden değişir, kodda adres tutulmaz.

**Kayıt.** Bildirimden sonra satır `applications` tablosuna da yazılır. Bu adım
ikincil: hata verirse konsola düşer ama başvuru "gönderildi" sayılır — bildirim
zaten elimize ulaşmıştır.

**Telefon.** `telefonNormalle()` girdiyi 10 haneli yerel forma indirger; `+90`,
`0090`, `90`, `0` önekleri ve boşluk/parantez/tire kabul edilir. Kutuda yazarken
biçimlenir ve kullanıcının yazdığı önek korunur.

> Eskiden hiçbir başvuru geçmiyordu: insert `.select('id')` ile zincirlenmişti,
> anon kullanıcının `applications` üzerinde SELECT politikası olmadığı için
> RETURNING satırı okunamıyor ve form "gönderilemedi" diyordu. Artık dönüş
> istenmiyor; politikalar aynı kaldı.

---

## Yayın öncesi altyapı

### Sunucu (`public/.htaccess`)

Bluehost'ta Apache çalışıyor. Kurallar artık sürüm kontrolünde ve her derlemede
`dist/` köküne kopyalanıyor — eskiden yalnız sunucudaydı, dizini silen bir
dağıtım bütün alt sayfaları 404'e düşürebiliyordu.

| Kural | Neden |
|---|---|
| http → https, www → köksüz (301) | Site düz HTTP'den de açılıyordu; panele http üzerinden girilirse parola şifresiz gidiyordu |
| `DirectorySlash Off` | `public/blog/` gerçek dizine dönüştüğü için Apache `/blog`'u `/blog/`'a yönlendirip **403 Forbidden** basıyordu — blog girişi canlıda tamamen kırıktı |
| `/assets/*` bir yıl `immutable` | Dosya adlarında içerik özeti var; hiç önbellek başlığı yoktu |
| HSTS, X-Frame-Options, nosniff, Referrer-Policy | Hiçbiri tanımlı değildi |

### SEO

`src/lib/sayfaBasligi.ts` rota başına `title`, `description`, `canonical`,
`og:*` ve `twitter:*` etiketlerini yazar. Öncesinde hepsi `index.html`de sabitti:
on dört sayfa aynı başlığı taşıyor ve **hepsi canonical olarak ana sayfayı**
gösteriyordu, yani arama motoruna "blog yazılarım ana sayfanın kopyası" deniyordu.

`public/robots.txt` ve `public/sitemap.xml` eklendi — ikisi de yoktu ve SPA
yönlendirmesi bu adreslere HTML basıp 200 dönüyordu. Paylaşım kartı
`public/og-kapak.png` (1200×630); blog kapakları SVG olduğu için paylaşım
görseli olarak kullanılmıyor (Facebook/WhatsApp SVG render etmez), o durumda
varsayılan karta düşülüyor.

### Başvuru gönderimi

Kayıt ve bildirim **paralel** denenir; biri tutarsa başvuru kabul edilir
(`Promise.allSettled`). Tek kanala bağlamanın iki hâli de kırılgandı: bildirim
öne alınınca form servisinin kotası, veritabanı öne alınınca eksik bir migration
formu tamamen çalışmaz hâle getiriyordu. İkisi de düşerse hata gösterilir.

Formda görünmez bir bot tuzağı (`.tuzak`) ve 18 yaş altı için **veli onayı**
kutusu var — KVKK metni veli onayından söz ediyordu ama form bunu hiç
toplamıyordu, oysa sınıf seçenekleri 5. sınıftan başlıyor.

### İletişim bilgileri

`ILETISIM` (`src/config/site.ts`) tek kaynak. Doldurulan alan alt bilgide ve
yasal sayfalarda kendiliğinden görünür, boş bırakılan hiç basılmaz. Sitede
hiçbir iletişim bilgisi yoktu; üstelik gizlilik metni "başvuru sayfasındaki
iletişim bilgilerinden ulaşabilirsin" diyordu ama orada öyle bir bilgi yoktu.

Yasal metinlerin tarihi `YASAL_GUNCELLEME` sabitinden gelir — `new Date()` ile
basıldığı için metin her gün "bugün güncellendi" diyordu.

---

## Kalite tabanı

- Tüm kopya Türkçe; sayı/tarih `tr-TR` (ondalık virgül, `68,4 net`,
  Europe/Istanbul saati).
- `:focus-visible` halkaları, `aria-label`'lar, "İçeriğe atla" bağlantısı,
  native `<details>` akordeonları.
- `prefers-reduced-motion` altında dekoratif animasyonlar (float/pulse/riseIn)
  kapanır.
- Mobile-first: ≤880px'te panel rayı alt tab-bar'a döner, dokunma hedefleri
  ≥44px, Capacitor için `env(safe-area-inset-*)` payları.
- Rota bazlı kod bölme; ilk açılışta landing dışındaki paketler yüklenmez.

---

## Açık iş

EWD projesine yazma yapılmadı — yalnızca şeması okundu.

Şu anda uygulama tarafında karşılığı **olmayan** (şema + RLS hazır, ekran yok)
devralınan özellikler: ödev yükleme akışı, push bildirim gönderimi ve dakika
bazlı hakediş defterinin otomatik işlenmesi (görüşme tamamlanınca
`balance_events` yazan tetikleyici/Edge Function). Ödemeler ekranı şu an
`coach_payments` satırlarını okuyor; bakiye modeli devreye alınacaksa
tetikleyici de yazılmalı.

Üretim öncesi netleşmesi gerekenler: blog kapak görselleri (şu an kategori
gradyanı kullanılıyor), gerçek yerleştirme verisiyle `net_siralama_tablosu`,
görüşme katılım bağlantısı (Zoom/Meet) entegrasyonu.

**Fiyatlar** `src/config/site.ts → PAKETLER` içinde: aylık 4.000 ₺; dönemlik
(4 ay) 3.500 ₺/ay; sınava kadar tam süreç 3.000 ₺/ay. Aylık ücreti sen
verdin — dönemlik ve tam süreç için aylık indirimli tutarları ben varsaydım,
tek satırda değiştirilebilir.

**Landing'deki “128 öğrenci”** sayısı `src/data/demo.ts → OGRENCI_SAYISI`
sabitinden geliyor ve şu an gerçeği yansıtmıyor; yayına almadan önce güncellenmeli
ya da bölüm kaldırılmalı.
