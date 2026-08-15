import { Link } from 'react-router-dom';
import { MARKA } from '@/config/site';

/** Yuvarlatılmış kare içinde pusula iğnesi. Tek renkte de çalışır. */
export function LogoIsareti({ boyut = 34, radius = 11 }: { boyut?: number; radius?: number }) {
  return (
    <span
      style={{
        width: boyut,
        height: boyut,
        borderRadius: radius,
        background: 'var(--color-primary)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flex: 'none',
      }}
      aria-hidden="true"
    >
      <svg
        width={Math.round(boyut * 0.59)}
        height={Math.round(boyut * 0.59)}
        viewBox="0 0 24 24"
        fill="none"
        stroke="var(--color-on-primary)"
        strokeWidth="2"
      >
        <circle cx="12" cy="12" r="10" />
        <polygon
          points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88"
          fill="var(--color-on-primary)"
          stroke="none"
        />
      </svg>
    </span>
  );
}

/**
 * Marka kilidi: işaret + "Rehber" + altında "Eğitim & Sınav Koçu".
 * `altBaslik` verilirse alt satır onunla değişir (panellerde rol adı için).
 */
export function Logo({
  to = '/',
  altBaslik,
  boyut = 34,
  altSatirGoster = true,
}: {
  to?: string;
  altBaslik?: string;
  boyut?: number;
  altSatirGoster?: boolean;
}) {
  const alt = altBaslik ?? MARKA.altAd;

  return (
    <Link
      to={to}
      className="marka-bag"
      style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--color-text)' }}
      aria-label={`${MARKA.tamAd} — ana sayfa`}
    >
      <LogoIsareti boyut={boyut} radius={Math.round(boyut * 0.32)} />
      <span style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.05 }}>
        <span
          style={{
            fontFamily: 'var(--font-heading)',
            fontWeight: 700,
            fontSize: boyut >= 34 ? '1.15rem' : '1rem',
          }}
        >
          {MARKA.ad}
        </span>
        {altSatirGoster && (
          <span
            className="marka-alt"
            style={{
              fontFamily: 'var(--font-heading)',
              fontWeight: 500,
              fontSize: boyut >= 34 ? '.66rem' : '.6rem',
              letterSpacing: '.04em',
              color: 'var(--color-text-muted)',
              marginTop: 2,
            }}
          >
            {alt}
          </span>
        )}
      </span>
    </Link>
  );
}
