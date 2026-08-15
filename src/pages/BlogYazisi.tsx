import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Line } from 'react-chartjs-2';
import { SiteSayfasi } from '@/components/layout/SiteKabugu';
import { Avatar, ButonLink, Kart, BosDurum } from '@/components/ui/temel';
import { BlogKapagi } from '@/components/BlogKarti';
import { Markdown } from '@/lib/markdown';
import { tarihUzun } from '@/lib/format';
import { tokenRengi } from '@/lib/renk';
import { yazi } from '@/data/repo';

export default function BlogYazisi() {
  const { slug = '' } = useParams();
  const { data, isLoading } = useQuery({ queryKey: ['yazi', slug], queryFn: () => yazi(slug) });

  if (isLoading) {
    return (
      <SiteSayfasi>
        <div className="container" style={{ padding: '104px 0' }}>
          <div className="iskelet" style={{ minHeight: 320 }} />
        </div>
      </SiteSayfasi>
    );
  }

  if (!data) {
    return (
      <SiteSayfasi>
        <div className="container" style={{ padding: '128px 0 96px' }}>
          <BosDurum baslik="Yazı bulunamadı" aciklama="Bu adreste bir yazı yok. Blog’a dönüp diğerlerine göz atabilirsin.">
            <ButonLink to="/blog" tip="outline" boy="sm">
              Blog’a dön
            </ButonLink>
          </BosDurum>
        </div>
      </SiteSayfasi>
    );
  }

  return (
    <SiteSayfasi>
      <main style={{ padding: '104px 0 96px' }}>
        <article
          className="article"
          style={{ width: 'min(720px,92vw)', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 28 }}
        >
          <Link
            to="/blog"
            className="bag-tumu"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '.88rem', fontWeight: 600, alignSelf: 'flex-start' }}
          >
            <ArrowLeft size={15} /> Blog
          </Link>

          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <span className="kicker" style={{ letterSpacing: '.16em' }}>
              {data.kategori}
            </span>
            <span className="hint" style={{ letterSpacing: '.06em' }}>
              · {data.okumaDk} dk okuma
            </span>
          </div>

          <h1 style={{ fontSize: 'clamp(2rem,5vw,2.9rem)', fontWeight: 700, lineHeight: 1.15 }}>{data.baslik}</h1>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Avatar ad={data.yazarAdi} renk="var(--ders-turkce)" boy="lg" />
            <div>
              <div style={{ fontWeight: 600, fontSize: '.92rem' }}>{data.yazarAdi}</div>
              <div className="hint">
                {data.yazarUnvani} · {tarihUzun(data.yayinTarihi)}
              </div>
            </div>
          </div>

          <div style={{ borderRadius: 'var(--radius-card)', overflow: 'hidden' }}>
            <BlogKapagi kategori={data.kategori} kapakUrl={data.kapakUrl} yukseklik={300} />
          </div>

          {data.icerik ? (
            <Markdown metin={data.icerik} ozelBloklar={{ 'grafik-karsilastirma': <KarsilastirmaFiguru /> }} />
          ) : (
            <p style={{ fontSize: '1.2rem', lineHeight: 1.7, color: 'var(--color-text-muted)' }}>{data.ozet}</p>
          )}

          <Kart
            style={{
              background: 'var(--gradient-hero)',
              display: 'flex',
              flexDirection: 'column',
              gap: 14,
              alignItems: 'flex-start',
              marginTop: 20,
            }}
          >
            <h3 style={{ fontSize: '1.25rem' }}>Delik listeni birlikte çıkaralım</h3>
            <p style={{ color: 'var(--color-text-muted)', lineHeight: 1.6 }}>
              İlk görüşme ücretsiz: son denemelerine bakıyor, sana özel bir eksik kapama sırası çıkarıyoruz.
            </p>
            <ButonLink to="/basvuru" tip="primary">
              Ücretsiz ilk görüşmeyi ayarlayalım
            </ButonLink>
          </Kart>
        </article>
      </main>
    </SiteSayfasi>
  );
}

/** ```grafik-karsilastirma``` bloğunun karşılığı: aynı öğrenci, iki farklı strateji. */
function KarsilastirmaFiguru() {
  const { data, options } = useMemo(() => {
    const izgara = tokenRengi('--color-border');
    const muted = tokenRengi('--color-text-muted');
    const primary = tokenRengi('--color-primary');
    const kenar = tokenRengi('--color-border');
    return {
      data: {
        labels: ['H1', 'H2', 'H3', 'H4', 'H5', 'H6'],
        datasets: [
          {
            label: 'Eksik kapama haftası',
            data: [12, 14, 18, 21, 25, 28],
            borderColor: primary,
            backgroundColor: primary,
            borderWidth: 3.5,
            pointRadius: 4.5,
            tension: 0.25,
          },
          {
            label: 'Rastgele soru çözümü',
            data: [12, 12.3, 11.9, 12.5, 12.2, 12.8],
            borderColor: kenar,
            backgroundColor: kenar,
            borderWidth: 3,
            pointRadius: 0,
            tension: 0.25,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { display: false }, border: { display: false }, ticks: { color: muted, font: { size: 12 } } },
          y: {
            grid: { color: izgara },
            border: { display: false, dash: [3, 5] },
            ticks: { color: muted, font: { size: 11 }, maxTicksLimit: 4 },
            title: { display: true, text: 'net', color: muted, font: { size: 11 } },
          },
        },
      } as any,
    };
  }, []);

  return (
    <figure style={{ margin: '12px 0 0', display: 'flex', flexDirection: 'column', gap: 12 }}>
      <Kart style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ fontSize: '.85rem', fontWeight: 600 }}>
          Aynı öğrenci, 6 hafta: rastgele çözüm vs. eksik kapama
        </div>
        <div style={{ height: 200 }}>
          <Line data={data} options={options} aria-label="Strateji karşılaştırması" />
        </div>
        <div style={{ display: 'flex', gap: 16, fontSize: '.78rem', color: 'var(--color-text-muted)', flexWrap: 'wrap' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 14, height: 3, borderRadius: 2, background: 'var(--color-primary)' }} />
            Eksik kapama haftası
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 14, height: 3, borderRadius: 2, background: 'var(--color-border)' }} />
            Rastgele soru çözümü
          </span>
        </div>
      </Kart>
      <figcaption className="hint" style={{ textAlign: 'center' }}>
        Temsili veri: aynı çalışma süresi, farklı seçim stratejisi.
      </figcaption>
    </figure>
  );
}
