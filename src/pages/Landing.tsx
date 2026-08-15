import { useQuery } from '@tanstack/react-query';
import { ArrowRight, CalendarCheck, ListChecks, Lock, SquarePen } from 'lucide-react';
import { Link } from 'react-router-dom';
import { SiteSayfasi } from '@/components/layout/SiteKabugu';
import { SayacKarti } from '@/components/ui/Sayac';
import { BlogKarti } from '@/components/BlogKarti';
import { ButonLink, Chip, Kart, Nokta, Rozet } from '@/components/ui/temel';
import { useGeriSayim } from '@/lib/geriSayim';
import { DERS_RENKLERI, SINAVLAR } from '@/config/site';
import { sayi } from '@/lib/format';
import { OGRENCI_SAYISI } from '@/data/demo';
import { yazilar } from '@/data/repo';

export default function Landing() {
  const yks = useGeriSayim(SINAVLAR.yks.tarih, 60000);
  const { data: yazilarListesi = [] } = useQuery({ queryKey: ['yazilar'], queryFn: yazilar });

  return (
    <SiteSayfasi>
      {/* ---------- Hero ---------- */}
      <section className="bg-kareli-gradient" style={{ overflow: 'hidden' }}>
        <div
          className="container"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit,minmax(320px,1fr))',
            gap: 48,
            alignItems: 'center',
            padding: '112px 0 88px',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24, animation: 'riseIn .6s ease both' }}>
            <Chip
              style={{
                alignSelf: 'flex-start',
                background: 'var(--color-surface)',
                boxShadow: 'var(--shadow-card)',
                color: 'var(--color-primary)',
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88" />
              </svg>
              YKS ve LGS için birebir koçluk
            </Chip>

            <h1
              style={{
                fontSize: 'clamp(2rem,4.6vw,3rem)',
                fontWeight: 700,
                lineHeight: 1.1,
                maxWidth: '17ch',
              }}
            >
              YKS’ye{' '}
              <span style={{ color: 'var(--color-primary)', whiteSpace: 'nowrap' }}>{yks.gun} gün</span>.{' '}
              <span className="el-yazi-buyuk">Doğru konuyla başlamak için doğru zaman.</span>
            </h1>

            <p style={{ fontSize: '1.125rem', lineHeight: 1.6, color: 'var(--color-text-muted)', maxWidth: '46ch' }}>
              Yanlış konuya harcanan hafta geri gelmiyor. Koçunla haftalık planını birlikte kuruyor, her hafta
              doğru yerden ilerliyorsun.
            </p>

            <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
              <ButonLink to="/basvuru" tip="primary" boy="lg">
                Ücretsiz ilk görüşmeyi ayarlayalım
                <ArrowRight size={18} />
              </ButonLink>
              <span className="hint">20 dakika · kart bilgisi istemez</span>
            </div>
          </div>

          <div style={{ position: 'relative', minHeight: 460 }}>
            <picture>
              <source srcSet="/hero.webp" type="image/webp" />
              <img
                src="/hero.png"
                alt="Bilgisayarında çalışan, çevrimiçi ders ve planlama ögeleriyle çevrili öğrenci illüstrasyonu"
                width={900}
                height={708}
                fetchPriority="high"
                decoding="async"
                style={{
                  width: '100%',
                  height: 'auto',
                  display: 'block',
                  /* Beyaz zeminli illüstrasyon krem zeminle kaynaşsın */
                  mixBlendMode: 'multiply',
                }}
              />
            </picture>
            <SayacKarti
              sinav="yks"
              boy="buyuk"
              style={{
                position: 'absolute',
                left: -20,
                bottom: -12,
                width: 'min(300px,76%)',
                animation: 'floatY 7s ease-in-out infinite',
                boxShadow: 'var(--shadow-lift)',
              }}
            />
            <SayacKarti
              sinav="lgs"
              boy="kucuk"
              chipRenk={DERS_RENKLERI.fen}
              className="hide-m"
              style={{
                position: 'absolute',
                right: -16,
                top: 0,
                width: 'min(240px,62%)',
                animation: 'floatY 8s ease-in-out 1.2s infinite',
              }}
            />
          </div>
        </div>
      </section>

      {/* ---------- Nasıl çalışır ---------- */}
      <section id="nasil" style={{ padding: '88px 0' }}>
        <div className="container" style={{ display: 'flex', flexDirection: 'column', gap: 40 }}>
          <div style={{ maxWidth: '56ch' }}>
            <div className="kicker">Nasıl çalışır</div>
            <h2 style={{ fontSize: 'clamp(1.6rem,3vw,2.1rem)', marginTop: 8 }}>Üç adım. Gerisi haftalık ritim.</h2>
          </div>
          <div className="grid-auto">
            <AdimKarti
              no="01"
              ikon={<SquarePen size={20} />}
              ikonZemin="var(--color-primary-soft)"
              ikonRenk="var(--color-primary)"
              baslik="Ücretsiz görüşmeyle başlıyoruz"
              metin="20 dakikalık görüşmede sistemi tanıtıyor, hedefini konuşuyoruz. Devam etmeye karar verirsen hesabını biz açıyoruz; kullanıcı adın ve şifren sana iletiliyor."
            />
            <AdimKarti
              no="02"
              ikon={<CalendarCheck size={20} />}
              ikonZemin={DERS_RENKLERI.fen}
              ikonRenk="var(--on-pastel)"
              baslik="Haftada bir koç görüşmesi"
              metin="Her hafta koçunla birebir oturursun: geçen haftayı değerlendirir, gelecek haftanın konularını birlikte belirlersiniz."
            />
            <AdimKarti
              no="03"
              ikon={<ListChecks size={20} />}
              ikonZemin={DERS_RENKLERI.sosyal}
              ikonRenk="var(--on-pastel)"
              baslik="Aradaki 6 gün sistemde"
              metin="Görüşme dışındaki günlerde plan panelde: konuyu işaretler, çözdüğün soruyu girersin. Koçun ilerlemeni anlık görür."
            />
          </div>
        </div>
      </section>

      {/* ---------- Fark: Net Denge ---------- */}
      <section style={{ padding: '24px 0 88px' }}>
        <div
          className="container"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit,minmax(320px,1fr))',
            gap: 48,
            alignItems: 'center',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div className="kicker">Fark: Net Denge</div>
            <h2 style={{ fontSize: 'clamp(1.6rem,3vw,2.1rem)', maxWidth: '20ch' }}>
              Hedefi sen belirliyorsun, gereken netleri sistem hesaplıyor.
            </h2>
            <p style={{ color: 'var(--color-text-muted)', lineHeight: 1.65, maxWidth: '52ch' }}>
              Hedef puanını ya da geçen yılın sıralamasını seçiyorsun; ders başına kaç net gerektiğini görüyorsun.
              Bir dersi kısınca sistem farkı diğer derslere dağıtıyor. Sonuç her zaman{' '}
              <strong style={{ color: 'var(--color-text)' }}>“tahmini”</strong> etiketiyle — garanti satmıyoruz.
            </p>
            <Link to="/panel/net-denge" style={{ fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              Panelde nasıl çalıştığına bakabilirsin <ArrowRight size={16} />
            </Link>
          </div>

          <Kart style={{ boxShadow: 'var(--shadow-lift)', display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 600, whiteSpace: 'nowrap' }}>
                Hedef: ilk 100.000
              </span>
              <Rozet ton="warning" style={{ marginLeft: 'auto' }}>
                tahmini
              </Rozet>
            </div>
            <OnizlemeSatiri renk={DERS_RENKLERI.turkce} ad="Türkçe" net={29} />
            <OnizlemeSatiri renk={DERS_RENKLERI.matematik} ad="Matematik" net={23} kilitli />
            <OnizlemeSatiri renk={DERS_RENKLERI.fen} ad="Fen" net={14} />
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                borderTop: '1.5px dashed var(--color-border)',
                paddingTop: 14,
                marginTop: 4,
                flexWrap: 'wrap',
              }}
            >
              <span className="hint">Gereken toplam:</span>
              <strong style={{ fontFamily: 'var(--font-heading)' }}>82 net</strong>
              <span className="hint" style={{ marginLeft: 'auto' }}>
                Fen’i kısarsan fark Türkçe’ye dağılır
              </span>
            </div>
          </Kart>
        </div>
      </section>

      {/* ---------- Sayısal kanıt ---------- */}
      <section style={{ padding: '0 0 88px' }}>
        <div className="container">
          <Kart
            style={{
              background: 'var(--gradient-hero)',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))',
              gap: 32,
              alignItems: 'center',
              padding: 'clamp(28px,4vw,48px)',
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div
                style={{
                  fontFamily: 'var(--font-heading)',
                  fontWeight: 700,
                  fontSize: 'clamp(2.4rem,4vw,3.2rem)',
                  color: 'var(--color-primary)',
                }}
              >
                {sayi(OGRENCI_SAYISI)}
              </div>
              <p className="el-yazi" style={{ maxWidth: '20ch', color: 'var(--color-text-muted)' }}>
                öğrenci bu dönem haftalık planıyla ilerliyor
              </p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                'Haftada 1 birebir koç görüşmesi',
                'Her gün konu ve soru takibi',
                'Koç başına en fazla 12 öğrenci',
              ].map((m) => (
                <div key={m} style={{ display: 'flex', gap: 10, alignItems: 'center', fontSize: '.95rem' }}>
                  <Nokta renk="var(--color-primary)" />
                  {m}
                </div>
              ))}
            </div>
          </Kart>
        </div>
      </section>

      {/* ---------- Blog ---------- */}
      <section style={{ padding: '0 0 88px' }}>
        <div className="container" style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 16, flexWrap: 'wrap' }}>
            <div>
              <div className="kicker">Blog</div>
              <h2 style={{ fontSize: 'clamp(1.6rem,3vw,2.1rem)', marginTop: 8 }}>Az ama işe yarayan yazılar</h2>
            </div>
            <Link to="/blog" style={{ marginLeft: 'auto', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              Tümü <ArrowRight size={16} />
            </Link>
          </div>
          <div className="grid-auto">
            {yazilarListesi.slice(0, 3).map((y) => (
              <BlogKarti key={y.id} yazi={y} ozetGoster={false} />
            ))}
          </div>
        </div>
      </section>

      {/* ---------- Kapanış CTA ---------- */}
      <section id="basvur" style={{ padding: '0 0 96px' }}>
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
            <h2 style={{ fontSize: 'clamp(1.7rem,3.4vw,2.4rem)', maxWidth: '22ch' }}>
              Planı biz kuruyoruz, sen çalışmaya odaklanıyorsun.
            </h2>
            <p style={{ color: 'var(--color-text-muted)', maxWidth: '44ch', lineHeight: 1.6 }}>
              İlk görüşme ücretsiz: hedefini konuşur, bir haftalık örnek plan çıkarırız. Devam edip etmemek sana
              kalmış.
            </p>
            <ButonLink to="/basvuru" tip="primary" boy="lg">
              Ücretsiz ilk görüşmeyi ayarlayalım
            </ButonLink>
            <span className="hint">Bu dönem kontenjanı: koç başına 12 öğrenci</span>
          </Kart>
        </div>
      </section>
    </SiteSayfasi>
  );
}

function AdimKarti({
  no,
  ikon,
  ikonZemin,
  ikonRenk,
  baslik,
  metin,
}: {
  no: string;
  ikon: React.ReactNode;
  ikonZemin: string;
  ikonRenk: string;
  baslik: string;
  metin: string;
}) {
  return (
    <Kart etkilesimli style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <span
          style={{
            width: 44,
            height: 44,
            borderRadius: 14,
            background: ikonZemin,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: ikonRenk,
          }}
        >
          {ikon}
        </span>
        <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, color: 'var(--color-text-muted)' }}>{no}</span>
      </div>
      <h3 style={{ fontSize: '1.2rem' }}>{baslik}</h3>
      <p style={{ color: 'var(--color-text-muted)', fontSize: '.95rem', lineHeight: 1.6 }}>{metin}</p>
    </Kart>
  );
}

function OnizlemeSatiri({ renk, ad, net, kilitli }: { renk: string; ad: string; net: number; kilitli?: boolean }) {
  return (
    <div className="satir">
      <Nokta renk={renk} />
      <span style={{ fontSize: '.9rem', fontWeight: 600 }}>{ad}</span>
      {kilitli && (
        <Rozet style={{ gap: 4 }}>
          <Lock size={11} /> sabit
        </Rozet>
      )}
      <span
        style={{
          marginLeft: 'auto',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        <span style={{ color: 'var(--color-text-muted)' }}>−</span>
        <strong style={{ fontFamily: 'var(--font-heading)' }}>{net}</strong>
        <span style={{ color: 'var(--color-text-muted)' }}>+</span>
      </span>
    </div>
  );
}
