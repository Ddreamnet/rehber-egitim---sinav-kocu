import { ArrowRight, CalendarCheck, ListChecks, SquarePen } from 'lucide-react';
import { SiteSayfasi } from '@/components/layout/SiteKabugu';
import { SayacKarti } from '@/components/ui/Sayac';
import { NetDengeDeneme } from '@/components/NetDengeDeneme';
import { ButonLink, Chip, Kart } from '@/components/ui/temel';
import { DERS_RENKLERI } from '@/config/site';

export default function Landing() {
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
              <span style={{ color: 'var(--color-primary)' }}>YKS ve LGS</span> öğrencilerinin yol arkadaşıyız.{' '}
              <span className="el-yazi-buyuk">Doğru bir rehberle hedefe yolculuk.</span>
            </h1>

            <p style={{ fontSize: '1.125rem', lineHeight: 1.6, color: 'var(--color-text-muted)', maxWidth: '46ch' }}>
              Sana özel çalışma programı, birebir koçluk ve düzenli takip sistemiyle sınav sürecini birlikte
              yönetelim.
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

      {/* ---------- Nasıl çalışır (sade) ---------- */}
      <section id="nasil" style={{ padding: '80px 0 72px' }}>
        <div className="container" style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
          <div style={{ maxWidth: '56ch' }}>
            <div className="kicker">Nasıl çalışır</div>
          </div>
          <div className="grid-auto">
            <AdimKarti
              ikon={<SquarePen size={20} />}
              ikonZemin="var(--color-primary-soft)"
              ikonRenk="var(--color-primary)"
              baslik="Ücretsiz görüşme"
              metin="20 dakikada hedefini konuşuyoruz. Devam edersen hesabını biz açıyoruz."
            />
            <AdimKarti
              ikon={<CalendarCheck size={20} />}
              ikonZemin={DERS_RENKLERI.fen}
              ikonRenk="var(--on-pastel)"
              baslik="Haftalık koç görüşmesi"
              metin="Geçen haftayı birlikte değerlendirip yeni haftanın konularını belirliyorsunuz."
            />
            <AdimKarti
              ikon={<ListChecks size={20} />}
              ikonZemin={DERS_RENKLERI.sosyal}
              ikonRenk="var(--on-pastel)"
              baslik="Her gün takip"
              metin="Konuyu işaretliyor, çözdüğün soruları giriyorsun; koçun anlık görüyor."
            />
          </div>
          <ButonLink to="/nasil-calisir" tip="outline" style={{ alignSelf: 'flex-start' }}>
            Ayrıntılı anlatım <ArrowRight size={16} />
          </ButonLink>
        </div>
      </section>

      {/* ---------- Fark: Net Denge ---------- */}
      <section id="net-denge" style={{ padding: '24px 0 88px' }}>
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
              <strong style={{ color: 'var(--color-text)' }}>“tahmini”</strong> etiketiyle geliyor; kimseye sıralama garantisi vermiyoruz.
            </p>
            <p className="hint" style={{ lineHeight: 1.6 }}>
              Yandaki araç canlı: hedefini yaz, dersleri oynat. Hesap açmana gerek yok.
            </p>
          </div>

          <NetDengeDeneme />
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
              İlk görüşme ücretsiz: hedefini konuşuyor, bir haftalık örnek plan çıkarıyoruz. Devam etmek isteyip
              istemediğine sonra sen karar veriyorsun.
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
  ikon,
  ikonZemin,
  ikonRenk,
  baslik,
  metin,
}: {
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
      </div>
      <h3 style={{ fontSize: '1.2rem' }}>{baslik}</h3>
      <p style={{ color: 'var(--color-text-muted)', fontSize: '.95rem', lineHeight: 1.6 }}>{metin}</p>
    </Kart>
  );
}
