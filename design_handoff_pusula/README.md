# Handoff: Pusula — YKS/LGS Koçluk Platformu

Bu paket, Cursor/WSL'de çalışan **Claude Code**'a verilmek üzere hazırlandı. Amaç: buradaki tasarımı birebir koruyarak, eksik sayfaları tamamlayarak ve tüm işlevleri gerçek koda dökerek üretim uygulamasını yapmak.

## Genel Bakış
Pusula, YKS (TYT/AYT) ve LGS öğrencilerine online birebir koçluk ürünüdür. Herkese açık site (landing + blog) ve giriş sonrası role göre 4 panel (Öğrenci, Veli, Koç, Admin) içerir. Ürünün imza özelliği **Net Denge**: hedef puan/sıralamadan ders başına gereken netleri hesaplayıp, bir ders kısılınca farkı kilitsiz derslere dağıtan etkileşimli hesaplayıcı (sonuç her zaman "tahmini" etiketiyle).

## Bu Dosyalar Hakkında (ÖNEMLİ)
Paketteki `.dc.html` dosyaları **HTML ile yapılmış tasarım referanslarıdır** — üretim kodu değildir, doğrudan kopyalanmaz. Görev: bu tasarımları hedef ortamda **yeniden inşa etmek**. Hedef ortam (orijinal brief'ten): **React (Vite) + Capacitor** (iOS/Android'e çevrilecek, mobile-first) + **Supabase** (auth, DB, RLS). Dosyalar tarayıcıda açılıp incelenebilir; stil değerlerinin tek doğru kaynağı `design-tokens.css`'tir.

## Fidelity: HIGH-FIDELITY (hifi)
Renkler, tipografi, boşluklar, radius, gölgeler ve metinler nihaidir. UI birebir (pixel-perfect) yeniden üretilmelidir. Tüm değerler `design-tokens.css`'teki CSS değişkenlerinden gelir — implementasyonda da aynı üç katmanlı token mimarisi korunmalı (primitive → semantic → component; Tailwind kullanılacaksa token'ları theme'e bağla, hex'leri komponentlere gömme).

## Tasarım Token'ları (özet — tam liste `design-tokens.css`)
- **Zemin:** `#F1F4DF` (açık adaçayı) + **64px kareli ızgara** (çizgi: `rgba(140,160,80,.24)`, 1.5px). Sınıf: `.bg-kareli`. Hero gradyanının içinden de kareler görünür (grid layer + gradyan katmanı).
- **Primary/CTA (kırmızı):** `#CF2E2F`, hover `#B32729`, active `#9A2123`, soft zemin `#F8E3DD`. Buton metni beyaz.
- **İkincil vurgu (zeytin):** `#8CA050`, koyusu `#6E7F39`, soft `#E4EAC6`.
- **Metin:** `#1E293B`; muted `#67705A`; kenarlık `#D8DFBB`; kart yüzeyi `#FFFFFF`.
- **Ders renkleri (her yerde sabit):** Türkçe `#C4B5FD` · Matematik `#7DD3FC` · Fen `#6EE7B7` · Sosyal `#FDBA74` · Yabancı Dil `#F9A8D4`. Pastel üstünde metin `#0F172A`.
- **Durumlar:** success `#22C55E` · warning/aciliyet `#F59E0B` (sınav ≤30 gün kala sayaç amber'e döner) · error `#EF4444` · info `#3B82F6`.
- **Gradyanlar:** hero `120deg #F3F6E3→#EDF1D8→#F9EEE2`; panel tuvali `150deg #F3F6E1→#EEF2DA→#F8EFE3`; panel dış zemini `#E4EAC6`.
- **Tipografi:** Başlık Poppins 500/600/700, gövde Inter 400/500/600/700 (Google Fonts). Gövde max 65ch, sola yaslı.
- **Spacing:** 4px taban (4/8/12/16/24/32/48/64). **Radius:** buton 12, kart 20, chip/pill 999. **Gölge:** `0 8px 24px rgba(30,41,59,.06)`, lift `0 16px 40px rgba(30,41,59,.10)`.
- **Koyu mod:** aynı semantic token adları, `[data-theme="dark"]` altında farklı değerler (dosyada hazır). Tüm sayfalarda tema `data-theme` attribute'üyle değişir.
- **İkonlar:** Lucide, stroke 2 (inline SVG). Emoji kullanılmaz (tek istisna: öğrenci selamlamasındaki 👋).

## Ekranlar (tasarım dosyası → route önerisi)

### 1. Landing — `Landing.dc.html` → `/`
Sticky yarı saydam header (logo + Nasıl çalışır + Blog + Giriş + "Başvur" CTA). Hero: kareli-gradyan zemin; solda chip, büyük başlık (**canlı gün sayısıyla**: "YKS'ye {gün} gün. Bugün doğru konuyla başla."), loss-aversion alt satırı, tek CTA ("Ücretsiz ilk görüşmeyi al" + "20 dakika · kart bilgisi istemez"); sağda illüstrasyon alanı üzerine **iki yüzen canlı geri sayım kartı** (YKS + LGS; gün/saat/dk/sn, saniye her sn ticker, floatY animasyonu). Ardından: 3 adım kartı (Başvur → Koçunla eşleş → Her hafta ilerle), Net Denge önizleme kartı (statik mock + "Panelde dene"), sosyal kanıt (1 öğrenci + 1 veli görüşü + "128 öğrenci" sayı kartı), 3 blog kartı, kapanış CTA bandı, 5 sütunlu footer. Sınav tarihleri: YKS 20 Haziran 2027 10:15, LGS 6 Haziran 2027 09:30 (+03:00) — konfigürasyondan gelmeli.

### 2. Blog indeks — `Blog.dc.html` → `/blog`
Kareli krem-adaçayı zemin, harf aralıklı uppercase kicker + büyük "Blog" başlığı, öne çıkan geniş kart (kapak görseli), 6'lı kart ızgarası (pastel gradyan kapaklar, kategori chip'i ders renkleriyle, okuma süresi). CMS: yazılar Supabase tablosundan.

### 3. Blog yazısı — `Blog Yazisi.dc.html` → `/blog/{slug}`
720px editoryal sütun; uppercase kicker, büyük başlık, yazar satırı (avatar baş harfleri), kapak görseli, geniş lead paragraf, H2 bölüm ritmi, 1 grafik figürü (SVG çizgi grafik), numaralı plan kartı (primary-soft zemin), pull-quote (sol kırmızı çizgili), kapanışta CTA kartı.

### 4. Tasarım sistemi — `Tasarim Sistemi.dc.html` → dahili `/styleguide`
Token ve bileşen kütüphanesi referans sayfası; light/dark anahtarıyla. Bileşen sözleşmesi: Button (primary/secondary/outline/ghost/accent × sm/default/lg × disabled), Card (+interactive hover lift), Chip/Badge (+"~X soru" rozeti), Input/Select/Checkbox/Switch/Segmented (focus'ta kırmızı ring), Alert (4 tür), Table (satır hover), Countdown, Stat tile, Ring progress, Activity timeline, Net Denge stepper, Müfredat akordeonu, bar+çizgi ve donut grafikler.

### 5. Öğrenci paneli — `Ogrenci Paneli.dc.html` → `/panel/*`
Kabuk: kareli dış zemin üzerinde 28px radius yuvarlatılmış **gradyan tuval çerçevesi**; solda 84px **ikon-only beyaz ray** (aktif öğe primary-soft zeminli; altta diğer panel kısayolları); mobilde (≤880px) ray **alta yüzen hap tab-bar** olur. Üst bar: sayfa başlığı + arama + zil (kırmızı nokta) + profil hapı.
Beş görünüm (tasarımda sidebar state ile; üretimde route):
- **`/panel` Genel bakış:** kartsız selamlama ("Merhaba Elif 👋 / bugün tek konu: Köklü Sayılar") + CTA; iki kompakt canlı sayaç kartı; **Bugünün akışı** saat çizelgesi (09–16 ekseni, ders renginde hap bloklar, kırmızı "şimdi" imleci); "Bu hafta" checklist kartı (%66 bar + Zeigarnik metni "1 konu kaldı"); "Sonraki görüşme" kartı (tarih bloğu, gündem chip'leri, Takvime ekle/Yeniden planla); İlerleme özeti (ring %38 + 3 mini stat).
- **`/panel/mufredat`:** breadcrumb + TYT/AYT segmented; ders akordeonları (renk noktası, x/y konu, mini bar); açık konuda: "~X soru" rozeti, **çıkmış sorular linki**, kaynak linkleri, ilerleme barı, D/Y/B hızlı giriş. Müfredat verisi DB'den (sınav→oturum→ders→konu, konu başına ort. çıkan soru sayısı).
- **`/panel/ilerleme`:** bar+çizgi kombo (haftalık çözülen soru + ort. net trendi), ders dağılımı donut'u, soru girişi formu (konu seç + D/Y/B → kaydet; net = D − Y/4), son girişler listesi. Grafikler: **Chart.js** (tasarımdaki SVG'ler referans; renkler ders token'larından, ızgara açık, eksen muted).
- **`/panel/net-denge`:** hedef tipi segmented (puan/sıralama) + hedef chip; ders satırları: renk noktası, − net + stepper, /max, ilerleme barı, **"sabitle" kilidi**; toplam sabit kalır — artış/azalış kilitsiz derslere dağıtılır (davranış `Ogrenci Paneli.dc.html` logic'inde birebir kodlu: `degistir()` ve `sira()` fonksiyonları — aynen taşı); altta toplam net + **tahmini sıralama** (interpolasyon tablosu: 110→5k, 100→15k, 90→52k, 80→110k, 70→210k, 60→380k, 50→650k; gerçek veriyle değiştirilecek) + "tahmini — garanti değil" rozeti + bilgi alert'i.
- **`/panel/gorusmeler`:** sonraki görüşme bandı (Katıl/Yeniden planla), geçmiş görüşme kartları (koç notu, konu chip'leri).

### 6. Veli paneli — `Veli Paneli.dc.html` → `/veli`
Salt-okunur tek ekran: çocuk kimlik kartı + canlı gün sayısı; haftalık plan checklist'i; net gelişimi alan grafiği (+3,5 rozeti); sonraki görüşme kartı + "Koça mesaj bırak"; **koçun haftalık raporu** (yalnızca koç "veliyle paylaş" işaretlediyse görünür); detay bölümü (ders bazlı barlar + deneme tablosu) **koçun açtığı detay seviyesine** bağlı görünür/gizli.

### 7. Koç paneli — `Koc Paneli.dc.html` → `/koc/*`
Liste: 4 stat kartı (aktif öğrenci, bugünkü görüşme, geciken plan, ort. net değişimi) + öğrenci tablosu (avatar, sınav, plan barı, net trend sparkline, son net, sonraki görüşme, durum rozeti: Yolunda/Plan gecikti/Riskli/Yeni, Detay butonu). Detay: öğrenci başlığı + Görüşme başlat; haftalık plan kartı + **gelecek haftaya konu atama** (chip'ler + Planı gönder); ilerleme (ring + ders barları + 3 stat); **görüşme notu yazma** (textarea + "Veliyle paylaş" checkbox + kaydet → geçmiş notlara düşer); geçmiş notlar.

### 8. Admin paneli — `Admin Paneli.dc.html` → `/admin`
4 metrik kartı (aktif öğrenci +artış, koç sayısı + ort. öğrenci, haftalık görüşme + iptal, ort. plan tamamlama); öğrenci büyümesi bar grafiği (son ay vurgulu); son aktiviteler akışı (kayıt/uyarı/görüşme/blog); koç tablosu (öğrenci sayısı, plan tamamlama barı, haftalık görüşme, ort. net değişimi, durum) + "Koç ekle".

## Etkileşim ve Davranış Kuralları
- Geri sayımlar canlı (1sn tick); sınava ≤30 gün kala gün rakamı amber. Tarih/saat Europe/Istanbul.
- Hover: kartlar `translateY(-3px)` + lift gölge (yalnız interaktif kartlar); butonlarda token hover rengi; `:focus-visible` 2px kırmızı ring; `prefers-reduced-motion`'da animasyonlar kapatılmalı (float/pulse/riseIn dekoratiftir).
- Akordeonlar native `<details>` mantığı; segmented kontroller anlık state.
- Mobile-first: 880px altında panel rayı alt tab-bar; landing grid'leri `auto-fit minmax` ile akar; dokunma hedefleri ≥44px.
- Ton/voice (marka sesi): güven veren ama sıcak, kısa, jargonsuz, dürüst — sıralama/puan **garantisi verilmez**, her tahmin "tahmini" etiketli. Buton metinleri eylemi söyler ("Ücretsiz ilk görüşmeyi al", "Girişi kaydet").

## Uygulama Kapsamı — Claude Code Görevleri
1. **Stack:** React (Vite) + TypeScript + Capacitor; Supabase (auth + Postgres + RLS + storage). Router ile yukarıdaki route haritası. State: hafif (TanStack Query + local state yeterli).
2. **Supabase / EWD klonu:** "**English with Dilara (EWD)**" projesindeki **tablolar ve RLS policy'leri klon alınacak** (kullanıcı Supabase bağlantısını verecek; şemayı introspect et). EWD'deki **konu/müfredat, koç ödemesi, görüşme, ödev/plan vb. neredeyse tüm özellikler** bu projeye taşınacak. **Çakışma kuralı: EWD'de benzer özellik varsa bile BU paketteki plan/tasarım esas alınır** (adlandırma ve ekran akışı buradaki gibi).
3. **Bu projeye özgü ekler:** ayrı **Veli rolü ve paneli** (EWD'de yoksa yeni tablo+policy), Net Denge (hedefler + dağıtım + tahmini sıralama tablosu), çift sınav geri sayımı, ders renk sistemi, blog CMS.
4. **Önerilen ek şema** (EWD'de karşılığı yoksa oluştur, varsa uyarla): `profiles(role: ogrenci|veli|koc|admin)`, `coach_students`, `parent_students`, `exams/subjects/topics(question_avg, past_questions_url)`, `topic_progress`, `question_entries(d,y,b)`, `mock_exams`, `net_targets` + `net_allocations(locked)`, `meetings` + `meeting_notes(shared_with_parent)`, `weekly_plans/plan_items`, `coach_payments`, `posts`. 
5. **RLS ilkeleri (EWD kalıbıyla):** öğrenci yalnız kendi verisi; veli bağlı öğrencinin verisini **salt-okunur** (not/rapor yalnız `shared_with_parent=true` ise); koç yalnız kendi öğrencileri (yazma: plan, not, ödev); admin tümü; blog herkese açık okuma.
6. **Eksik sayfalar** (tasarımı token'lardan türet): `/nasil-calisir`, `/basvuru` (kısa form — alan sayısını minimumda tut), `/giris` (Supabase auth), koç takvim/görüşmeler listesi, admin koç/öğrenci detayları, veli görüşmeler listesi, koç ödemeleri ekranı (admin + koç görünümü).
7. **Kalite tabanı:** WCAG AA kontrast, klavye odak halkaları, TR yerelleştirme (`toLocaleString('tr-TR')`, ondalık virgül), tüm kopya Türkçe.

## Varlıklar
Görsel/illüstrasyon placeholder'dır (`image-slot` alanları): hero illüstrasyonu, blog kapakları gerçek görsellerle değiştirilecek. Logo: yuvarlatılmış kare içinde pusula iğnesi (inline SVG, dosyalarda mevcut). İkonlar Lucide'den inline SVG.

## Paketteki Dosyalar
- `design-tokens.css` — **tek doğru kaynak**: token'lar (3 katman), taban stiller, bileşen sınıfları, kareli zemin, app-shell/ray, koyu mod, keyframe'ler.
- `Landing.dc.html`, `Blog.dc.html`, `Blog Yazisi.dc.html`, `Tasarim Sistemi.dc.html`, `Ogrenci Paneli.dc.html`, `Veli Paneli.dc.html`, `Koc Paneli.dc.html`, `Admin Paneli.dc.html` — ekran referansları. Her dosyanın sonundaki `<script data-dc-script>` bloğunda ekranın **çalışan etkileşim mantığı** (geri sayım, Net Denge dağıtımı, not kaydetme) düz JS olarak okunabilir.
- `orijinal-brief.md` — ürünün tam tasarım & mimari brief'i (bilgi mimarisi, URL haritası, pazarlama psikolojisi kopya tablosu, marka sesi). Kopya yazarken buradaki tabloyu kullan.
