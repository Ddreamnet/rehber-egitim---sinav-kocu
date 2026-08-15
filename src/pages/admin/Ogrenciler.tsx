import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Search } from 'lucide-react';
import { Avatar, Bar, ButonLink, Kart, Rozet } from '@/components/ui/temel';
import { net as netBicim } from '@/lib/format';
import { tumOgrenciler } from '@/data/repo';

export default function AdminOgrenciler() {
  const liste = useQuery({ queryKey: ['tum-ogrenciler'], queryFn: tumOgrenciler });
  const [arama, setArama] = useState('');

  const suzulmus = useMemo(() => {
    const q = arama.trim().toLocaleLowerCase('tr-TR');
    if (!q) return liste.data ?? [];
    return (liste.data ?? []).filter((o) => o.adSoyad.toLocaleLowerCase('tr-TR').includes(q));
  }, [liste.data, arama]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <Kart style={{ padding: '8px 24px 16px', overflowX: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 0 8px', flexWrap: 'wrap' }}>
          <h3 style={{ fontSize: '1.05rem' }}>Tüm öğrenciler</h3>
          <ButonLink tip="primary" boy="sm" to="/admin/ogrenci-ekle" style={{ marginLeft: 'auto' }}>
            Öğrenci ekle
          </ButonLink>
          <div className="search-wrap">
            <Search size={16} aria-hidden="true" />
            <input
              className="input"
              placeholder="Öğrenci ara…"
              aria-label="Öğrenci ara"
              value={arama}
              onChange={(e) => setArama(e.target.value)}
              style={{ width: 220 }}
            />
          </div>
        </div>
        <table className="table">
          <thead>
            <tr>
              <th>Öğrenci</th>
              <th>Sınav / alan</th>
              <th>Haftalık plan</th>
              <th className="num">Son net</th>
              <th>Durum</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {suzulmus.map((o) => (
              <tr key={o.id}>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Avatar ad={o.adSoyad} renk={o.avatarRengi} boy="md" />
                    <strong>{o.adSoyad}</strong>
                  </div>
                </td>
                <td>{o.sinav}</td>
                <td>
                  <Bar oran={o.planOrani} style={{ width: 110 }} />
                </td>
                <td className="num">{o.sonNet === null ? '—' : netBicim(o.sonNet)}</td>
                <td>
                  <Rozet
                    ton={
                      o.durum === 'yolunda'
                        ? 'success'
                        : o.durum === 'riskli'
                          ? 'error'
                          : o.durum === 'yeni'
                            ? 'info'
                            : 'warning'
                    }
                  >
                    {o.durum === 'yolunda'
                      ? 'Yolunda'
                      : o.durum === 'riskli'
                        ? 'Riskli'
                        : o.durum === 'yeni'
                          ? 'Yeni'
                          : 'Plan gecikti'}
                  </Rozet>
                </td>
                <td>
                  <Link to={`/admin/ogrenci/${o.id}`} className="btn btn-outline btn-sm">
                    Detay
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Kart>
    </div>
  );
}
