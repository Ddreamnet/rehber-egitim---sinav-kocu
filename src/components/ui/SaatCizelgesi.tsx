/**
 * Activity timeline — yatay saat ekseni üzerinde ders renginde hap bloklar
 * ve kırmızı "şimdi" imleci. Eksen 09.00–17.00.
 */

export interface AkisBlogu {
  baslik: string;
  renk: string;
  /** "09:00" biçiminde */
  baslangic: string;
  bitis: string;
}

const BASLANGIC_SAATI = 9;
const BITIS_SAATI = 17;

export function SaatCizelgesi({ bloklar, simdi = new Date() }: { bloklar: AkisBlogu[]; simdi?: Date }) {
  const saatler = Array.from({ length: BITIS_SAATI - BASLANGIC_SAATI }, (_, i) => BASLANGIC_SAATI + i);
  const toplam = BITIS_SAATI - BASLANGIC_SAATI;

  const konum = (hhmm: string) => {
    const [s, d] = hhmm.split(':').map(Number);
    return ((s + d / 60 - BASLANGIC_SAATI) / toplam) * 100;
  };

  const simdiKonum = ((simdi.getHours() + simdi.getMinutes() / 60 - BASLANGIC_SAATI) / toplam) * 100;
  const simdiGoster = simdiKonum >= 0 && simdiKonum <= 100;

  if (!bloklar.length) {
    return <p className="hint">Bugün için planlanmış bir çalışma yok.</p>;
  }

  return (
    <>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${saatler.length},1fr)`,
          fontSize: '.72rem',
          color: 'var(--color-text-muted)',
        }}
      >
        {saatler.map((s) => (
          <span key={s}>{String(s).padStart(2, '0')}.00</span>
        ))}
      </div>

      <div style={{ position: 'relative', height: Math.max(158, bloklar.length * 50 + 8) }}>
        <div
          style={{ position: 'absolute', inset: 0, display: 'grid', gridTemplateColumns: `repeat(${saatler.length},1fr)` }}
          aria-hidden="true"
        >
          {saatler.map((s) => (
            <span key={s} style={{ borderLeft: '1px dashed var(--color-border)' }} />
          ))}
        </div>

        {simdiGoster && (
          <>
            <div
              style={{
                position: 'absolute',
                left: `${simdiKonum}%`,
                top: -4,
                bottom: 0,
                width: 2,
                background: 'var(--color-primary)',
              }}
              aria-hidden="true"
            />
            <div
              style={{
                position: 'absolute',
                left: `${simdiKonum}%`,
                top: -8,
                width: 10,
                height: 10,
                borderRadius: 3,
                background: 'var(--color-primary)',
                transform: 'translateX(-4px) rotate(45deg)',
              }}
              aria-hidden="true"
            />
          </>
        )}

        {bloklar.map((b, i) => (
          <div
            key={`${b.baslik}-${b.baslangic}`}
            style={{
              position: 'absolute',
              left: `${konum(b.baslangic)}%`,
              width: `${Math.max(12, konum(b.bitis) - konum(b.baslangic))}%`,
              top: 12 + i * 50,
              background: b.renk,
              color: 'var(--on-pastel)',
              borderRadius: 999,
              padding: '9px 16px',
              fontSize: '.82rem',
              fontWeight: 600,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
            title={`${b.baslangic}–${b.bitis} · ${b.baslik}`}
          >
            {b.baslik}
          </div>
        ))}
      </div>
    </>
  );
}
