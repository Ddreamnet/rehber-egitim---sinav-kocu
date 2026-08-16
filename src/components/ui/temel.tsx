/**
 * Bileşen kütüphanesi — tüm stiller design-tokens.css'teki sınıflardan gelir.
 * Burada hex/gölge/radius sabiti YOKTUR; değer değişecekse tokens.css'te değişir.
 */

import { cloneElement, isValidElement, useId } from 'react';
import { Link } from 'react-router-dom';
import type {
  AnchorHTMLAttributes,
  ButtonHTMLAttributes,
  CSSProperties,
  ReactElement,
  ReactNode,
} from 'react';

// ---------- Buton ----------

export type ButonTipi = 'primary' | 'secondary' | 'outline' | 'ghost' | 'accent';
export type ButonBoyu = 'sm' | 'default' | 'lg';

const butonSinifi = (tip: ButonTipi, boy: ButonBoyu, ek?: string) =>
  ['btn', `btn-${tip}`, boy !== 'default' ? `btn-${boy}` : '', ek].filter(Boolean).join(' ');

interface ButonOrtak {
  tip?: ButonTipi;
  boy?: ButonBoyu;
  children: ReactNode;
  className?: string;
}

export function Buton({
  tip = 'primary',
  boy = 'default',
  className,
  children,
  ...rest
}: ButonOrtak & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button type="button" className={butonSinifi(tip, boy, className)} {...rest}>
      {children}
    </button>
  );
}

export function ButonLink({
  tip = 'primary',
  boy = 'default',
  to,
  className,
  children,
  ...rest
}: ButonOrtak & { to: string } & Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'>) {
  const dis = /^(https?:|mailto:|tel:|#)/.test(to);
  if (dis) {
    return (
      <a href={to} className={butonSinifi(tip, boy, className)} {...rest}>
        {children}
      </a>
    );
  }
  return (
    <Link to={to} className={butonSinifi(tip, boy, className)} {...rest}>
      {children}
    </Link>
  );
}

// ---------- Kart ----------

export function Kart({
  etkilesimli,
  className,
  style,
  children,
  ...rest
}: {
  etkilesimli?: boolean;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
} & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={['card', etkilesimli ? 'card-interactive' : '', className].filter(Boolean).join(' ')}
      style={style}
      {...rest}
    >
      {children}
    </div>
  );
}

// ---------- Chip / rozet ----------

export function Chip({
  renk,
  className,
  style,
  children,
}: {
  /** Ders pasteli verilirse zemin o renk, metin --on-pastel olur */
  renk?: string;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
}) {
  return (
    <span
      className={['chip', className].filter(Boolean).join(' ')}
      style={renk ? { background: renk, color: 'var(--on-pastel)', ...style } : style}
    >
      {children}
    </span>
  );
}

export type RozetTonu = 'notr' | 'success' | 'warning' | 'error' | 'info' | 'primary';

const ROZET_TONU: Record<RozetTonu, CSSProperties> = {
  notr: {},
  success: { background: 'var(--color-success-soft)', color: 'var(--color-success-deep)' },
  warning: { background: 'var(--color-urgent-soft)', color: 'var(--color-urgent-deep)' },
  error: { background: 'var(--color-error-soft)', color: 'var(--color-error-deep)' },
  info: { background: 'var(--color-info-soft)', color: 'var(--color-info-deep)' },
  primary: { background: 'var(--color-primary-soft)', color: 'var(--color-primary-active)' },
};

export function Rozet({
  ton = 'notr',
  renk,
  className,
  style,
  children,
}: {
  ton?: RozetTonu;
  renk?: string;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
}) {
  return (
    <span
      className={['badge', className].filter(Boolean).join(' ')}
      style={
        renk
          ? { background: renk, color: 'var(--on-pastel)', ...style }
          : { ...ROZET_TONU[ton], ...style }
      }
    >
      {children}
    </span>
  );
}

// ---------- İlerleme çubuğu ----------

export function Bar({
  oran,
  renk,
  style,
  className,
}: {
  /** 0–1 arası */
  oran: number;
  renk?: string;
  style?: CSSProperties;
  className?: string;
}) {
  const yuzde = Math.round(Math.max(0, Math.min(1, oran)) * 100);
  return (
    <div
      className={['bar', className].filter(Boolean).join(' ')}
      style={style}
      role="progressbar"
      aria-valuenow={yuzde}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <span style={{ width: `${yuzde}%`, ...(renk ? { background: renk } : {}) }} />
    </div>
  );
}

// ---------- Halka (ring) ilerleme ----------

export function Halka({
  oran,
  boyut = 96,
  kalinlik = 10,
  renk = 'var(--color-primary)',
  etiket,
}: {
  oran: number;
  boyut?: number;
  kalinlik?: number;
  renk?: string;
  etiket?: ReactNode;
}) {
  const r = 40;
  const cevre = 2 * Math.PI * r; // 251.3
  const dolu = cevre * Math.max(0, Math.min(1, oran));
  return (
    <div style={{ position: 'relative', width: boyut, height: boyut, flex: 'none' }}>
      <svg width={boyut} height={boyut} viewBox="0 0 96 96" aria-hidden="true">
        <circle cx="48" cy="48" r={r} fill="none" stroke="var(--color-surface-2)" strokeWidth={kalinlik} />
        {/* Yuvarlak uç, sıfırda bile nokta bırakır — o yüzden hiç çizmiyoruz */}
        {dolu > 0 && (
          <circle
            cx="48"
            cy="48"
            r={r}
            fill="none"
            stroke={renk}
            strokeWidth={kalinlik}
            strokeLinecap="round"
            strokeDasharray={`${dolu.toFixed(1)} ${cevre.toFixed(1)}`}
            transform="rotate(-90 48 48)"
          />
        )}
      </svg>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'var(--font-heading)',
          fontWeight: 700,
          fontSize: boyut >= 96 ? '1.15rem' : '1rem',
        }}
      >
        {etiket ?? `%${Math.round(oran * 100)}`}
      </div>
    </div>
  );
}

// ---------- Uyarı ----------

export function Uyari({
  tur = 'info',
  ikon,
  children,
  style,
}: {
  tur?: 'info' | 'success' | 'warning' | 'error';
  ikon?: ReactNode;
  children: ReactNode;
  style?: CSSProperties;
}) {
  return (
    <div className={`alert alert-${tur}`} style={style} role={tur === 'error' ? 'alert' : 'status'}>
      {ikon}
      <span>{children}</span>
    </div>
  );
}

// ---------- Segment kontrol ----------

export function Segment<T extends string>({
  secenekler,
  deger,
  degistir,
  className,
  style,
  etiket,
}: {
  secenekler: Array<{ deger: T; etiket: string }>;
  deger: T;
  degistir: (d: T) => void;
  className?: string;
  style?: CSSProperties;
  etiket?: string;
}) {
  return (
    <div className={['seg', className].filter(Boolean).join(' ')} style={style} role="tablist" aria-label={etiket}>
      {secenekler.map((s) => (
        <button
          key={s.deger}
          type="button"
          role="tab"
          aria-selected={s.deger === deger}
          className={s.deger === deger ? 'on' : ''}
          onClick={() => degistir(s.deger)}
        >
          {s.etiket}
        </button>
      ))}
    </div>
  );
}

// ---------- Switch ----------

export function Anahtar({
  acik,
  degistir,
  etiket,
}: {
  acik: boolean;
  degistir: (a: boolean) => void;
  etiket: string;
}) {
  return (
    <span className="switch">
      <input
        type="checkbox"
        checked={acik}
        aria-label={etiket}
        onChange={(e) => degistir(e.target.checked)}
      />
      <span className="track" />
      <span className="thumb" />
    </span>
  );
}

// ---------- Form alanı ----------

/**
 * Etiket, kontrol ve yardım/hata metnini birbirine bağlar:
 * `label[for]` ↔ kontrol `id`, hata varsa `aria-invalid` + `aria-describedby`.
 */
export function Alan({
  etiket,
  ipucu,
  hata,
  id,
  children,
  style,
}: {
  etiket?: string;
  ipucu?: string;
  hata?: string;
  id?: string;
  children: ReactNode;
  style?: CSSProperties;
}) {
  const otoId = useId();
  const alanId = id ?? otoId;
  const yardimId = `${alanId}-yardim`;
  const yardim = hata ?? ipucu;

  const kontrol = isValidElement(children)
    ? cloneElement(children as ReactElement<Record<string, unknown>>, {
        id: (children.props as Record<string, unknown>).id ?? alanId,
        'aria-describedby': yardim ? yardimId : undefined,
        'aria-invalid': hata ? true : undefined,
      })
    : children;

  return (
    <div className="field" style={style}>
      {etiket && <label htmlFor={alanId}>{etiket}</label>}
      {kontrol}
      {yardim && (
        <span
          id={yardimId}
          className="hint"
          style={hata ? { color: 'var(--color-error-deep)' } : undefined}
        >
          {yardim}
        </span>
      )}
    </div>
  );
}

// ---------- Ders renk noktası ----------

export function Nokta({ renk, buyuk }: { renk: string; buyuk?: boolean }) {
  return <span className={buyuk ? 'dot dot-lg' : 'dot'} style={{ background: renk }} aria-hidden="true" />;
}

// ---------- Baş harf avatarı ----------

export function Avatar({
  ad,
  renk,
  foto,
  boy = 'md',
}: {
  ad: string;
  renk?: string | null;
  /** Profil fotoğrafı; yoksa baş harfler gösterilir */
  foto?: string | null;
  boy?: 'sm' | 'md' | 'lg' | 'xs';
}) {
  const sinif = boy === 'xs' ? 'avatar avatar-sm' : boy === 'lg' ? 'avatar avatar-lg' : boy === 'md' ? 'avatar' : 'avatar avatar-md';
  const harfler = ad
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0] ?? '')
    .join('')
    .toLocaleUpperCase('tr-TR');

  if (foto) {
    return (
      <span className={sinif} style={{ background: 'var(--color-surface-2)', padding: 0, overflow: 'hidden' }}>
        <img src={foto} alt="" loading="lazy" decoding="async" className="avatar-foto" />
      </span>
    );
  }

  return (
    <span className={sinif} style={{ background: renk ?? 'var(--color-primary-soft-2)' }} aria-hidden="true">
      {harfler}
    </span>
  );
}

// ---------- Boş durum ----------

export function BosDurum({ baslik, aciklama, children }: { baslik: string; aciklama?: string; children?: ReactNode }) {
  return (
    <div className="bos-durum">
      <strong style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-text)' }}>{baslik}</strong>
      {aciklama && <p style={{ maxWidth: '42ch', lineHeight: 1.55 }}>{aciklama}</p>}
      {children}
    </div>
  );
}

// ---------- Görsel yuvası ----------

export function GorselYuvasi({
  aciklama,
  kaynak,
  alt,
  radius = 'var(--radius-card)',
  style,
}: {
  aciklama: string;
  kaynak?: string | null;
  alt?: string;
  radius?: string;
  style?: CSSProperties;
}) {
  if (kaynak) {
    return (
      <div className="image-slot" style={{ borderRadius: radius, border: 'none', padding: 0, ...style }}>
        <img src={kaynak} alt={alt ?? ''} />
      </div>
    );
  }
  return (
    <div className="image-slot" style={{ borderRadius: radius, ...style }}>
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
        <rect x="3" y="3" width="18" height="18" rx="3" />
        <circle cx="8.5" cy="8.5" r="1.5" />
        <path d="m21 15-5-5L5 21" />
      </svg>
      <span>{aciklama}</span>
    </div>
  );
}
