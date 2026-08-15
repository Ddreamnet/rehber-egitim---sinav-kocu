import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Avatar, Buton, Kart, Rozet, BosDurum } from '@/components/ui/temel';
import { tarihKisa } from '@/lib/format';
import { donemAdi, tutar } from '@/pages/koc/Odemeler';
import { odemeIsaretle, odemeler } from '@/data/repo';

export default function AdminOdemeler() {
  const qc = useQueryClient();
  const liste = useQuery({ queryKey: ['odemeler', 'tum'], queryFn: () => odemeler() });

  const bekleyen = (liste.data ?? []).filter((o) => o.durum === 'bekliyor');
  const toplamBekleyen = bekleyen.reduce((a, o) => a + o.tutar, 0);

  const isaretle = async (id: string, durum: 'bekliyor' | 'odendi') => {
    await odemeIsaretle(id, durum);
    await qc.invalidateQueries({ queryKey: ['odemeler'] });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 16 }}>
        <Kart style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: 20 }}>
          <div className="hint">Bekleyen toplam</div>
          <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '1.7rem' }}>
            {tutar(toplamBekleyen)}
          </div>
        </Kart>
        <Kart style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: 20 }}>
          <div className="hint">Bekleyen kayıt</div>
          <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '1.7rem' }}>
            {bekleyen.length}
          </div>
        </Kart>
      </div>

      <Kart style={{ padding: '8px 24px 16px', overflowX: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', padding: '16px 0 8px' }}>
          <h3 style={{ fontSize: '1.05rem' }}>Koç hakedişleri</h3>
        </div>
        <table className="table">
          <thead>
            <tr>
              <th>Koç</th>
              <th>Dönem</th>
              <th className="num">Öğrenci</th>
              <th className="num">Görüşme</th>
              <th className="num">Tutar</th>
              <th>Durum</th>
              <th>Ödenme</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {liste.data?.map((o) => (
              <tr key={o.id}>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Avatar ad={o.kocAdi} boy="md" />
                    <Link to={`/admin/koc/${o.kocId}`} style={{ color: 'var(--color-text)', fontWeight: 700 }}>
                      {o.kocAdi}
                    </Link>
                  </div>
                </td>
                <td>{donemAdi(o.donem)}</td>
                <td className="num">{o.ogrenciSayisi}</td>
                <td className="num">{o.gorusmeSayisi}</td>
                <td className="num">{tutar(o.tutar)}</td>
                <td>
                  <Rozet ton={o.durum === 'odendi' ? 'success' : 'warning'}>
                    {o.durum === 'odendi' ? 'Ödendi' : 'Bekliyor'}
                  </Rozet>
                </td>
                <td className="hint">{o.odenmeTarihi ? tarihKisa(o.odenmeTarihi) : '—'}</td>
                <td>
                  <Buton
                    tip={o.durum === 'odendi' ? 'ghost' : 'outline'}
                    boy="sm"
                    onClick={() => isaretle(o.id, o.durum === 'odendi' ? 'bekliyor' : 'odendi')}
                  >
                    {o.durum === 'odendi' ? 'Geri al' : 'Ödendi işaretle'}
                  </Buton>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!liste.data?.length && <BosDurum baslik="Hakediş kaydı yok" />}
      </Kart>
    </div>
  );
}
