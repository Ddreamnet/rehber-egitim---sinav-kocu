-- ============================================================
-- REHBER — Blog içerikleri ve müfredat düzeltmesi (0006)
-- Yazı metinleri src/content/blog/*.md dosyalarından üretildi;
-- düzenleme yapılacaksa önce o dosyalar güncellenir.
-- ============================================================


update public.posts set icerik = 'Günde 60 soru çözüyorsun, net üç aydır 12''de. Tanıdık mı? Sorun çalışkanlık değil, **seçim**: çoğu öğrenci sınava kadar en iyi bildiği konulardan soru çözer. İyi hissettirir, net getirmez.

## Soru çözmek değil, eksik kapamak

TYT matematikte 40 soru var ve bunların büyük kısmı konu listesinin ilk yarısından — temel kavramlar, sayılar, üslü-köklü, oran-orantı, problemler — geliyor. Yani sıralamayı belirleyen şey nadir konularda parlamak değil, *temel konularda delik bırakmamak*.

Netin sabitse büyük ihtimalle aynı deliklerden tekrar tekrar su alıyorsun. Kendi son üç denemene bakmak iyi bir başlangıç: yanlışların kaç farklı konuya dağılıyor? Çoğu öğrencide cevap 4–6 konudur. İyi haber şu — bu, kapatılabilir bir liste.

```grafik-karsilastirma```

## Neden fark ediyor

Bildiğin konudan soru çözdüğünde beynin "biliyorum" sinyali alır ve çalışma keyifli geçer. Bilmediğin konuya girdiğinde ise yavaşlarsın, hata yaparsın, moral bozulur. Bu yüzden herkes farkında olmadan kolay tarafa kayar. Ama net, kolay tarafta değil, kapattığın deliklerde birikir.

## 1 haftalık kırılma planı

Bu hafta yeni konu yok, hız denemesi yok. Tek iş: en çok net kaybettiren **tek bir konuyu** kapatmak. Köklü sayılar diyelim.

1. **Pzt–Sal:** Konu anlatımını bitir, o konudan çıkmış soruların tamamını çöz (yaklaşık 25 soru). Çözemediklerini işaretlemek, çözüme hemen bakmamak daha çok işe yarıyor.
2. **Çar–Cum:** Kaynağından günde 30 soru. Her yanlışın yanına tek cümlelik bir "neden" düşmek faydalı: *kuralı unuttum*, *işlem hatası*, *soruyu yanlış okudum*.
3. **Cmt:** Sadece bu konudan 20 soruluk mini deneme. 16+ doğruysa konu kapandı.

Cumartesi testinden 16''nın altı mı geldi? Sorun değil — pazar günü yanlışların "neden" cümlelerini okuyup aynı tip 10 soru daha çözmek genelde yetiyor. Konu kapanmadan yenisine geçmemek daha sağlıklı; yarım kapanan konu, kapanmamış konu sayılıyor.

## "Neden" cümlesi neden önemli

Yanlışlar sadece işaretlenirse elde bir liste kalıyor. "Neden" de yazılırsa elde bir **desen** oluşuyor. Üç hafta sonra o cümleleri alt alta okuduğunda çoğunlukla tek bir şey görürsün: ya belirli bir kural, ya belirli bir soru tipi, ya da acele. Üçünün de çözümü farklıdır ve ancak deseni gördükten sonra doğru çözümü seçebilirsin.

> Net, çözdüğün soru sayısından değil, kapattığın konu sayısından gelir.

## Sonraki hafta ne olacak?

Aynı döngü, listendeki ikinci konuyla. 4–6 haftada delik listesi biter; ondan sonra soru çözümü gerçekten işe yaramaya başlar, çünkü artık pekiştirme yaparsın, telafi değil.

Bu arada beklentiyi doğru kurmakta fayda var: eksik kapama döneminde net 2–3 hafta yatay seyredebiliyor. Normaldir. Çünkü kapattığın konular henüz denemede yeterince çıkmadı. Üçüncü haftadan sonra eğri yukarı döner.

Hangi konunun "en çok kaybettiren" olduğundan emin değilsen deneme analizinden başla: [sınav sonrası 20 dakikalık yöntem](/blog/deneme-analizi-20-dakika) yazısında adım adım anlattık.
' where slug = 'matematik-neti-neden-artmiyor';

update public.posts set icerik = 'Deneme bitti, optik önünde duruyor. Buradan sonra çoğu öğrenci iki hatadan birini yapar: ya sadece nete bakıp kağıdı kaldırır, ya da bütün soruları baştan çözmeye kalkar. İkisi de aynı yere çıkar — bir sonraki denemede aynı yanlışlar.

Oysa denemenin asıl değeri netinde değil, **yanlışlarının cinsinde**.

## Yanlış tek çeşit değil

Yanlışları üç kutuya ayırmak işi kolaylaştırıyor:

- **K — Bilmiyordum.** Konu eksiği. Soruyu görsen de olmaz, kural yok.
- **D — Biliyordum, dikkat.** Kuralı biliyorsun ama soruyu yanlış okudun, işlemi kaydırdın, "hangisi değildir"i atladın.
- **S — Süre yetmedi.** Boş bıraktığın ya da son dakikada işaretlediğin sorular.

Bu üçünün ilacı bambaşkadır. K''ye çalışma, D''ye protokol, S''ye strateji gerekir. Hepsine "daha çok soru çözeyim" demek, üç farklı hastalığa aynı ilacı vermektir.

## 20 dakikalık protokol

Denemeyi bitirdiğin gün, en geç ertesi gün yapmak en verimlisi. Kronometreyle şöyle ilerleyebilirsin:

1. **0–5. dakika — etiketle.** Yanlış ve boşlar listelenir; her birinin yanına sadece K, D veya S yazılır. Bu aşamada soru çözülmez, yalnızca etiketlenir.
2. **5–15. dakika — yalnız K''ler.** Çözümle başlamamak önemli: önce konu açılır, kural bir kez tekrar edilir, soru çözüme bakılmadan yeniden denenir. Yine olmuyorsa çözüme bakılır.
3. **15–20. dakika — say ve karar ver.** K, D, S sayıları yazılır. Bu üç sayı bir sonraki haftanın planını belirliyor.

Yirmi dakika kısa geliyorsa haklısın: bu bir çözüm seansı değil, bir teşhis seansı. Tedavi hafta içine yayılır.

## Sayılar sana ne söylüyor

- **K ağır basıyorsa:** sorun bilgi. Haftanın ana konusu, en çok K çıkan başlık olur.
- **D ağır basıyorsa:** sorun okuma ve kontrol. Soru kökünün altını çizerek okumak ve işlemi tek satır yerine iki satırda yazmak çoğu zaman yetiyor.
- **S ağır basıyorsa:** sorun tur stratejisi. İlk turda takılan soruda 90 saniyeden fazla kalmamak işe yarıyor: işaretleyip geçmek, ikinci turda dönmek.

D''lerin toplam yanlışının üçte birinden fazlaysa, önündeki problem konu değil sınav yönetimidir — ve bu, konu çalışmaktan çok daha hızlı düzelir.

> Deneme bir not karnesi değil, teşhis aracıdır. Karne gibi bakarsan sadece üzülürsün.

## Analizi kalıcı yap

Etiketlerini bir yere yazmazsan üçüncü denemede deseni göremezsin. Panelde çözdüğün soruların doğru/yanlış/boş sayısını konu bazında girdiğinde bu iş kendiliğinden birikiyor: hangi konuda kaç soru çözdüğün, netinin nasıl değiştiği ve koçunun bir sonraki görüşmede neye bakacağı hazır oluyor.

Üç deneme sonra elinde şu olur: en çok net kaybettiren 4–6 konuluk bir liste. O liste, çalışma planının kendisidir.
' where slug = 'deneme-analizi-20-dakika';

update public.posts set icerik = 'Son 100 gün kulağa az geliyor ama aslında **14 tam hafta** demek. Bu haftaları gün gün doldurmaya çalışırsan üçüncü haftada plan çöker. Hafta hafta düşünürsen sonuna kadar taşır.

## Önce sınavın şeklini hatırla

LGS iki oturumdan oluşur: sözel bölüm (Türkçe, T.C. İnkılap Tarihi, Din Kültürü, Yabancı Dil) ve sayısal bölüm (Matematik, Fen Bilimleri). Toplam 90 soru. Puanlamada **3 yanlış 1 doğruyu götürür** — yani rastgele işaretlemek YKS''dekinden daha pahalıdır.

Bu iki cümlenin plana yansıması şu: sözel ve sayısal aynı çalışma değildir, aynı haftaya eşit dağıtılmaları da gerekmez.

## Haftanın iskeleti

Her hafta üç parçadan kurulur:

1. **1 ana konu.** Haftanın sahibi bu konudur. Konu anlatımı, çıkmış sorular ve kaynak soruları hep buna gider.
2. **1 tekrar bloğu.** Geçmiş haftalardan bir konu geri gelir. Yeni öğrenmezsin, sadece soru çözersin.
3. **1 deneme veya branş denemesi.** Hafta sonu, sınav saatinde.

Üçünü de yapabildiğin bir hafta, dört konuya başlayıp hiçbirini bitiremediğin haftadan iyidir.

## Sözel ve sayısalı ayrı düşün

Sayısal tarafta (Matematik, Fen) konular birbirinin üstüne biner: çarpanlar bilinmeden cebirsel ifadeler, basınç bilinmeden kaldırma kuvveti tam oturmaz. Bu yüzden sayısalda **sıra** önemlidir; atlayarak ilerlenmez.

Sözel tarafta ise konular daha bağımsızdır. İnkılap''ta bir üniteyi atlaman diğerini bozmaz. Buradaki asıl kazanç tekrar sıklığında: az ama sık.

Pratik sonuç — sayısalı hafta içine yay, sözeli kısa ve sık bloklara böl.

## Son 2 hafta

Doksan günün son on dört gününde yeni konu açılmaz. Bu iki hafta şuna ayrılır:

- Denemelerde en çok yanlış yaptığın 5 konunun çıkmış soruları
- Her gün bir branş denemesi, sınav saatinde
- Uyku düzeninin sınav saatine çekilmesi

Son hafta net artırmak için değil, elindekini kaybetmemek içindir.

> Panik, plan olmayan yerde büyür. Takvim varsa geri sayım korkutucu olmaktan çıkar, sadece bilgi olur.

## Yanlış yapmaktan korkma, boş bırakmaktan da

3 yanlış 1 doğruyu götürüyor diye her şüpheli soruyu boş bırakmak da net kaybettirir. Kural basit: iki seçenek elenebiliyorsa işaretlemek, hiçbiri elenemiyorsa geçmek. Bu ayrım denemede prova edilmezse sınavda karar vermek zorlaşıyor.

## Takibi görünür tut

100 günün en büyük riski, üçüncü haftada "ne kadar ilerledim?" sorusuna cevap verememektir. Panelde konu listesi işaretlendikçe geri sayımın yanında tamamlanma oranın da büyür — ve haftalık koç görüşmesinde konuşulacak şey netleşir: neyi bitirdin, nerede takıldın, gelecek hafta hangi konu.
' where slug = 'lgs-son-100-gun';

update public.posts set icerik = 'Paragraf, TYT Türkçe''nin en kalabalık başlığıdır — 40 sorunun yaklaşık yarısı buradan gelir. Ve çoğu öğrencinin *bildiği halde* en çok zaman kaybettiği yer de burasıdır.

İyi haber: paragrafta hız, konu çalışarak değil **alışkanlık değiştirerek** kazanılır. Üç tanesi yeterli.

## 1. Soruyu önce oku

Metne dalmadan önce soru kökünü okumak işi kolaylaştırıyor. "Bu parçadan çıkarılamaz" ile "parçanın ana düşüncesi" tamamen farklı iki okuma ister. Soruyu bilerek okuduğunda metni tararsın; bilmeden okuduğunda ezberlemeye çalışırsın.

Tek istisna: birden fazla soruya kaynaklık eden uzun metinlerde önce metin, sonra sorular.

## 2. Seçeneklere erken dönme

En pahalı alışkanlık bu: metnin yarısında seçeneklere göz atmak, kalan yarıyı o seçenekleri doğrulamak için okumana sebep olur — buna doğrulama yanlılığı denir ve seni yanlış şıkka bağlar.

Kural: metin bitmeden seçenek okunmaz.

## 3. Kanıt cümlesini işaretle

Cevabı bulduğunu düşündüğün anda, metinde bunu söyleyen cümlenin altını çizmek iyi bir kontrol. Çizilemiyorsa cevap metinde değil, kafanda demek — ve paragraf sorularında kafandaki cevap genellikle yanlıştır.

Bu alışkanlık ilk hafta seni yavaşlatır, ikinci haftadan sonra hızlandırır: artık "acaba mı?" diye geri dönmezsin.

## 8 dakika nereden geliyor?

Aritmetiği basit. TYT Türkçe''de paragraftan 20 soru geldiğini varsayalım. Yukarıdaki üç alışkanlık soru başına ortalama 25 saniye kazandırırsa:

> 20 soru × 25 saniye ≈ 8 dakika

Sekiz dakika, TYT''de matematikte takıldığın 4–5 soruya dönmek için yeterli süredir. Yani paragrafta kazandığın zamanın karşılığını çoğu zaman başka derste alırsın.

## Nasıl çalışılır

1. **İlk hafta:** günde 10 paragraf, süre tutmadan, yalnızca üç alışkanlıkla. Amaç doğruluk.
2. **İkinci hafta:** günde 10 paragraf, her birine 90 saniye. Süre dolunca işaretleyip geçmek gerekiyor.
3. **Üçüncü hafta:** 20 soruluk blok, toplam 25 dakika. Artık ölçüm yapıyorsun.

Üçüncü haftanın sonunda hem doğru sayın hem süren elinde olur. Panelde bu blokları konu bazında girersen, ilerlemeyi tahminle değil veriyle konuşursun.

## Beklenti ayarı

Paragrafta hız üç haftada oturur, üç günde değil. İlk günlerde daha yavaş olman normaldir — eski alışkanlığı bırakmak, yenisini kurmaktan daha uzun sürer.
' where slug = 'paragrafta-hiz';

update public.posts set icerik = 'Bir konuyu bitirdiğin gün her şey yerli yerindedir. Üç hafta sonra aynı sorunun karşısında "bunu yapmıştım" dersin ama yapamazsın. Suç sende değil — unutmak beynin arızası değil, varsayılan ayarı.

Ebbinghaus''un 19. yüzyılda tarif ettiği **unutma eğrisi** şunu söyler: yeni öğrenilen bilgi ilk günlerde hızla, sonra yavaşlayarak kaybolur. Ama her tekrar eğriyi yeniden yukarı çeker ve bir sonraki düşüşü yavaşlatır.

Yani mesele daha çok çalışmak değil, **doğru zamanda** geri dönmek.

## 1 – 3 – 7 kuralı

Bir konu bittiğinde üç randevu almak yetiyor:

- **1 gün sonra:** 10 soru. Kural hatırlanıyor mu?
- **3 gün sonra:** 10 soru. Farklı tipten seç.
- **1 hafta sonra:** 10 soru + o konudan bir çıkmış soru bloğu.

Otuz soru, üç oturuma yayılmış. Aynı otuz soruyu konuyu bitirdiğin gün üst üste çözmenden kat kat verimlidir — çünkü zorlanmadan hatırlamak tekrar sayılmaz.

## 10 dakikalık kurulum

Bu sistemi kurmak, uygulamaktan kolay:

1. **Konu biter bitmez 3 satır not.** Kuralın kendisi, en sık yapılan hata, bir örnek soru numarası. Uzun özet işe yaramıyor — üç satırı geçince tekrar edilmiyor.
2. **Takvime üç hatırlatma.** 1 gün, 3 gün, 7 gün sonrası. Saat fark etmiyor, gün önemli.
3. **Tekrar gününde önce not, sonra soru.** Notu okumak 30 saniye sürüyor; sorular 10 dakika.

Hepsi bu. Kurulum on dakika, getirisi haftalar.

> Unutma eğrisiyle savaşmak yerine onu takvime bağlamak daha kolay.

## Neden çoğu öğrenci yapmıyor?

Çünkü tekrar, yeni konu çalışmak kadar tatmin edici değildir. Yeni konu "ilerliyorum" hissi verir, tekrar ise "yerimde sayıyorum" hissi. Oysa denemedeki net, yeni konularından değil, **hatırlayabildiğin** konularından gelir.

Haftalık planında bu yüzden her zaman bir tekrar bloğu bulunur: hafta yeni konuyla açılır, geçmiş bir konuyla dengelenir.

## Panelde nasıl görünür

Tekrarın da bir izi olmalı, yoksa yaptığını unutursun. Konuyu tekrar ettiğin gün çözdüğün 10 soru da normal soru girişi gibi giriliyor. Böylece konu ilerleme çubuğu yalnızca ilk öğrenmede değil, tekrar ettikçe de dolar — ve koçun hangi konuya ne zaman döndüğünü görür.
' where slug = 'aralikli-tekrar';

update public.posts set icerik = 'Raftaki üç kitabın da ilk 40 sayfası dolu, gerisi bomboş. Tanıdık geldiyse yalnız değilsin: kaynak değiştirmek, çalışmanın en kolay ve en işe yaramaz biçimidir. Çünkü yeni kitabın ilk bölümleri hep kolaydır ve "ilerliyorum" hissi verir.

## Bir kaynağın işi bitmez, sen bırakırsın

Soru kaynakları birbirinden sanıldığı kadar farklı değildir. Aynı konudan, aynı kazanımdan, benzer zorlukta sorular sorarlar. Üç kaynağın ilk yarısını bitirmek, tek kaynağın tamamını bitirmekten daha az şey öğretir — üstelik daha çok zaman alır.

Asıl fark kaynakta değil, **kaç tur döndüğünde**.

## Üç tur, üç farklı iş

Aynı kitabı üç kez dönmek, aynı şeyi üç kez yapmak değildir:

1. **Birinci tur — öğrenme.** Süre tutmadan. Takıldığında konuya dön. Yanlışlarını işaretle, çözümü not al. Burada amaç doğruluk.
2. **İkinci tur — hız.** Sadece birinci turda yanlış yaptıkların. Bu sefer süre tut. Amaç, bildiğini daha kısa sürede yapabilmek.
3. **Üçüncü tur — hata avı.** İki turda da yanlış yaptıkların. Bunlar senin gerçek eksiklerin; sayıları azdır ve netini en çok bunlar yiyordur.

Üçüncü tura kalan soru sayısı genelde başlangıçtakinin onda biri kadardır. O liste, sınavdan önceki son iki haftanın çalışma programıdır.

## Peki hangi kaynak?

Seçerken üç şey yeterli, gerisi pazarlama:

- **Konu sırası müfredatla uyumlu mu?** Kitabın sırası okulun ve planının sırasıyla çakışıyorsa her hafta arama yaparsın.
- **Çözümleri açıklıyor mu, sadece cevap mı veriyor?** Cevap anahtarı öğretmez.
- **Zorluk kademeli mi?** İlk sorusu son sorusu kadar zor olan kitap, öğrenme değil eleme yapar.

Bu üçü tuttuysa kitap yeterlidir. Dördüncü kriter aramak, yeni kitap almak için bahane aramaktır.

> Üç kaynağı bitirmiş görünmek mi, bir kaynağı üç tur dönmek mi? İkincisi daha az havalı, daha çok net.

## İstisna: çıkmış sorular

Tek bir kaynağın yerine geçmeyen şey çıkmış sorulardır. Onlar kaynak değil, **ölçü**. Bir konu bitti sanıldığında o konunun çıkmış soruları çözülür; sınavın o konudan ne istediği ancak orada görülüyor. Panelde her konunun altında çıkmış soru bağlantısı ve o konudan ortalama kaç soru geldiği yazar — hangi konuya ne kadar yükleneceğine bakarken bu iki bilgi kaynak seçiminden daha çok işine yarar.
' where slug = 'kaynak-secimi';

update public.posts set icerik = 'Sınav yılında en zor rol çoğu zaman velinin rolüdür. Çocuğunuzun kaygısını görüyorsunuz ama içine giremiyorsunuz; yardım etmek istiyorsunuz ama her sorunuz baskı gibi duyuluyor. Aradaki çizgi ince — ve genellikle **tek bir soruda** kayboluyor.

## "Bugün kaç soru çözdün?"

Bu sorunun iyi niyetle sorulduğunu biliyoruz. Ama çocuğun kulağında şöyle yankılanır: *senden bir rakam bekliyorum ve o rakam yetersizse bu konuşma kötü bitecek.*

Sonuç genelde ikisinden biri olur: ya sayı şişirilir, ya konuşma kısa kesilir. Her iki durumda da bilgi almazsınız, sadece mesafe koyarsınız.

Bir de şu var: soru sayısı, ilerlemenin kötü bir ölçüsüdür. Kolay konudan 80 soru çözen bir öğrenci, zor bir konuyu kapatmak için 20 soruyla boğuşan öğrenciden daha az yol almış olabilir.

## Yerine sorulabilecek üç soru

1. **"Bu hafta hangi konudasın?"** — Rakam değil, içerik sorar. Cevabı vermek kolaydır ve konuşmayı açar.
2. **"Nerede takıldın?"** — Zorlanmayı normalleştirir. "Takılmak" kelimesi başarısızlık değil, süreç ifade eder.
3. **"Sana nasıl yardımcı olabilirim?"** — Kontrolü çocuğa bırakır. Çoğu zaman cevap "hiçbir şey" olur; bazen "beni saat 7''de kaldırır mısın" olur. İkisi de iyidir.

Bu üç soru haftada bir kez sorulduğunda işe yarar; her akşam sorulduğunda yine sorguya döner.

> Süreci takip etmek başka, süreci yönetmeye çalışmak başka. İkincisi çoğunlukla ters teper.

## Netin yatay gittiği haftalar normaldir

Bilmeniz gereken en faydalı şey belki de bu: eksik kapama döneminde net 2–3 hafta yerinde sayabilir, hatta bir miktar düşebilir. Çünkü öğrenci o dönemde bildiği konulardan değil, bilmediği konulardan soru çözmektedir.

O haftalarda "geriledin mi?" demek, çocuğu tam da doğru şeyi yaparken cezalandırmaktır. Koçunuz bu dönemleri önceden söyler; panelde de görürsünüz.

## Veli paneli ne gösterir, ne göstermez

Sistemimizde veli paneli bilinçli olarak **salt-okunurdur** ve sınırlıdır:

- Haftalık planın tamamlanma oranı
- Deneme netlerinin gelişimi
- Sonraki görüşmenin tarihi
- Koçun **paylaşmayı seçtiği** haftalık özet

Koçun her notu velinin ekranına düşmez. Öğrencinin koçuyla arasında kalması gereken şeyler vardır ve o güveni korumak, uzun vadede velinin de işine yarar. Detay seviyesini koç belirler.

## Evdeki en iyi destek

Uzun listeler yerine üç şey yetiyor:

- **Uyku düzeni.** Sınav saatine göre kurulmuş bir uyku, iki saat fazladan çalışmadan daha değerlidir.
- **Sessiz bir saat.** Çalışma saatinde evin ritminin ona göre yavaşlaması, "çalış" demekten etkilidir.
- **Sonuç sormadığınız bir gün.** Özellikle deneme günü akşamı. Net konuşulacaksa ertesi gün konuşulur.

Gerisi koçun işi. Sizin işiniz, sınav yılını evin tek gündemi olmaktan çıkarmak.
' where slug = 'sinav-yilinda-veli-olmak';


-- TYT Türkçe'de soru dağılımı gerçeğe çekildi (toplam 40).
update public.topics t set question_avg = v.ort
from (values
  ('Sözcükte Anlam', 4.0), ('Cümlede Anlam', 4.0), ('Paragrafta Anlam', 20.0),
  ('Ses Bilgisi', 1.0), ('Yazım Kuralları', 2.0), ('Noktalama İşaretleri', 2.0),
  ('Sözcük Türleri', 2.0), ('Cümlenin Ögeleri', 2.0), ('Fiilimsiler', 1.0),
  ('Anlatım Bozukluğu', 2.0)
) as v(ad, ort)
where t.ad = v.ad
  and t.subject_id in (
    select sub.id from public.subjects sub
    join public.exam_sessions ses on ses.id = sub.session_id
    where ses.kod = 'tyt' and sub.ad = 'Türkçe'
  );
