import { useQuery } from '@tanstack/react-query';
import { Kart, Rozet, BosDurum } from '@/components/ui/temel';
import { TabloKart } from '@/components/ui/TabloKart';
import { sayi, tarihKisa } from '@/lib/format';
import { useOturum } from '@/auth/Oturum';
import { odemeler } from '@/data/repo';

export function donemAdi(donem: string): string {
  return new Intl.DateTimeFormat('tr-TR', { month: 'long', year: 'numeric', timeZone: 'Europe/Istanbul' }).format(
    new Date(donem),
  );
}

export function tutar(n: number): string {
  return `${sayi(n)} ₺`;
}

export default function KocOdemeler() {
  const { profil } = useOturum();
  const kocId = profil?.id ?? '';
  const liste = useQuery({ queryKey: ['odemeler', kocId], queryFn: () => odemeler(kocId) });

  const bekleyen = (liste.data ?? []).filter((o) => o.durum === 'bekliyor').reduce((a, o) => a + o.tutar, 0);
  const odenen = (liste.data ?? []).filter((o) => o.durum === 'odendi').reduce((a, o) => a + o.tutar, 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div className="stat-grid">
        <Kart style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: 20 }}>
          <div className="hint">Bekleyen ödeme</div>
          <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '1.7rem' }}>{tutar(bekleyen)}</div>
        </Kart>
        <Kart style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: 20 }}>
          <div className="hint">Bu dönem ödenen</div>
          <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '1.7rem' }}>{tutar(odenen)}</div>
        </Kart>
      </div>

      <TabloKart>
        <div style={{ display: 'flex', alignItems: 'center', padding: '16px 0 8px' }}>
          <h3 style={{ fontSize: '1.05rem' }}>Hakediş dökümü</h3>
        </div>
        <table className="table">
          <thead>
            <tr>
              <th>Dönem</th>
              <th className="num">Öğrenci</th>
              <th className="num">Görüşme</th>
              <th className="num">Tutar</th>
              <th>Durum</th>
              <th>Ödenme</th>
            </tr>
          </thead>
          <tbody>
            {liste.data?.map((o) => (
              <tr key={o.id}>
                <td style={{ fontWeight: 600 }}>{donemAdi(o.donem)}</td>
                <td className="num">{o.ogrenciSayisi}</td>
                <td className="num">{o.gorusmeSayisi}</td>
                <td className="num">{tutar(o.tutar)}</td>
                <td>
                  <Rozet ton={o.durum === 'odendi' ? 'success' : 'warning'}>
                    {o.durum === 'odendi' ? 'Ödendi' : 'Bekliyor'}
                  </Rozet>
                </td>
                <td className="hint">{o.odenmeTarihi ? tarihKisa(o.odenmeTarihi) : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!liste.data?.length && <BosDurum baslik="Henüz hakediş kaydı yok" />}
      </TabloKart>
    </div>
  );
}
