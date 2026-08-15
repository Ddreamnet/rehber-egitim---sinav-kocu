import { Link, NavLink } from 'react-router-dom';
import type { ReactNode } from 'react';
import { Logo } from '@/components/ui/Logo';
import { ButonLink } from '@/components/ui/temel';
import { MARKA, SITE_NAV } from '@/config/site';
import { useOturum, rolAnasayfasi } from '@/auth/Oturum';

/** Herkese açık sayfaların sticky yarı saydam başlığı. */
export function SiteBasligi() {
  const { profil } = useOturum();

  return (
    <header className="nav">
      <div className="container" style={{ display: 'flex', alignItems: 'center', gap: 8, height: 64 }}>
        <Logo />
        <nav className="hide-m" style={{ display: 'flex', gap: 4, marginLeft: 24 }} aria-label="Ana menü">
          {SITE_NAV.map((n) => (
            <NavLink
              key={n.yol}
              to={n.yol}
              className={({ isActive }) => `btn btn-ghost btn-sm${isActive ? ' aktif' : ''}`}
              style={({ isActive }) =>
                isActive
                  ? { fontWeight: 600, color: 'var(--color-primary)', background: 'var(--color-primary-soft)' }
                  : { fontWeight: 600 }
              }
            >
              {n.etiket}
            </NavLink>
          ))}
        </nav>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
          {profil ? (
            <ButonLink tip="ghost" boy="sm" to={rolAnasayfasi(profil.rol)} className="hide-m">
              Panelim
            </ButonLink>
          ) : (
            <ButonLink tip="ghost" boy="sm" to="/giris" className="hide-m">
              Giriş
            </ButonLink>
          )}
          <ButonLink tip="primary" to="/basvuru">
            Başvuru
          </ButonLink>
        </div>
      </div>
    </header>
  );
}

/** 5 sütunlu footer (landing). */
export function SiteAltligi() {
  return (
    <footer style={{ borderTop: '1px solid var(--color-border)', background: 'var(--color-surface)' }}>
      <div
        className="container"
        style={{ padding: '48px 0 32px', display: 'flex', flexDirection: 'column', gap: 40 }}
      >
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 32 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <Logo boyut={28} />
            <p className="hint" style={{ maxWidth: '26ch', lineHeight: 1.55 }}>
              {MARKA.slogan}
            </p>
          </div>
          <FooterSutunu
            baslik="Ürün"
            baglantilar={[
              { etiket: 'Nasıl çalışır', yol: '/nasil-calisir' },
              { etiket: 'Net Denge', yol: '/panel/net-denge' },
              { etiket: 'Paketler', yol: '/nasil-calisir#paketler' },
            ]}
          />
          <FooterSutunu
            baslik="Kaynaklar"
            baglantilar={[
              { etiket: 'Blog', yol: '/blog' },
              { etiket: 'Sık sorulanlar', yol: '/nasil-calisir#sss' },
            ]}
          />
          <FooterSutunu
            baslik="Kurum"
            baglantilar={[
              { etiket: 'Hakkımızda', yol: '/nasil-calisir#hakkimizda' },
              { etiket: 'İletişim / Başvuru', yol: '/basvuru' },
              { etiket: 'Instagram', yol: MARKA.instagram },
            ]}
          />
          <FooterSutunu
            baslik="Yasal"
            baglantilar={[
              { etiket: 'Gizlilik', yol: '/gizlilik' },
              { etiket: 'KVKK aydınlatma', yol: '/kvkk' },
            ]}
          />
        </div>
        <div
          style={{
            display: 'flex',
            gap: 16,
            alignItems: 'center',
            borderTop: '1px solid var(--color-border)',
            paddingTop: 20,
            flexWrap: 'wrap',
          }}
        >
          <span className="hint">
            © {new Date().getFullYear()} {MARKA.tamAd}. Tahminler tahmindir; garanti satmayız.
          </span>
          <Link
            to="/styleguide"
            className="hint"
            style={{ marginLeft: 'auto', color: 'var(--color-text-muted)' }}
          >
            Tasarım sistemi
          </Link>
        </div>
      </div>
    </footer>
  );
}

function FooterSutunu({
  baslik,
  baglantilar,
}: {
  baslik: string;
  baglantilar: Array<{ etiket: string; yol: string }>;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: '.9rem' }}>
      <strong style={{ fontFamily: 'var(--font-heading)', fontSize: '.85rem' }}>{baslik}</strong>
      {baglantilar.map((b) =>
        b.yol.startsWith('http') ? (
          <a
            key={b.yol}
            href={b.yol}
            target="_blank"
            rel="noreferrer noopener"
            style={{ color: 'var(--color-text-muted)' }}
          >
            {b.etiket}
          </a>
        ) : (
          <Link key={b.yol + b.etiket} to={b.yol} style={{ color: 'var(--color-text-muted)' }}>
            {b.etiket}
          </Link>
        ),
      )}
    </div>
  );
}

/** Kareli zeminli herkese açık sayfa sarmalayıcısı. */
export function SiteSayfasi({ children, altlik = true }: { children: ReactNode; altlik?: boolean }) {
  return (
    <div className="bg-kareli" style={{ minHeight: '100vh', color: 'var(--color-text)' }}>
      <a className="skip-link" href="#icerik">
        İçeriğe atla
      </a>
      <SiteBasligi />
      <div id="icerik">{children}</div>
      {altlik && <SiteAltligi />}
    </div>
  );
}
