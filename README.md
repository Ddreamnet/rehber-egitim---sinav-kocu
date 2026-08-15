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

`src/lib/netDenge.ts`, tasarım dosyasındaki `degistir()` ve `sira()`
fonksiyonlarının birebir karşılığıdır: bir ders değişince fark **yalnız kilitsiz**
derslere dağıtılır, toplam sabit kalır, dengelenemeyen artık geri alınır.
Tahmini sıralama tablosu DB'de (`net_siralama_tablosu`) tutulur; yoksa
tasarımdaki varsayılan interpolasyon noktaları kullanılır. Sonuç her yerde
**"tahmini"** etiketiyle gösterilir.

---

## Rota haritası

| Rota | Ekran | Erişim |
|---|---|---|
| `/` | Landing (çift canlı geri sayım, tek CTA) | herkes |
| `/nasil-calisir` | 3 adım, paketler, SSS | herkes |
| `/blog`, `/blog/:slug` | Blog indeks + yazı (CMS) | herkes |
| `/basvuru` | Başvuru formu | herkes |
| `/giris` | Supabase auth — **kayıt formu yok**, hesapları admin açar | herkes |
| `/styleguide` | Token ve bileşen kütüphanesi | dahili |
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

Yeni bir ortama kurmak için:

```bash
supabase link --project-ref <ref>
supabase db push        # 0001 → 0006 sırayla
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
