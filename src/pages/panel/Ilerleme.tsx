import { useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Alan, Buton, Kart, Nokta, Rozet } from '@/components/ui/temel';
import { DersDonutu, SoruNetGrafigi } from '@/components/grafik';
import { goreliZaman, net as netBicim, netHesapla, yuzde } from '@/lib/format';
import { useOturum } from '@/auth/Oturum';
import {
  dersDagilimi,
  girisEkle,
  girisler,
  haftalikSeri,
  konuIlerlemesiArtir,
  mufredat,
  oturumlar,
} from '@/data/repo';

export default function Ilerleme() {
  const { profil } = useOturum();
  const ogrenciId = profil?.id ?? '';
  const qc = useQueryClient();

  const seri = useQuery({ queryKey: ['haftalik-seri', ogrenciId], queryFn: () => haftalikSeri(ogrenciId) });
  const dagilim = useQuery({ queryKey: ['ders-dagilimi', ogrenciId], queryFn: () => dersDagilimi(ogrenciId) });
  const sonGirisler = useQuery({ queryKey: ['girisler', ogrenciId], queryFn: () => girisler(ogrenciId, 10) });

  const oturumSorgu = useQuery({ queryKey: ['oturumlar'], queryFn: oturumlar });
  const oturumId = oturumSorgu.data?.[0]?.id ?? '';
  const dersler = useQuery({
    queryKey: ['mufredat', oturumId, ogrenciId],
    queryFn: () => mufredat(oturumId, ogrenciId),
    enabled: Boolean(oturumId),
  });

  const konular = useMemo(
    () => (dersler.data ?? []).flatMap((d) => d.konular.map((k) => ({ id: k.id, ad: k.ad }))),
    [dersler.data],
  );

  const [konuId, setKonuId] = useState('');
  const [dogru, setDogru] = useState('');
  const [yanlis, setYanlis] = useState('');
  const [bos, setBos] = useState('');
  const [kaydediliyor, setKaydediliyor] = useState(false);

  const secili = konuId || konular[0]?.id || '';
  const onizlemeNet = netHesapla(parseInt(dogru) || 0, parseInt(yanlis) || 0);

  const kaydet = async () => {
    const d = parseInt(dogru) || 0;
    const y = parseInt(yanlis) || 0;
    const b = parseInt(bos) || 0;
    if (!d && !y && !b) return;

    setKaydediliyor(true);
    try {
      const konu = konular.find((k) => k.id === secili);
      await girisEkle(ogrenciId, {
        konuId: secili || null,
        konuAdi: konu?.ad ?? 'Konu',
        dogru: d,
        yanlis: y,
        bos: b,
      });
      if (secili) await konuIlerlemesiArtir(ogrenciId, secili, d + y + b);
      setDogru('');
      setYanlis('');
      setBos('');
      await qc.invalidateQueries();
    } finally {
      setKaydediliyor(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: 24 }}>
        <Kart style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
            <h3 style={{ fontSize: '1.05rem' }}>Haftalık soru & net</h3>
            <span className="hint" style={{ marginLeft: 'auto' }}>
              son 8 hafta
            </span>
          </div>
          {seri.data && <SoruNetGrafigi seri={seri.data} />}
          <div style={{ display: 'flex', gap: 16, fontSize: '.78rem', color: 'var(--color-text-muted)' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 10, height: 10, borderRadius: 3, background: 'var(--color-primary-soft-2)' }} />
              Çözülen soru
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--color-accent)' }} />
              Ortalama net
            </span>
          </div>
        </Kart>

        <Kart style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <h3 style={{ fontSize: '1.05rem' }}>Ders dağılımı</h3>
          <div style={{ display: 'flex', gap: 20, alignItems: 'center', flexWrap: 'wrap' }}>
            {dagilim.data && dagilim.data.length > 0 ? (
              <>
                <DersDonutu dagilim={dagilim.data} />
                <div style={{ flex: 1, minWidth: 140, display: 'flex', flexDirection: 'column', gap: 8, fontSize: '.85rem' }}>
                  {dagilim.data.map((d) => (
                    <div key={d.ad} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ width: 10, height: 10, borderRadius: 3, background: d.renk }} />
                      {d.ad}
                      <span className="hint" style={{ marginLeft: 'auto' }}>
                        {yuzde(d.oran)}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p className="hint">Son 30 günde giriş yok. Soru girdikçe dağılım burada oluşur.</p>
            )}
          </div>
        </Kart>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: 24 }}>
        <Kart style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <h3 style={{ fontSize: '1.05rem' }}>Soru girişi</h3>
          <Alan etiket="Konu">
            <select className="input" value={secili} onChange={(e) => setKonuId(e.target.value)}>
              {konular.map((k) => (
                <option key={k.id} value={k.id}>
                  {k.ad}
                </option>
              ))}
            </select>
          </Alan>
          <div style={{ display: 'flex', gap: 10 }}>
            <Alan etiket="Doğru" style={{ flex: 1 }}>
              <input
                className="input"
                type="number"
                min={0}
                inputMode="numeric"
                placeholder="0"
                value={dogru}
                onChange={(e) => setDogru(e.target.value)}
              />
            </Alan>
            <Alan etiket="Yanlış" style={{ flex: 1 }}>
              <input
                className="input"
                type="number"
                min={0}
                inputMode="numeric"
                placeholder="0"
                value={yanlis}
                onChange={(e) => setYanlis(e.target.value)}
              />
            </Alan>
            <Alan etiket="Boş" style={{ flex: 1 }}>
              <input
                className="input"
                type="number"
                min={0}
                inputMode="numeric"
                placeholder="0"
                value={bos}
                onChange={(e) => setBos(e.target.value)}
              />
            </Alan>
          </div>
          <Buton onClick={kaydet} disabled={kaydediliyor}>
            Girişi kaydet
          </Buton>
          <p className="hint">
            Net = doğru − yanlış/4{onizlemeNet ? ` → bu giriş ${netBicim(onizlemeNet)} net` : ''}. Giriş, konu
            ilerlemene ve grafiklere işlenir.
          </p>
        </Kart>

        <Kart style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <h3 style={{ fontSize: '1.05rem' }}>Son girişler</h3>
          {sonGirisler.data?.length ? (
            sonGirisler.data.map((g) => (
              <div
                key={g.id}
                className="satir"
                style={{ animation: 'riseIn .3s ease both' }}
              >
                <Nokta renk={g.renk} />
                <div>
                  <div style={{ fontSize: '.9rem', fontWeight: 600 }}>{g.konuAdi}</div>
                  <div className="hint" style={{ fontSize: '.75rem' }}>
                    {goreliZaman(g.tarih)}
                  </div>
                </div>
                <div
                  style={{
                    marginLeft: 'auto',
                    display: 'flex',
                    gap: 12,
                    fontSize: '.85rem',
                    fontVariantNumeric: 'tabular-nums',
                    alignItems: 'center',
                  }}
                >
                  <span style={{ color: 'var(--color-success-deep)' }}>{g.dogru}D</span>
                  <span style={{ color: 'var(--color-error-deep)' }}>{g.yanlis}Y</span>
                  <span className="hint">{g.bos}B</span>
                  <Rozet ton="primary">{netBicim(g.net)} net</Rozet>
                </div>
              </div>
            ))
          ) : (
            <p className="hint">Henüz giriş yok. İlk girişini soldaki formdan ekle.</p>
          )}
        </Kart>
      </div>
    </div>
  );
}
