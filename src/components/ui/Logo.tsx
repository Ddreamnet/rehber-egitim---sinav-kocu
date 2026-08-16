import { Link } from 'react-router-dom';
import { MARKA } from '@/config/site';

/**
 * Marka işareti.
 *
 * Eski pusula iğnesi yerine kurumsal logo. Görselin beyaz zemini saydama
 * çevrildi; böylece krem sayfa zemininde de, beyaz kart üstünde de kutu
 * göstermeden oturuyor.
 */
export function LogoIsareti({ boyut = 34 }: { boyut?: number; radius?: number }) {
  return (
    <img
      src="/logo.png"
      alt=""
      width={boyut}
      height={boyut}
      decoding="async"
      style={{ width: boyut, height: boyut, objectFit: 'contain', flex: 'none', display: 'block' }}
      aria-hidden="true"
    />
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
      <LogoIsareti boyut={Math.round(boyut * 1.15)} />
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
