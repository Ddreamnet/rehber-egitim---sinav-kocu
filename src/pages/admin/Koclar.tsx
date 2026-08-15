import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Alan, Avatar, Bar, Buton, Kart, Rozet, Uyari } from '@/components/ui/temel';
import { TabloKart } from '@/components/ui/TabloKart';
import { degisim, yuzde } from '@/lib/format';
import { koclar, roleAta } from '@/data/repo';

export default function AdminKoclar() {
  const qc = useQueryClient();
  const liste = useQuery({ queryKey: ['koclar'], queryFn: koclar });

  const [eposta, setEposta] = useState('');
  const [durum, setDurum] = useState<{ tur: 'success' | 'error'; mesaj: string } | null>(null);
  const [islemde, setIslemde] = useState(false);

  const ekle = async () => {
    if (!eposta.trim()) return;
    setIslemde(true);
    setDurum(null);
    try {
      const p = await roleAta(eposta, 'koc');
      setDurum({ tur: 'success', mesaj: `${p.adSoyad} artık koç. Öğrenci ataması koç detayından yapılır.` });
      setEposta('');
      await qc.invalidateQueries({ queryKey: ['koclar'] });
    } catch (h) {
      setDurum({ tur: 'error', mesaj: h instanceof Error ? h.message : 'Bir hata oldu.' });
    } finally {
      setIslemde(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <Kart style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <h3 style={{ fontSize: '1.05rem' }}>Koç ekle</h3>
        <p className="hint" style={{ maxWidth: '60ch', lineHeight: 1.55 }}>
          Koç önce /giris üzerinden hesap açar; sonra e-postasını buraya girip rolünü koça çevirirsin.
        </p>
        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <Alan etiket="E-posta" style={{ minWidth: 260 }}>
            <input
              className="input"
              type="email"
              value={eposta}
              onChange={(e) => setEposta(e.target.value)}
              placeholder="koc@ornek.com"
            />
          </Alan>
          <Buton onClick={ekle} disabled={islemde || !eposta.trim()}>
            Koç yap
          </Buton>
        </div>
        {durum && <Uyari tur={durum.tur === 'success' ? 'success' : 'error'}>{durum.mesaj}</Uyari>}
      </Kart>

      <TabloKart>
        <table className="table">
          <thead>
            <tr>
              <th>Koç</th>
              <th className="num">Öğrenci</th>
              <th>Ort. plan tamamlama</th>
              <th className="num">Bu hafta görüşme</th>
              <th className="num">Ort. net değişimi</th>
              <th>Durum</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {liste.data?.map((k) => (
              <tr key={k.id}>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Avatar ad={k.adSoyad} renk={k.avatarRengi} boy="md" />
                    <strong>{k.adSoyad}</strong>
                  </div>
                </td>
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
      </TabloKart>
    </div>
  );
}
