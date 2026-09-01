import { useEffect, useState } from 'react';
import type { CSSProperties } from 'react';
import { useGeriSayim } from '@/lib/geriSayim';
import { SINAVLAR, type SinavKodu } from '@/config/site';
import { Kart, Chip } from './temel';

/**
 * Takvim yaprağı gibi devrilen rakam.
 *
 * Değer değişince üst yarı öne devrilir, altından yeni değer açılır. Animasyon
 * `key` ile yeniden tetiklenir; `prefers-reduced-motion` açıksa CSS tarafında
 * devre dışı kalır.
 */
function Yaprak({ deger, etiket, vurgu, acil, buyuk }: {
  deger: string;
  etiket: string;
  vurgu?: boolean;
  acil?: boolean;
  buyuk?: boolean;
}) {
  const [durum, setDurum] = useState({ eski: deger, yeni: deger, sayac: 0 });

  useEffect(() => {
    setDurum((d) => (d.yeni === deger ? d : { eski: d.yeni, yeni: deger, sayac: d.sayac + 1 }));
  }, [deger]);

  const sinif = [
    'yaprak',
    buyuk ? 'yaprak-lg' : '',
    vurgu ? 'yaprak-vurgu' : '',
    acil ? 'yaprak-acil' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className="yaprak-kutu">
      {/* key: her değişimde animasyon baştan oynasın */}
      <div className={sinif} key={durum.sayac} aria-hidden="true">
        <div className="yuz ust">
          <span>{durum.yeni}</span>
        </div>
        <div className="yuz alt">
          <span>{durum.eski}</span>
        </div>
        {durum.sayac > 0 && (
          <>
            <div className="devrilen ust">
              <span>{durum.eski}</span>
            </div>
            <div className="devrilen alt">
              <span>{durum.yeni}</span>
            </div>
          </>
        )}
      </div>
      <div className="hint yaprak-etiket">{etiket}</div>
      <span className="gorsel-gizli">{`${deger} ${etiket}`}</span>
    </div>
  );
}

/**
 * Çift geri sayım kartı (landing hero).
 * Sınava ≤30 gün kalınca gün yaprağı amber'e döner — goal-gradient.
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

  // Ölçüler sınıflardan geliyor: dar ekranda sayaçlar yeniden boyutlanacağı için
  // satır içi padding CSS'i yenerdi.
  return (
    <Kart
      className={['sayac-kart', buyuk ? 'sayac-kart-lg' : 'sayac-kart-sm', className].filter(Boolean).join(' ')}
      style={style}
    >
      <div className="sayac-kart-bas">
        <Chip renk={chipRenk}>{`${tanim.ad} ${tanim.yil}`}</Chip>
        <span className="hint">{tanim.etiket}</span>
      </div>
      <div className="yaprak-satiri" role="timer" aria-label={`${tanim.ad} ${tanim.yil} geri sayımı`}>
        <Yaprak deger={String(s.gun)} etiket="gün" vurgu acil={s.acil} buyuk={buyuk} />
        <Yaprak deger={s.saat} etiket="saat" buyuk={buyuk} />
        <Yaprak deger={s.dakika} etiket="dk" buyuk={buyuk} />
        <Yaprak deger={s.saniye} etiket="sn" buyuk={buyuk} />
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
