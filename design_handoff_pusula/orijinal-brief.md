# Rehber Sınav Koçluğu — Tasarım & Mimari Brief
### (Claude Design'a doğrudan verilecek çalışma dosyası)

> **Bu dosya nasıl kullanılır:** Bu brief'i Claude Design oturumuna yapıştır ve 3 referans görselini (a.webp, graphic.avif, blog.jpg) oraya da ekle. Claude Design önce **tasarım sistemini (token'ları)** kursun, sonra sırasıyla landing → blog → uygulama panellerini üretsin. Tüm site tek token kaynağından yönetilecek: bir değeri değiştir, her yere yansısın.

---

## 0. Kuzey Yıldızı (tasarım prensibi)

**Sade, şık, canlı, açık renkli, okunaklı.** Kalabalık değil — her ekran tek bir işi net yapsın (Hick Yasası). Mobile-first: proje React (Vite) + Capacitor ile iOS/Android'e çevrilecek, o yüzden dokunmatik-öncelikli, tek elle kullanılabilir, büyük dokunma hedefleri.

**Ne için:** YKS (TYT/AYT) ve LGS öğrencilerine online koçluk/rehberlik. Öğrenci, veli, koç ve admin panelleri.

---

## 1. Marka

**Marka adı (aday):** `Pusula` veya `NetRota` — brief'te `[MARKA]` olarak geçiyor, seçilince tek yerden değişecek.

**Logo yönü:** Basit geometrik **pusula/rota** işareti (kuzey oku ya da bir "konum pini" ile birleşen ince çizgi) + yalın wordmark. Tek renkte de çalışmalı, yuvarlak köşeli, dost bir dil.

### Marka sesi (voice) — 4 özellik

| Özellik | Anlamı | Böyle | Böyle değil |
|---|---|---|---|
| Güven veren ama sıcak | Uzman ama arkadaş gibi | "Planını birlikte kuralım." | "Uzman kadromuzca hazırlanmıştır." |
| Net ve sade | Kısa, jargonsuz | "Bu hafta 3 konu." | "Haftalık müfredat kazanım matrisi." |
| Motive edici | İlerlemeyi görünür kılar | "Hedefe 12 net kaldı." | "Netleriniz yetersiz." |
| Dürüst | Abartısız, tahminleri tahmin diye söyler | "Tahmini sıralama." | "Kesin 100.000'e girersin." |

**Böyle konuşuruz:** "Sınava X gün kaldı, planın hazır." · "Bugün tek bir konu: köklü sayılar." · "Geçen görüşmede şunu konuşmuştuk."
**Böyle konuşmayız:** tepeden bakan, korkutan, suçlayan, aşırı resmi dil.

---

## 2. Tasarım Sistemi (tek kaynak — design tokens)

Üç katmanlı token mimarisi kullan (bu, "tek yerden yönet" isteğinin teknik karşılığı):

```
Primitive (ham değer)  →  Semantic (amaç)  →  Component (bileşen)
--color-indigo-600         --color-primary      --button-bg
```

### 2.1 Renk paleti

Açık/pastel zemin, güven veren indigo ana renk, sıcak mercan CTA vurgusu, ders/grafik için pastel destekler. Oran kuralı: **primary ~%60, secondary/nötr ~%30, accent ~%10.** Metin/zemin kontrastı en az **WCAG AA 4.5:1**. Saf siyah kullanma (#0F172A / slate).

| Rol | Hex | Kullanım |
|---|---|---|
| Primary | `#4F46E5` | Ana CTA, aktif nav, vurgular |
| Primary hover / active | `#4338CA` / `#3730A3` | Buton durumları |
| Primary light | `#EEF2FF` | Seçili arka plan, chip zemini |
| Accent (sıcak) | `#FB7185` | İkincil CTA vurgusu, "canlı" dokunuşlar |
| Zemin (page) | `#F8FAFC` | Sayfa arka planı |
| Hero/panel gradient | `#ECFDF5 → #EEF2FF` | Yumuşak nane→lila geçiş (a.webp dili) |
| Kart (surface) | `#FFFFFF` | Kart/panel yüzeyi |
| Metin | `#1E293B` | Ana metin |
| Muted metin | `#64748B` | İkincil/açıklama metni |
| Kenarlık | `#E2E8F0` | Çizgiler, ayraçlar |

**Ders/kategori pastelleri (grafik + konu etiketleri):** Türkçe `#C4B5FD` (lila) · Matematik `#7DD3FC` (gök) · Fen `#6EE7B7` (nane) · Sosyal `#FDBA74` (şeftali) · Yabancı Dil `#F9A8D4` (pembe). Aynı ders her yerde aynı renk.

**Semantik:** success `#22C55E` · warning `#F59E0B` · error `#EF4444` · info `#3B82F6`. **Geri sayım aciliyeti** için amber (`#F59E0B`) kullan (yaklaştıkça).

```css
:root {
  /* Primitive */
  --indigo-600:#4F46E5; --indigo-700:#4338CA; --indigo-800:#3730A3; --indigo-50:#EEF2FF;
  --rose-400:#FB7185; --amber-500:#F59E0B;
  --slate-50:#F8FAFC; --slate-800:#1E293B; --slate-500:#64748B; --slate-200:#E2E8F0;
  /* Semantic (amaç) — bileşenler SADECE bunlara bağlanır */
  --color-primary:var(--indigo-600);
  --color-primary-hover:var(--indigo-700);
  --color-primary-active:var(--indigo-800);
  --color-primary-soft:var(--indigo-50);
  --color-accent:var(--rose-400);
  --color-bg:var(--slate-50);
  --color-surface:#FFFFFF;
  --color-text:var(--slate-800);
  --color-text-muted:var(--slate-500);
  --color-border:var(--slate-200);
  --color-urgent:var(--amber-500);
}
```

### 2.2 Tipografi

- **Başlık:** Poppins (600/700) — dost, geometrik, Türkçe karakter desteği tam.
- **Gövde:** Inter (400/500/600) — uzun metinde okunaklı.
- Maksimum satır uzunluğu gövde metninde **65ch**. Justify yok, sola yasla.

| Öğe | Boyut (masaüstü / mobil) | Ağırlık | Satır yüksekliği |
|---|---|---|---|
| Display (hero) | 3.0rem / 2.0rem | 700 | 1.1 |
| H1 | 2.25rem / 1.75rem | 700 | 1.2 |
| H2 | 1.75rem / 1.4rem | 600 | 1.25 |
| H3 | 1.375rem / 1.2rem | 600 | 1.3 |
| Body L | 1.125rem | 400 | 1.6 |
| Body | 1rem | 400 | 1.5 |
| Small | 0.875rem | 400 | 1.5 |

### 2.3 Spacing, radius, gölge

- **Spacing:** 4px tabanlı ölçek (4, 8, 12, 16, 24, 32, 48). Kartlarda bol iç boşluk (24px).
- **Radius:** buton 12px, kart **20px** (a.webp'deki yumuşak köşe), chip 999px (pill).
- **Gölge:** yumuşak ve dağınık (ör. `0 8px 24px rgba(30,41,59,.06)`). Sert/koyu gölge yok.

### 2.4 Bileşen şartnamesi (durum tablosuyla)

Her bileşen Default / Hover / Active / Disabled durumlarını token'lardan alır.

- **Button:** varyantlar `primary` (indigo, beyaz metin), `secondary` (açık gri), `outline`, `ghost`, `accent` (mercan). Boyutlar sm 32 / default 40 / lg 48px. Disabled %50 opaklık.
- **Card:** radius 20, gölge yumuşak, header/content/footer 24px padding. `interactive` varyantı hover'da hafif yükselir.
- **Input / Select / Checkbox / Switch:** focus'ta primary ring (%20 opaklık). Net etiket + yardımcı/hata metni.
- **Badge / Chip:** konu etiketi + **"~X soru" rozeti** (küçük, pastel zemin).
- **Alert:** info/success/warning/error, açık pastel zemin + ikon.
- **Table:** koç/admin listelerinde; sayılar sağa, durum ortaya, satır hover `#F8FAFC`.

**Alana özgü bileşenler (öz olarak tarif et, iç mimariyi Claude Design çözsün):**
- **Countdown (çift):** YKS ve LGS için iki canlı sayaç; büyük rakamlar, tik-tak/flip animasyonu; sınav yaklaştıkça amber vurgu (goal-gradient).
- **Stat tile:** küçük ikon + sayı + etiket (a.webp'deki "Course/Badge/Certificate" tarzı).
- **Ring/donut progress:** dairesel ilerleme (performance report tarzı).
- **Activity timeline:** yatay saat/hafta ekseni üzerinde etiketli bloklar (a.webp'deki "Today's activity").
- **Net Denge Stepper:** her ders için `[ − ] net [ + ]` + yanında "🔒 sabitle" checkbox'ı.
- **Müfredat ağacı (accordion):** sınav → oturum → ders → konu; konuya tıklayınca altında detay açılır.

### 2.5 Grafik teması

`graphic.avif` dilinde: **bar+çizgi kombosu, alan grafiği, donut/ring**. Renkler paletten (ders renkleri). Chart.js ile, CSS-only bar değil. Izgara çizgileri açık gri, eksen etiketleri muted.

### 2.6 Hareket

İnce mikro-etkileşimler: buton hover, kart yükselme, sayaç canlı akış, ilerleme çubuğu dolarken yumuşak animasyon (Zeigarnik/goal-gradient). Abartı yok.

### 2.7 Koyu mod (opsiyonel)

`graphic.avif`'te var; semantic token'lar sayesinde ücretsiz gelir. İstenirse ikinci temada aynı token adları, farklı primitive değerleri.

---

## 3. Bilgi Mimarisi (site-architecture)

3 tık kuralı: her önemli ekran ana ekrandan en fazla 3 tıkta. Header'da 4–7 öğe. Genel yapı: **herkese açık site** (landing + blog) + **giriş sonrası uygulama** (role göre panel).

### 3.1 Sayfa hiyerarşisi

```
Ana Sayfa (/)                         ← çift geri sayım + tek CTA
├── Nasıl Çalışır (/nasil-calisir)
├── Blog (/blog)
│   └── Yazı (/blog/{slug})           ← blog.jpg editoryal düzen
├── İletişim / Başvuru (/basvuru)
├── Giriş (/giris)
│
└── Uygulama (giriş sonrası, role göre)
    ├── Öğrenci (/panel)
    │   ├── Genel bakış (/panel)               countdown + bu hafta + sonraki görüşme
    │   ├── Müfredat (/panel/mufredat)         TYT/AYT|Sözel/Sayısal → ders → konu → "kaç soru" + çıkmış sorular
    │   ├── Soru girişi & ilerleme (/panel/ilerleme)
    │   ├── Net Denge (/panel/net-denge)       hedef puan/sıralama → ders başına − net +
    │   └── Görüşmeler (/panel/gorusmeler)     sonraki + geçmiş notlar
    ├── Veli (/veli)                            salt-okunur özet + sonraki görüşme
    ├── Koç (/koc)                              öğrenci listesi → öğrenci detayı
    └── Admin (/admin)                          tüm koç + tüm öğrenci tek panel
```

### 3.2 URL haritası (öz)

| Ekran | URL | Konum | Öncelik |
|---|---|---|---|
| Ana sayfa | `/` | Header | Yüksek |
| Nasıl çalışır | `/nasil-calisir` | Header | Orta |
| Blog | `/blog` | Header | Orta |
| Başvuru | `/basvuru` | Header CTA | Yüksek |
| Öğrenci paneli | `/panel` | Uygulama sidebar | Yüksek |
| Müfredat | `/panel/mufredat` | Sidebar | Yüksek |
| Net Denge | `/panel/net-denge` | Sidebar | Yüksek |
| Görüşmeler | `/panel/gorusmeler` | Sidebar | Orta |

### 3.3 Navigasyon

- **Landing header:** Logo (sol) · Nasıl Çalışır · Blog · (sağda) **Başvur** CTA. 4–7 öğe sınırı.
- **Uygulama:** sol **sidebar** (a.webp/graphic.avif dili) ikon+etiket; üstte arama + bildirim + profil. Mobilde sidebar alt tab-bar'a döner (Capacitor).
- **Breadcrumb** müfredat derinliğinde: `Panel > Müfredat > TYT > Matematik > Köklü Sayılar`.
- **Footer:** Ürün (Nasıl çalışır, Paketler) · Kaynaklar (Blog) · Kurum (İletişim) · Yasal (Gizlilik, KVKK).

---

## 4. Ekran şartnamesi (sade — her ekranda ne var)

### 4.1 Landing (`/`)
Yukarıdan aşağıya, az bölüm:
1. **Hero:** çift canlı geri sayım (YKS + LGS) + tek satır vaat + **tek CTA**. Yumuşak gradient zemin, sağda dost illüstrasyon.
2. **Nasıl çalışır (3 adım):** Başvur → Koçunla eşleş → Haftalık takip. Üç küçük kart, üç ikon.
3. **Fark:** Net Denge Hesaplayıcı'nın küçük bir önizlemesi (bir cümle + görsel).
4. **Sosyal kanıt:** öğrenci/veli görüşü + sayısal bir gösterge.
5. **Blog teaser:** 3 son yazı kartı.
6. **Kapanış CTA + footer.**

### 4.2 Blog (`/blog`, `/blog/{slug}`)
`blog.jpg` dili: büyük başlık, bol boşluk, bölüm ritmi, bölüm başına tek görsel/grafik. İndeks = kart ızgarası (kapak + başlık + kısa özet + okuma süresi).

### 4.3 Öğrenci paneli
- **Genel bakış:** üstte çift countdown; "Bu hafta çalışılacak konu(lar)"; "Sonraki görüşme" kartı; küçük ilerleme özeti (ring + stat tile'lar).
- **Müfredat:** sınav filtresi (TYT/AYT veya Sözel/Sayısal) → ders → konu accordion. Konu açılınca: **"~X soru çıkıyor" rozeti**, **çıkmış sorular linki**, kaynak linkleri, kişisel ilerleme + soru girişi.
- **Soru girişi & ilerleme:** konu bazlı doğru/yanlış/boş gir → bar+çizgi ve donut grafikler.
- **Net Denge:** hedef puan **veya** son yıla göre hedef sıralama seç → her ders satırı `[−] net [+]` + "🔒 sabitle"; bir dersi kısınca diğerleri dengelenir. Sonuç "tahmini" etiketiyle.
- **Görüşmeler:** en üstte "Sonraki görüşme: gün/saat", altında geçmiş görüşme kartları (koç notları, konuşulan konular).

### 4.4 Veli paneli
Salt-okunur özet: çocuğun ilerleme grafikleri + sonraki görüşme + koçun paylaştığı rapor. Detay seviyesini koç açıp kapatır. Sade, tek ekran.

### 4.5 Koç paneli
Öğrenci listesi (tablo/kart) → öğrenci detayı: müfredat ilerlemesi, soru/deneme girişi, **görüşme notu yazma**, haftalık plan/ödev atama.

### 4.6 Admin paneli
Tüm koç + tüm öğrenci tek ekranda: özet metrikler, koç bazlı öğrenci sayısı ve genel ilerleme.

---

## 5. Site içi yazılar — pazarlama psikolojisi uygulaması

On-site metinleri aşağıdaki modellerle yaz. **İlke: sade dil (uzman lanetinden kaçın), tek net eylem, dürüst çerçeveleme.**

| Yer | Uygulanan model | Türkçe örnek metin |
|---|---|---|
| Hero başlık | Goal-gradient + present bias | "YKS'ye **187 gün**. Bugün doğru konuyla başla." |
| Hero alt cümle | Loss aversion (kayıp çerçevesi) | "Yanlış konuya harcanan her hafta, geri gelmeyen nettir." |
| Ana CTA | Aktivasyon enerjisini düşür + reciprocity + zero-price | "Ücretsiz ilk görüşmeyi al" (küçük ilk adım) |
| Nasıl çalışır | Commitment & consistency (küçük→büyük) | "1) Başvur 2) Koçunla eşleş 3) Her hafta ilerle" |
| Fark bölümü | IKEA/endowment + anchoring | "Hedefini sen belirle, gereken netleri sistem hesaplasın." |
| Sosyal kanıt | Bandwagon + availability heuristic | "Bu dönem **N** öğrenci haftalık planıyla ilerliyor." + gerçek görüş |
| İlerleme/panel | Zeigarnik + goal-gradient | "Bu haftanın %80'i tamamlandı — 1 konu kaldı." |
| Görüşme hatırlatma | Peak-end + timely (EAST) | "Yarın 19:00 koç görüşmen var. Bu haftaki 3 konuyu konuşacağız." |
| Paketler (varsa) | Good-better-best + decoy + charm/round + mental accounting | 3 paket, ortası önerili; "Günde bir çay parası kadar." |
| Blog başlıkları | Curse-of-knowledge'dan kaçın, merak (Zeigarnik) | "Matematik neti neden artmıyor? (ve 1 haftada nasıl kırılır)" |

**Seçim azalt (Hick + paradox of choice):** landing'de **tek** birincil CTA, en fazla **3** paket. Formlarda alanı minimize et (activation energy).
**Dürüstlük şartı:** Net Denge sonuçlarını **"tahmini"** yaz; sıralama/puan garantisi verme.

### Örnek yeniden yazımlar (before → after)
- ❌ "Uzman kadromuzla akademik başarınızı maksimize edin." → ✅ "Her hafta koçunla otur, doğru konuyla ilerle."
- ❌ "Gelişmiş analiz motoru netlerinizi optimize eder." → ✅ "Hangi konu sana net kazandırır, birlikte görelim."

---

## 6. Görsel dil & referanslar

- **a.webp** → panel/kart dili: yumuşak gradient zemin, geniş radius kartlar, dost illüstrasyon, timeline + ring progress + stat tile'lar.
- **graphic.avif** → grafik dili: bar+çizgi, alan, donut; sidebar navigasyon; (opsiyonel) koyu mod.
- **blog.jpg** → blog/editoryal düzen: büyük başlık, bol boşluk, bölüm ritmi.
- İllüstrasyon: dost/sevimli, **az ve yerinde** (hero, boş durumlar). Her yeri illüstrasyonla doldurma.

---

## 7. Claude Design'dan beklenen çıktı sırası

1. **Tasarım sistemi:** yukarıdaki token'lardan `design-tokens.css` (primitive→semantic→component) + bileşen kütüphanesi. Tek kaynak.
2. **Landing** (mobile-first, çift countdown, tek CTA).
3. **Blog** indeks + yazı şablonu.
4. **Uygulama kabukları:** öğrenci / veli / koç / admin panelleri (iç mimari sonra; şimdilik ekran iskeletleri ve stil).
5. Tümü Türkçe içerik, mobile-first, tek token kaynağına bağlı.

> Not: Panellerin **iç mimarisi/veri modeli** bu brief'in kapsamı dışında (ayrı planlandı ve EWD'den klonlanacak). Claude Design yalnızca görsel tasarım ve ekran düzenini üretsin.
