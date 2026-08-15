import type { CSSProperties } from 'react';
import { useGeriSayim } from '@/lib/geriSayim';
import { SINAVLAR, type SinavKodu } from '@/config/site';
import { Kart, Chip } from './temel';

/**
 * Çift geri sayım kartı (landing hero).
 * Sınava ≤30 gün kalınca gün kutusu amber'e döner — goal-gradient.
 */
export function SayacKarti({
  sinav,
  boy = 'buyuk',
  chipRenk,
  style,
  className,
}: {
  sinav: SinavKodu;
  boy?: 'buyuk' | 'kucuk';
  chipRenk?: string;
  style?: CSSProperties;
  className?: string;
}) {
  const tanim = SINAVLAR[sinav];
  const s = useGeriSayim(tanim.tarih);
  const buyuk = boy === 'buyuk';

  const kutu: CSSProperties = {
    flex: 1,
    background: 'var(--color-surface-2)',
    borderRadius: 12,
    padding: buyuk ? '10px 4px' : '8px 4px',
    textAlign: 'center',
  };
  const rakam: CSSProperties = {
    fontFamily: 'var(--font-heading)',
    fontWeight: 700,
    fontSize: buyuk ? '1.25rem' : '1.05rem',
    fontVariantNumeric: 'tabular-nums',
  };

  return (
    <Kart className={className} style={{ padding: buyuk ? '18px 20px' : '14px 16px', ...style }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: buyuk ? 12 : 10 }}>
        <Chip renk={chipRenk}>{`${tanim.ad} ${tanim.yil}`}</Chip>
        <span className="hint">{tanim.etiket}</span>
      </div>
      <div style={{ display: 'flex', gap: 6 }}>
        <div
          style={{
            ...kutu,
            flex: 1.25,
            background: s.acil ? 'var(--color-urgent-soft)' : 'var(--color-primary-soft)',
            transition: 'background .3s',
          }}
        >
          <div
            style={{
              ...rakam,
              fontSize: buyuk ? '1.7rem' : '1.35rem',
              color: s.acil ? 'var(--color-urgent-deep)' : 'var(--color-primary-active)',
            }}
          >
            {s.gun}
          </div>
          <div className="hint">gün</div>
        </div>
        <div style={kutu}>
          <div style={rakam}>{s.saat}</div>
          <div className="hint">saat</div>
        </div>
        <div style={kutu}>
          <div style={rakam}>{s.dakika}</div>
          <div className="hint">dk</div>
        </div>
        <div style={kutu}>
          <div style={{ ...rakam, color: 'var(--color-primary)' }}>{s.saniye}</div>
          <div className="hint">sn</div>
        </div>
      </div>
    </Kart>
  );
}

/** Panel genel bakıştaki kompakt sayaç kartı. */
export function KompaktSayac({ sinav, chipRenk }: { sinav: SinavKodu; chipRenk?: string }) {
  const tanim = SINAVLAR[sinav];
  const s = useGeriSayim(tanim.tarih);

  return (
    <Kart
      style={{
        flex: 1,
        minWidth: 150,
        padding: '16px 18px',
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
      }}
    >
      <Chip renk={chipRenk} style={{ alignSelf: 'flex-start', height: 24, fontSize: '.72rem' }}>
        {`${tanim.ad} ${tanim.yil}`}
      </Chip>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
        <span
          style={{
            fontFamily: 'var(--font-heading)',
            fontWeight: 700,
            fontSize: '2rem',
            fontVariantNumeric: 'tabular-nums',
            color: s.acil ? 'var(--color-urgent-deep)' : undefined,
          }}
        >
          {s.gun}
        </span>
        <span className="hint">gün</span>
      </div>
      <div className="hint" style={{ fontVariantNumeric: 'tabular-nums' }}>
        {s.saatDkSn} · {tanim.etiket.split(',')[0]}
      </div>
    </Kart>
  );
}

/** Yalnız gün sayısı (veli paneli başlığı, landing başlığı). */
export function GunSayisi({ sinav }: { sinav: SinavKodu }) {
  const s = useGeriSayim(SINAVLAR[sinav].tarih, 60000);
  return <>{s.gun}</>;
}
