import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Search } from 'lucide-react';
import { Avatar, Bar, ButonLink, Rozet, BosDurum } from '@/components/ui/temel';
import { TabloKart } from '@/components/ui/TabloKart';
import { degisim, yuzde } from '@/lib/format';
import { koclar } from '@/data/repo';

export default function AdminKoclar() {
  const liste = useQuery({ queryKey: ['koclar'], queryFn: koclar });
  const [arama, setArama] = useState('');

  const suzulmus = useMemo(() => {
    const q = arama.trim().toLocaleLowerCase('tr-TR');
    if (!q) return liste.data ?? [];
    return (liste.data ?? []).filter(
      (k) =>
        k.adSoyad.toLocaleLowerCase('tr-TR').includes(q) ||
        (k.eposta ?? '').toLocaleLowerCase('tr-TR').includes(q),
    );
  }, [liste.data, arama]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <TabloKart>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 0 8px', flexWrap: 'wrap' }}>
          <h3 style={{ fontSize: '1.05rem' }}>Koçlar</h3>
          <ButonLink tip="primary" boy="sm" to="/admin/koc-ekle" style={{ marginLeft: 'auto' }}>
            Koç ekle
          </ButonLink>
          <div className="search-wrap">
            <Search size={16} aria-hidden="true" />
            <input
              className="input"
              placeholder="Koç ara…"
              aria-label="Koç ara"
              value={arama}
              onChange={(e) => setArama(e.target.value)}
              style={{ width: 220 }}
            />
          </div>
        </div>
        <table className="table">
          <thead>
            <tr>
              <th>Koç</th>
              <th className="hide-m">E-posta</th>
              <th className="num">Öğrenci</th>
              <th>Ort. plan tamamlama</th>
              <th className="num">Bu hafta görüşme</th>
              <th className="num">Ort. net değişimi</th>
              <th>Durum</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {suzulmus.map((k) => (
              <tr key={k.id}>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Avatar ad={k.adSoyad} renk={k.avatarRengi} foto={k.avatarUrl} boy="md" />
                    <strong>{k.adSoyad}</strong>
                  </div>
                </td>
                <td className="hide-m hint">{k.eposta ?? '—'}</td>
                <td className="num">{k.ogrenciSayisi}</td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Bar oran={k.planTamamlama} style={{ width: 130 }} />
                    <span className="hint">{yuzde(k.planTamamlama)}</span>
                  </div>
                </td>
                <td className="num">{k.haftalikGorusme}</td>
                <td className="num">{degisim(k.netDegisimi)}</td>
                <td>
                  <Rozet ton={k.durum === 'takipte' ? 'warning' : 'success'}>
                    {k.durum === 'cokIyi' ? 'Çok iyi' : k.durum === 'iyi' ? 'İyi' : 'Takipte'}
                  </Rozet>
                </td>
                <td>
                  <Link to={`/admin/koc/${k.id}`} className="btn btn-outline btn-sm">
                    Detay
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!liste.isLoading && suzulmus.length === 0 && (
          <BosDurum
            baslik={arama ? 'Eşleşen koç yok' : 'Henüz koç yok'}
            aciklama={arama ? undefined : 'Koç ekle butonuyla ilk hesabı açabilirsin.'}
          />
        )}
      </TabloKart>
    </div>
  );
}
