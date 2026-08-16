import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { SiteSayfasi } from '@/components/layout/SiteKabugu';
import { BlogKarti, kategoriStili } from '@/components/BlogKarti';
import { Avatar, Chip, GorselYuvasi, Rozet } from '@/components/ui/temel';
import { tarihUzun } from '@/lib/format';
import { yazilar } from '@/data/repo';

export default function Blog() {
  const { data = [], isLoading } = useQuery({ queryKey: ['yazilar'], queryFn: yazilar });

  const oneCikan = data.find((y) => y.oneCikan) ?? data[0];
  const digerleri = data.filter((y) => y.id !== oneCikan?.id);

  return (
    <SiteSayfasi>
      <section>
        <div className="container" style={{ padding: '112px 0 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="kicker kicker-wide">Strateji · Planlama · Motivasyon</div>
          <h1 style={{ fontSize: 'clamp(2.2rem,5vw,3.2rem)', fontWeight: 700 }}>Blog</h1>
        </div>
      </section>

      <main className="container" style={{ display: 'flex', flexDirection: 'column', gap: 48, padding: '56px 0 96px' }}>
        {isLoading && <div className="iskelet" style={{ minHeight: 280 }} />}

        {oneCikan && (
          <Link
            to={`/blog/${oneCikan.slug}`}
            className="card card-interactive"
            style={{
              padding: 0,
              overflow: 'hidden',
              color: 'var(--color-text)',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))',
              boxShadow: 'var(--shadow-lift)',
            }}
          >
            <div style={{ minHeight: 280, position: 'relative' }}>
              <div style={{ position: 'absolute', inset: 0 }}>
                <GorselYuvasi aciklama="Kapak görseli" kaynak={oneCikan.kapakUrl} radius="0" />
              </div>
            </div>
            <div
              style={{
                padding: 'clamp(24px,4vw,48px)',
                display: 'flex',
                flexDirection: 'column',
                gap: 16,
                justifyContent: 'center',
              }}
            >
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <Chip renk={kategoriStili(oneCikan.kategori).chip} style={{ height: 26, fontSize: '.76rem' }}>
                  {oneCikan.kategori}
                </Chip>
                <Rozet>Öne çıkan</Rozet>
              </div>
              <h2 style={{ fontSize: 'clamp(1.5rem,2.6vw,2rem)', lineHeight: 1.25 }}>{oneCikan.baslik}</h2>
              <p style={{ color: 'var(--color-text-muted)', lineHeight: 1.65, maxWidth: '56ch' }}>{oneCikan.ozet}</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 4, flexWrap: 'wrap' }}>
                <Avatar ad={oneCikan.yazarAdi} renk="var(--ders-turkce)" boy="lg" />
                <span style={{ fontSize: '.88rem', fontWeight: 600 }}>{oneCikan.yazarAdi}</span>
                <span className="hint">
                  {oneCikan.yazarUnvani} · {oneCikan.okumaDk} dk okuma · {tarihUzun(oneCikan.yayinTarihi)}
                </span>
              </div>
            </div>
          </Link>
        )}

        <div className="grid-auto" style={{ gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))' }}>
          {digerleri.map((y) => (
            <BlogKarti key={y.id} yazi={y} />
          ))}
        </div>
      </main>
    </SiteSayfasi>
  );
}
