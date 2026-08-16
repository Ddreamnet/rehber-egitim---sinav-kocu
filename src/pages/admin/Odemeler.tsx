import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Alan, Avatar, Buton, Kart, Rozet, Uyari, BosDurum } from '@/components/ui/temel';
import { TabloKart } from '@/components/ui/TabloKart';
import { tarihKisa } from '@/lib/format';
import { donemAdi, tutar } from '@/pages/koc/Odemeler';
import { hakedisOlustur, odemeIsaretle, odemeler } from '@/data/repo';

/** Geçen ayın ilk günü — hakediş genelde ay kapandıktan sonra üretilir. */
function gecenAy(): string {
  const d = new Date();
  d.setDate(1);
  d.setMonth(d.getMonth() - 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
}

export default function AdminOdemeler() {
  const qc = useQueryClient();
  const liste = useQuery({ queryKey: ['odemeler', 'tum'], queryFn: () => odemeler() });

  const [donem, setDonem] = useState(gecenAy);
  const [ucret, setUcret] = useState('400');
  const [uretiliyor, setUretiliyor] = useState(false);
  const [durum, setDurum] = useState<{ tur: 'success' | 'error'; mesaj: string } | null>(null);

  const bekleyen = (liste.data ?? []).filter((o) => o.durum === 'bekliyor');
  const toplamBekleyen = bekleyen.reduce((a, o) => a + o.tutar, 0);

  const isaretle = async (id: string, yeniDurum: 'bekliyor' | 'odendi') => {
    await odemeIsaretle(id, yeniDurum);
    await qc.invalidateQueries({ queryKey: ['odemeler'] });
  };

  const uret = async () => {
    setUretiliyor(true);
    setDurum(null);
    try {
      const sonuc = await hakedisOlustur(donem, Number(ucret.replace(',', '.')) || 0);
      await qc.invalidateQueries({ queryKey: ['odemeler'] });
      setDurum({
        tur: 'success',
        mesaj: `${donemAdi(donem)} için ${sonuc.olusan} koç hakedişi hesaplandı${
          sonuc.atlanan ? `; ödenmiş ${sonuc.atlanan} kayda dokunulmadı` : ''
        }.`,
      });
    } catch (h) {
      setDurum({ tur: 'error', mesaj: h instanceof Error ? h.message : 'Hakediş üretilemedi.' });
    } finally {
      setUretiliyor(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div className="stat-grid">
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

      {/* Hakediş satırlarını üreten bir akış yoktu; iki ödeme ekranı da hep boştu. */}
      <Kart style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div>
          <h3 style={{ fontSize: '1.05rem' }}>Dönem hakedişi hesapla</h3>
          <p className="hint" style={{ lineHeight: 1.55, maxWidth: '62ch' }}>
            Seçilen ayda <strong>tamamlandı</strong> olarak işaretlenmiş görüşmeler sayılır ve görüşme ücretiyle çarpılır.
            Aynı dönemi yeniden hesaplayabilirsin; “ödendi” işaretli kayıtlara dokunulmaz.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <Alan etiket="Dönem" style={{ flex: '1 1 160px' }}>
            <input
              className="input"
              type="month"
              value={donem.slice(0, 7)}
              onChange={(e) => setDonem(`${e.target.value}-01`)}
            />
          </Alan>
          <Alan etiket="Görüşme ücreti (₺)" style={{ flex: '0 1 150px' }}>
            <input className="input" inputMode="decimal" value={ucret} onChange={(e) => setUcret(e.target.value)} />
          </Alan>
          <Buton onClick={uret} disabled={uretiliyor}>
            {uretiliyor ? 'Hesaplanıyor…' : 'Hesapla'}
          </Buton>
        </div>
        {durum && <Uyari tur={durum.tur === 'success' ? 'success' : 'error'}>{durum.mesaj}</Uyari>}
      </Kart>

      <TabloKart>
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
      </TabloKart>
    </div>
  );
}
