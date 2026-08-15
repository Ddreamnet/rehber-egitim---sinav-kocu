import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Bar, Kart, Rozet } from '@/components/ui/temel';
import { BuyumeGrafigi } from '@/components/grafik';
import { degisim, sayi, yuzde } from '@/lib/format';
import { adminMetrikleri, koclar, ogrenciBuyumesi, tumOgrenciler } from '@/data/repo';

const DURUM_ETIKET: Record<string, { etiket: string; ton: 'success' | 'warning' | 'error' | 'info' }> = {
  yolunda: { etiket: 'Yolunda', ton: 'success' },
  gecikti: { etiket: 'Plan gecikti', ton: 'warning' },
  riskli: { etiket: 'Riskli', ton: 'error' },
  yeni: { etiket: 'Yeni', ton: 'info' },
};

export default function AdminRaporlar() {
  const metrik = useQuery({ queryKey: ['admin-metrikleri'], queryFn: adminMetrikleri });
  const buyume = useQuery({ queryKey: ['ogrenci-buyumesi'], queryFn: ogrenciBuyumesi });
  const kocListesi = useQuery({ queryKey: ['koclar'], queryFn: koclar });
  const ogrenciler = useQuery({ queryKey: ['tum-ogrenciler'], queryFn: tumOgrenciler });

  const dagilim = useMemo(() => {
    const liste = ogrenciler.data ?? [];
    const sayac = new Map<string, number>();
    for (const o of liste) sayac.set(o.durum, (sayac.get(o.durum) ?? 0) + 1);
    return [...sayac.entries()].map(([durum, adet]) => ({
      durum,
      adet,
      oran: liste.length ? adet / liste.length : 0,
    }));
  }, [ogrenciler.data]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(320px,1fr))', gap: 24 }}>
        <Kart style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
            <h3 style={{ fontSize: '1.05rem' }}>Öğrenci büyümesi</h3>
            <span className="hint" style={{ marginLeft: 'auto' }}>
              son 6 ay
            </span>
          </div>
          {buyume.data && <BuyumeGrafigi veri={buyume.data} />}
        </Kart>

        <Kart style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <h3 style={{ fontSize: '1.05rem' }}>Öğrenci durum dağılımı</h3>
          {dagilim.map((d) => (
            <div key={d.durum} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Rozet ton={DURUM_ETIKET[d.durum]?.ton ?? 'info'} style={{ width: 110, justifyContent: 'center' }}>
                {DURUM_ETIKET[d.durum]?.etiket ?? d.durum}
              </Rozet>
              <Bar oran={d.oran} style={{ flex: 1 }} />
              <span className="hint" style={{ width: 70, textAlign: 'right' }}>
                {sayi(d.adet)} · {yuzde(d.oran)}
              </span>
            </div>
          ))}
          {metrik.data && (
            <div className="hint" style={{ marginTop: 'auto' }}>
              Ortalama plan tamamlama: <strong>{yuzde(metrik.data.planTamamlama)}</strong> · Bu hafta{' '}
              {sayi(metrik.data.haftalikGorusme)} görüşme ({metrik.data.iptal} iptal)
            </div>
          )}
        </Kart>
      </div>

      <Kart style={{ padding: '8px 24px 16px', overflowX: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', padding: '16px 0 8px' }}>
          <h3 style={{ fontSize: '1.05rem' }}>Koç performansı</h3>
        </div>
        <table className="table">
          <thead>
            <tr>
              <th>Koç</th>
              <th className="num">Öğrenci</th>
              <th>Plan tamamlama</th>
              <th className="num">Haftalık görüşme</th>
              <th className="num">Ort. net değişimi</th>
            </tr>
          </thead>
          <tbody>
            {[...(kocListesi.data ?? [])]
              .sort((a, b) => b.planTamamlama - a.planTamamlama)
              .map((k) => (
                <tr key={k.id}>
                  <td style={{ fontWeight: 600 }}>{k.adSoyad}</td>
                  <td className="num">{k.ogrenciSayisi}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <Bar oran={k.planTamamlama} style={{ width: 130 }} />
                      <span className="hint">{yuzde(k.planTamamlama)}</span>
                    </div>
                  </td>
                  <td className="num">{k.haftalikGorusme}</td>
                  <td className="num">{degisim(k.netDegisimi)}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </Kart>
    </div>
  );
}
