import { useEffect, useMemo, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Info, Lock, Minus, Plus } from 'lucide-react';
import { Bar, Buton, Kart, Rozet, Segment, Uyari } from '@/components/ui/temel';
import { degistir, tahminiSiralama, toplamNet, VARSAYILAN_SIRALAMA_TABLOSU } from '@/lib/netDenge';
import { sayi } from '@/lib/format';
import { useOturum } from '@/auth/Oturum';
import { netHedefi, netHedefiKaydet, siralamaTablosu } from '@/data/repo';
import type { HedefTipi, NetHedefi } from '@/data/tipler';

export default function NetDenge() {
  const { profil } = useOturum();
  const ogrenciId = profil?.id ?? '';

  const sorgu = useQuery({ queryKey: ['net-hedefi', ogrenciId], queryFn: () => netHedefi(ogrenciId) });
  const tablo = useQuery({ queryKey: ['siralama-tablosu'], queryFn: () => siralamaTablosu('yks') });

  const [hedef, setHedef] = useState<NetHedefi | null>(null);
  const ilkYukleme = useRef(true);

  useEffect(() => {
    if (sorgu.data && !hedef) setHedef(structuredClone(sorgu.data));
  }, [sorgu.data, hedef]);

  // Değişiklikleri geciktirerek kaydet
  useEffect(() => {
    if (!hedef) return;
    if (ilkYukleme.current) {
      ilkYukleme.current = false;
      return;
    }
    const t = setTimeout(() => void netHedefiKaydet(hedef), 600);
    return () => clearTimeout(t);
  }, [hedef]);

  const maxlar = useMemo(
    () => Object.fromEntries((hedef?.dagilim ?? []).map((d) => [d.dersId, d.maxNet])),
    [hedef],
  );
  const netler = useMemo(
    () => Object.fromEntries((hedef?.dagilim ?? []).map((d) => [d.dersId, d.net])),
    [hedef],
  );
  const kilit = useMemo(
    () => Object.fromEntries((hedef?.dagilim ?? []).map((d) => [d.dersId, d.kilitli])),
    [hedef],
  );

  if (!hedef) {
    return <div className="iskelet" style={{ minHeight: 320 }} />;
  }

  const toplam = toplamNet(netler);
  const siralama = tahminiSiralama(toplam, tablo.data ?? VARSAYILAN_SIRALAMA_TABLOSU);

  const netDegistir = (dersId: string, delta: number) => {
    const yeni = degistir(netler, maxlar, kilit, dersId, delta);
    setHedef({ ...hedef, dagilim: hedef.dagilim.map((d) => ({ ...d, net: yeni[d.dersId] })) });
  };

  const kilitDegistir = (dersId: string) => {
    setHedef({
      ...hedef,
      dagilim: hedef.dagilim.map((d) => (d.dersId === dersId ? { ...d, kilitli: !d.kilitli } : d)),
    });
  };

  const tipDegistir = (tip: HedefTipi) => setHedef({ ...hedef, tip });

  const sifirla = () => {
    if (sorgu.data) setHedef(structuredClone(sorgu.data));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <Kart style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
          <div>
            <h3 style={{ fontSize: '1.05rem' }}>Hedefin</h3>
            <p className="hint" style={{ marginTop: 4 }}>
              Hedefi seç; ders başına gereken netleri sistem dağıtsın.
            </p>
          </div>
          <Segment
            etiket="Hedef tipi"
            style={{ marginLeft: 'auto' }}
            deger={hedef.tip}
            degistir={tipDegistir}
            secenekler={[
              { deger: 'puan', etiket: 'Hedef puan' },
              { deger: 'siralama', etiket: 'Hedef sıralama' },
            ]}
          />
          <HedefChipi hedef={hedef} degistir={setHedef} />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {hedef.dagilim.map((d) => (
            <div
              key={d.dersId}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                background: 'var(--color-bg)',
                borderRadius: 14,
                padding: '12px 16px',
                flexWrap: 'wrap',
              }}
            >
              <span className="dot" style={{ background: d.renk, width: 11, height: 11 }} aria-hidden="true" />
              <span style={{ fontWeight: 600, fontSize: '.92rem', width: 92 }}>{d.ad}</span>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Buton
                  tip="secondary"
                  style={{ width: 34, height: 34, padding: 0, borderRadius: 10 }}
                  disabled={d.kilitli}
                  onClick={() => netDegistir(d.dersId, -1)}
                  aria-label={`${d.ad} netini azalt`}
                >
                  <Minus size={14} strokeWidth={2.5} />
                </Buton>
                <span
                  style={{
                    fontFamily: 'var(--font-heading)',
                    fontWeight: 700,
                    fontSize: '1.15rem',
                    minWidth: 36,
                    textAlign: 'center',
                    fontVariantNumeric: 'tabular-nums',
                  }}
                  aria-live="polite"
                >
                  {d.net}
                </span>
                <Buton
                  tip="secondary"
                  style={{ width: 34, height: 34, padding: 0, borderRadius: 10 }}
                  disabled={d.kilitli}
                  onClick={() => netDegistir(d.dersId, 1)}
                  aria-label={`${d.ad} netini artır`}
                >
                  <Plus size={14} strokeWidth={2.5} />
                </Buton>
                <span className="hint">/ {d.maxNet}</span>
              </div>

              <Bar oran={d.maxNet ? d.net / d.maxNet : 0} renk={d.renk} className="hide-m" style={{ flex: 1, minWidth: 80 }} />

              <label className="badge kilit-etiketi" style={{ cursor: 'pointer', gap: 6, marginLeft: 'auto' }}>
                <input
                  type="checkbox"
                  checked={d.kilitli}
                  onChange={() => kilitDegistir(d.dersId)}
                />
                <Lock size={12} />
                sabitle
              </label>
            </div>
          ))}
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 20,
            borderTop: '1.5px dashed var(--color-border)',
            paddingTop: 18,
            flexWrap: 'wrap',
          }}
        >
          <div>
            <div className="hint">Gereken toplam</div>
            <div
              style={{
                fontFamily: 'var(--font-heading)',
                fontWeight: 700,
                fontSize: '1.5rem',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {toplam} net
            </div>
          </div>
          <div>
            <div className="hint">Tahmini sıralama</div>
            <div
              style={{
                fontFamily: 'var(--font-heading)',
                fontWeight: 700,
                fontSize: '1.5rem',
                color: 'var(--color-primary)',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              ~{sayi(siralama)}
            </div>
          </div>
          <Rozet ton="warning">tahmini — garanti değil</Rozet>
          <Buton tip="outline" boy="sm" style={{ marginLeft: 'auto' }} onClick={sifirla}>
            Dağılımı sıfırla
          </Buton>
        </div>
      </Kart>

      <Uyari tur="info" ikon={<Info size={18} style={{ flex: 'none' }} />} style={{ alignItems: 'center' }}>
        Bir dersi azaltınca fark, kilitsiz derslere dağıtılır; toplam hedef sabit kalır. Sıralama karşılığı geçen
        yılın yerleştirme verisine göre <strong>tahmindir</strong>.
      </Uyari>
    </div>
  );
}

/** Hedef değerini gösteren chip; tıklanınca satır içi düzenlemeye döner. */
function HedefChipi({ hedef, degistir }: { hedef: NetHedefi; degistir: (h: NetHedefi) => void }) {
  const [duzenle, setDuzenle] = useState(false);
  const puanMi = hedef.tip === 'puan';
  const deger = puanMi ? hedef.hedefPuan ?? 0 : hedef.hedefSiralama ?? 0;

  if (duzenle) {
    return (
      <input
        className="input"
        type="number"
        autoFocus
        style={{ width: 150, height: 34 }}
        defaultValue={deger}
        aria-label={puanMi ? 'Hedef puan' : 'Hedef sıralama'}
        onBlur={(e) => {
          const v = Number(e.target.value) || deger;
          degistir(puanMi ? { ...hedef, hedefPuan: v } : { ...hedef, hedefSiralama: v });
          setDuzenle(false);
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
          if (e.key === 'Escape') setDuzenle(false);
        }}
      />
    );
  }

  return (
    <button
      type="button"
      className="chip chip-hedef"
      style={{ fontSize: '.9rem', border: 'none', cursor: 'pointer' }}
      onClick={() => setDuzenle(true)}
      title="Hedefi değiştir"
    >
      {puanMi ? `Hedef: ${sayi(hedef.hedefPuan ?? 0)} puan` : `Hedef: ilk ${sayi(hedef.hedefSiralama ?? 0)}`}
    </button>
  );
}
