import { ArrowRight, CalendarCheck, Check, ListChecks, Sparkles, SquarePen } from 'lucide-react';
import { SiteSayfasi } from '@/components/layout/SiteKabugu';
import { Akordeon } from '@/components/ui/Akordeon';
import { ButonLink, Chip, Kart, Nokta, Rozet } from '@/components/ui/temel';
import { DERS_RENKLERI, MARKA, PAKETLER, SEMINERLER } from '@/config/site';
import { sayi } from '@/lib/format';

const ADIMLAR = [
  {
    no: '01',
    baslik: 'Ücretsiz görüşmeyle başlıyoruz',
    ikon: <SquarePen size={20} />,
    zemin: 'var(--color-primary-soft)',
    renk: 'var(--color-primary)',
    metin:
      '20 dakikalık görüşmede sistemi tanıtıyor, hedefini ve haftalık ritmini konuşuyoruz. Devam etmeye karar verirsen hesabını biz açıyoruz: kullanıcı adın ve şifren sana iletiliyor, uğraşman gereken bir kayıt adımı olmuyor.',
    detay: ['Kart bilgisi istemez', 'Aynı gün dönüş', 'Hesabı biz açar, bilgilerini sana veririz'],
  },
  {
    no: '02',
    baslik: 'Haftada bir koç görüşmesi',
    ikon: <CalendarCheck size={20} />,
    zemin: DERS_RENKLERI.fen,
    renk: 'var(--on-pastel)',
    metin:
      'Haftanın sabit bir gününde koçunla birebir görüşürsün. Geçen haftayı birlikte okur, nerede tıkandığını konuşur ve gelecek haftanın konularını belirlersiniz. Görüşme bitince yeni plan panele işlenmiş olur.',
    detay: [
      'Görüntülü, 30 dakika, sabit gün ve saat',
      'Geçen haftanın netleri ve eksikleri birlikte gözden geçirilir',
      'Yeni haftanın konuları panele işlenir',
    ],
  },
  {
    no: '03',
    baslik: 'Aradaki 6 gün sistem üzerinden',
    ikon: <ListChecks size={20} />,
    zemin: DERS_RENKLERI.sosyal,
    renk: 'var(--on-pastel)',
    metin:
      'Görüşme haftada bir; takip her gün. Panelde o günün konusu yazar, bitirince işaretlersin. Çözdüğün soruların doğru/yanlış/boş sayısını girersin, net otomatik hesaplanır. Koçun bu girişleri anlık görür — bir sonraki görüşmeye ikiniz de hazır gelirsiniz.',
    detay: [
      'Bugünün konusu ve saat çizelgesi',
      'Konu bazlı doğru/yanlış/boş girişi, net = D − Y/4',
      'Müfredat ağacında “~kaç soru çıkıyor” ve çıkmış sorular',
      'Koç ve veli ilerlemeyi kendi panellerinden izler',
    ],
  },
];

const HAFTA = [
  { gun: 'Pazartesi', metin: 'Koç görüşmesi. Hafta planı panele düşer.', vurgu: true },
  { gun: 'Salı — Cuma', metin: 'Günün konusu, soru girişi, eksik kapama.', vurgu: false },
  { gun: 'Cumartesi', metin: 'Deneme ya da haftanın konularından mini test.', vurgu: false },
  { gun: 'Pazar', metin: 'Yanlış analizi; koç raporu veliye açılır.', vurgu: false },
];

const SSS = [
  {
    soru: 'İlk görüşme gerçekten ücretsiz mi?',
    cevap:
      'Evet. 20 dakikalık görüşmede sistemi gösteriyor, hedefini konuşuyor ve bir haftalık örnek plan çıkarıyoruz. Devam etmek isteyip istemediğine tamamen sen karar veriyorsun; kart bilgisi istemiyoruz.',
  },
  {
    soru: 'Nasıl hesap açılıyor?',
    cevap:
      'Sitede kayıt formu yok. Görüşmeden sonra kaydını biz oluşturuyoruz; kullanıcı adın ve şifren sana iletiliyor. İlk girişte şifreni değiştirebilirsin.',
  },
  {
    soru: 'Koçla sadece haftada bir mi görüşüyorum?',
    cevap:
      'Birebir görüşme haftada bir. Ama takip her gün: planı panelden görür, konuyu işaretler, çözdüğün soruları girersin. Koçun bunları anlık görüyor, gerekirse görüşmeyi beklemeden planı güncelliyor.',
  },
  {
    soru: 'Net Denge sıralama garantisi veriyor mu?',
    cevap:
      'Hayır. Net Denge, hedefine ulaşmak için ders başına gereken netleri geçen yılın yerleştirme verisiyle tahmin eder. Sonuç her zaman “tahmini” etiketiyle gösterilir — kimse sıralama garantisi veremez.',
  },
  {
    soru: 'Veli neleri görüyor?',
    cevap:
      'Veli paneli salt-okunurdur: haftalık planın tamamlanma oranı, net gelişimi ve sonraki görüşme. Koçun notu ve detaylı ilerleme yalnızca koç “veliyle paylaş” dediğinde görünür.',
  },
  {
    soru: 'Koçumla uyum sağlayamazsam?',
    cevap: 'İlk ay içinde tek bir mesajla koç değişimi yapıyoruz; sürecin baştan kurulması için ek ücret almıyoruz.',
  },
  {
    soru: 'LGS için de var mı?',
    cevap: 'Evet. LGS ve YKS (TYT/AYT) için ayrı müfredat ağaçları, ayrı geri sayım ve ayrı plan şablonları var.',
  },
];

export default function NasilCalisir() {
  return (
    <SiteSayfasi>
      <section className="bg-kareli-gradient">
        <div className="container" style={{ padding: '112px 0 64px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="kicker">Nasıl çalışır</div>
          <h1 style={{ fontSize: 'clamp(2rem,4.6vw,2.9rem)', fontWeight: 700, maxWidth: '20ch' }}>
            Haftada bir görüşme, her gün takip.
          </h1>
          <p style={{ fontSize: '1.125rem', color: 'var(--color-text-muted)', maxWidth: '58ch', lineHeight: 1.6 }}>
            {MARKA.tamAd} iki parçadan oluşuyor: haftada bir yapılan birebir koç görüşmesi ve aradaki günlerde
            sistem üzerinden yürüyen konu–soru takibi. Ne çalışılacağını koçunla birlikte belirliyorsunuz; aradaki günlerde çalıştıklarını panele
            giriyorsun.
          </p>
          <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap', marginTop: 8 }}>
            <ButonLink to="/basvuru" tip="primary" boy="lg">
              Ücretsiz ilk görüşmeyi ayarlayalım <ArrowRight size={18} />
            </ButonLink>
            <span className="hint">20 dakika · kart bilgisi istemez</span>
          </div>
        </div>
      </section>

      {/* ---------- Üç adım ---------- */}
      <section style={{ padding: '72px 0 40px' }}>
        <div className="container" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {ADIMLAR.map((a) => (
            <Kart
              key={a.no}
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))',
                gap: 24,
                alignItems: 'center',
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 14,
                      background: a.zemin,
                      color: a.renk,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {a.ikon}
                  </span>
                  <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, color: 'var(--color-text-muted)' }}>
                    {a.no}
                  </span>
                </div>
                <h2 style={{ fontSize: '1.4rem' }}>{a.baslik}</h2>
                <p style={{ color: 'var(--color-text-muted)', lineHeight: 1.65, maxWidth: '52ch' }}>{a.metin}</p>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {a.detay.map((d) => (
                  <div key={d} className="satir" style={{ gap: 10 }}>
                    <Check size={16} strokeWidth={2.5} color="var(--color-success)" style={{ flex: 'none' }} />
                    <span style={{ fontSize: '.92rem' }}>{d}</span>
                  </div>
                ))}
              </div>
            </Kart>
          ))}
        </div>
      </section>

      {/* ---------- Bir hafta nasıl geçiyor ---------- */}
      <section style={{ padding: '0 0 88px' }}>
        <div className="container" style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
          <div style={{ maxWidth: '56ch' }}>
            <div className="kicker">Bir hafta</div>
            <h2 style={{ fontSize: 'clamp(1.6rem,3vw,2.1rem)', marginTop: 8 }}>Ritim böyle kuruluyor</h2>
            <p className="el-yazi" style={{ color: 'var(--color-text-muted)', marginTop: 10 }}>
              Görüşme günü sabittir; gerisi senin temponla akar. Aşağıdaki örnek pazartesi görüşen bir öğrenciye ait.
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 20 }}>
            {HAFTA.map((h) => (
              <Kart
                key={h.gun}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 10,
                  ...(h.vurgu ? { background: 'var(--color-primary-soft)' } : {}),
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Nokta renk={h.vurgu ? 'var(--color-primary)' : 'var(--color-accent)'} />
                  <strong style={{ fontFamily: 'var(--font-heading)', fontSize: '.95rem' }}>{h.gun}</strong>
                </div>
                <p style={{ fontSize: '.92rem', lineHeight: 1.55, color: 'var(--color-text-muted)' }}>{h.metin}</p>
              </Kart>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- Paketler ---------- */}
      <section id="paketler" style={{ padding: '0 0 88px' }}>
        <div className="container" style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
          <div style={{ maxWidth: '58ch' }}>
            <div className="kicker">Paketler</div>
            <h2 style={{ fontSize: 'clamp(1.6rem,3vw,2.1rem)', marginTop: 8 }}>
              İkisinde de aynı sistem var; fark görüşme sıklığında
            </h2>
            <p style={{ color: 'var(--color-text-muted)', marginTop: 8, lineHeight: 1.65 }}>
              Panel, haftalık ders programı, konu–soru takibi ve Net Denge iki pakette de aynı. Sıkı takipte hafta
              ortasında bir kontrol noktası daha oluyor: tempo düştüğünde haftayı beklemeden toparlıyoruz. Aylık
              devam edebilir ya da bugünden sınav gününe tek ödemeyle bağlanabilirsin.
            </p>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))',
              gap: 24,
              maxWidth: 760,
            }}
          >
            {PAKETLER.map((p) => (
              <Kart
                key={p.kod}
                etkilesimli
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 14,
                  ...(p.onerilen ? { boxShadow: 'var(--shadow-lift)', outline: '2px solid var(--color-primary)' } : {}),
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                  <h3 style={{ fontSize: '1.15rem' }}>{p.ad}</h3>
                  <Rozet>haftada {p.haftalikGorusme} görüşme</Rozet>
                  {p.onerilen && (
                    <Rozet ton="primary" style={{ marginLeft: 'auto' }}>
                      Önerilen
                    </Rozet>
                  )}
                </div>

                <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                  <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '1.9rem' }}>
                    {sayi(p.aylikUcret)} ₺
                  </span>
                  <span className="hint">/ ay</span>
                </div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'baseline',
                    gap: 6,
                    borderTop: '1px dashed var(--color-border)',
                    paddingTop: 12,
                  }}
                >
                  <span className="hint">Sınava kadar:</span>
                  <strong style={{ fontFamily: 'var(--font-heading)', fontSize: '1.15rem' }}>
                    {sayi(p.sinavaKadarUcret)} ₺
                  </strong>
                  <span className="hint">tek ödeme</span>
                </div>

                <p className="hint" style={{ lineHeight: 1.55, minHeight: '3.2em' }}>
                  {p.vurgu}
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {p.ozellikler.map((o) => (
                    <div key={o} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', fontSize: '.92rem' }}>
                      <Check size={15} strokeWidth={2.5} color="var(--color-success)" style={{ flex: 'none', marginTop: 3 }} />
                      {o}
                    </div>
                  ))}
                </div>

                <ButonLink to="/basvuru" tip={p.onerilen ? 'primary' : 'outline'} style={{ marginTop: 'auto' }}>
                  Ücretsiz görüşme ayarlayalım
                </ButonLink>
              </Kart>
            ))}
          </div>

          <p className="hint">
            Fiyatlara KDV dahildir. İlk görüşme ücretsizdir; ödeme ancak devam etmeye karar verdikten sonra alınır.
          </p>
        </div>
      </section>

      {/* ---------- Seminerler ---------- */}
      <section id="seminerler" style={{ padding: '0 0 88px' }}>
        <div className="container">
          <Kart
            style={{
              background: 'var(--gradient-hero)',
              padding: 'clamp(28px,4vw,48px)',
              display: 'flex',
              flexDirection: 'column',
              gap: 28,
            }}
          >
            <div style={{ maxWidth: '60ch', display: 'flex', flexDirection: 'column', gap: 12 }}>
              <Chip style={{ alignSelf: 'flex-start', background: 'var(--color-surface)' }}>
                <Sparkles size={14} /> Pakete dahil
              </Chip>
              <h2 style={{ fontSize: 'clamp(1.5rem,3vw,2rem)' }}>
                Sınav yılı yalnız konu çalışmaktan ibaret değil
              </h2>
              <p style={{ color: 'var(--color-text-muted)', lineHeight: 1.65 }}>
                Uzman psikolojik danışmanlarımızın verdiği seminerlere iki pakette de{' '}
                <strong style={{ color: 'var(--color-text)' }}>ücretsiz katılıyorsun</strong>. Çevrimiçi yapılıyor,
                kaydı sonradan da izleyebiliyorsun — bir semineri kaçırmak sorun değil.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(230px,1fr))', gap: 18 }}>
              {SEMINERLER.map((s) => (
                <div
                  key={s.baslik}
                  style={{
                    background: 'var(--color-surface)',
                    borderRadius: 'var(--radius-card)',
                    padding: '18px 20px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 8,
                  }}
                >
                  <strong style={{ fontFamily: 'var(--font-heading)', fontSize: '.98rem' }}>{s.baslik}</strong>
                  <p className="hint" style={{ lineHeight: 1.55 }}>
                    {s.metin}
                  </p>
                </div>
              ))}
            </div>
          </Kart>
        </div>
      </section>

      {/* ---------- SSS ---------- */}
      <section id="sss" style={{ padding: '0 0 88px' }}>
        <div className="container" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div>
            <div className="kicker">Sık sorulanlar</div>
            <h2 style={{ fontSize: 'clamp(1.6rem,3vw,2.1rem)', marginTop: 8 }}>Merak edilenler</h2>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {SSS.map((s) => (
              <Akordeon
                key={s.soru}
                ozet={<span style={{ fontFamily: 'var(--font-heading)', fontWeight: 600 }}>{s.soru}</span>}
              >
                <div style={{ borderTop: '1px solid var(--color-border)', padding: '16px 24px' }}>
                  <p style={{ lineHeight: 1.65, color: 'var(--color-text-muted)', maxWidth: '70ch' }}>{s.cevap}</p>
                </div>
              </Akordeon>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- Hakkımızda + CTA ---------- */}
      <section id="hakkimizda" style={{ padding: '0 0 96px' }}>
        <div className="container">
          <Kart
            style={{
              background: 'var(--gradient-hero)',
              boxShadow: 'var(--shadow-lift)',
              padding: 'clamp(32px,6vw,64px)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 20,
              textAlign: 'center',
            }}
          >
            <Chip>Hakkımızda</Chip>
            <h2 style={{ fontSize: 'clamp(1.7rem,3.4vw,2.2rem)', maxWidth: '26ch' }}>
              Sınav koçluğunu tahminden çıkarıp veriye bağlamak için kurduk.
            </h2>
            <p style={{ color: 'var(--color-text-muted)', maxWidth: '52ch', lineHeight: 1.65 }}>
              Öğretmen ve koçlardan oluşan küçük bir ekibiz. Kimseye sıralama garantisi vermiyoruz; verdiğimiz tek söz
              şu: her hafta ne çalışacağını bilerek başlıyor olacaksın.
            </p>
            <ButonLink to="/basvuru" tip="primary" boy="lg">
              Ücretsiz ilk görüşmeyi ayarlayalım
            </ButonLink>
          </Kart>
        </div>
      </section>
    </SiteSayfasi>
  );
}
