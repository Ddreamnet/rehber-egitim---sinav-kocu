import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Avatar, Bar, Halka, Kart, Rozet, BosDurum } from '@/components/ui/temel';
import { TabloKart } from '@/components/ui/TabloKart';
import { NetAlanGrafigi } from '@/components/grafik';
import { degisim, gunAdi, net as netBicim, saat, tarihKisa, yuzde } from '@/lib/format';
import {
  denemeler,
  dersIlerlemesi,
  gecmisGorusmeler,
  haftaPlani,
  notlar,
  sonrakiGorusme,
  tumOgrenciler,
} from '@/data/repo';

export default function AdminOgrenciDetay() {
  const { ogrenciId = '' } = useParams();

  const liste = useQuery({ queryKey: ['tum-ogrenciler'], queryFn: tumOgrenciler });
  const ogrenci = liste.data?.find((o) => o.id === ogrenciId);

  const plan = useQuery({ queryKey: ['plan', ogrenciId], queryFn: () => haftaPlani(ogrenciId) });
  const dersler = useQuery({ queryKey: ['ders-ilerlemesi', ogrenciId], queryFn: () => dersIlerlemesi(ogrenciId) });
  const oranDegeri = dersler.data?.length
    ? dersler.data.reduce((a, d) => a + d.oran, 0) / dersler.data.length
    : 0;
  const denemeSorgu = useQuery({ queryKey: ['denemeler', ogrenciId], queryFn: () => denemeler(ogrenciId) });
  const sonraki = useQuery({ queryKey: ['sonraki-gorusme', ogrenciId], queryFn: () => sonrakiGorusme(ogrenciId) });
  const gecmis = useQuery({ queryKey: ['gecmis-gorusmeler', ogrenciId], queryFn: () => gecmisGorusmeler(ogrenciId) });
  const notSorgu = useQuery({ queryKey: ['notlar', ogrenciId], queryFn: () => notlar(ogrenciId) });

  if (liste.isLoading) return <div className="iskelet" style={{ minHeight: 240 }} />;
  if (!ogrenci) {
    return (
      <Kart>
        <BosDurum baslik="Öğrenci bulunamadı">
          <Link to="/admin/ogrenciler" className="btn btn-outline btn-sm">
            Öğrenci listesine dön
          </Link>
        </BosDurum>
      </Kart>
    );
  }

  const sonDeneme = denemeSorgu.data?.[denemeSorgu.data.length - 1];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
        <Link to="/admin/ogrenciler" className="btn btn-ghost btn-sm">
          <ArrowLeft size={15} /> Öğrenciler
        </Link>
        <Avatar ad={ogrenci.adSoyad} renk={ogrenci.avatarRengi} boy="lg" />
        <div>
          <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 700 }}>{ogrenci.adSoyad}</div>
          <div className="hint" style={{ fontSize: '.75rem' }}>
            {ogrenci.sinav}
          </div>
        </div>
        {sonraki.data && (
          <Rozet style={{ marginLeft: 'auto' }}>
            Sonraki görüşme: {gunAdi(sonraki.data.baslangic).slice(0, 3)} {saat(sonraki.data.baslangic)} ·{' '}
            {sonraki.data.kocAdi}
          </Rozet>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: 24 }}>
        <Kart style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <h3 style={{ fontSize: '1.05rem' }}>Müfredat ilerlemesi</h3>
          <div style={{ display: 'flex', gap: 18, alignItems: 'center' }}>
            <Halka oran={oranDegeri} boyut={88} />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10, fontSize: '.85rem' }}>
              {dersler.data?.map((d) => (
                <div key={d.ad} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ width: 70 }} className="hint">
                    {d.ad}
                  </span>
                  <Bar oran={d.oran} renk={d.renk} style={{ flex: 1 }} />
                  <span className="hint" style={{ width: 34, textAlign: 'right' }}>
                    {yuzde(d.oran)}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div className="hint">Haftalık plan: {yuzde(plan.data?.oran ?? 0)} tamamlandı</div>
        </Kart>

        <Kart style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
            <h3 style={{ fontSize: '1.05rem' }}>Net gelişimi</h3>
            <span className="hint" style={{ marginLeft: 'auto' }}>
              {sonDeneme ? `son: ${netBicim(sonDeneme.net)}` : '—'}
            </span>
          </div>
          {denemeSorgu.data && denemeSorgu.data.length > 1 ? (
            <NetAlanGrafigi denemeler={denemeSorgu.data.slice(-6)} />
          ) : (
            <p className="hint">Yeterli deneme kaydı yok.</p>
          )}
        </Kart>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: 24 }}>
        <TabloKart style={{ paddingBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', padding: '16px 0 8px' }}>
            <h3 style={{ fontSize: '1.05rem' }}>Denemeler</h3>
          </div>
          <table className="table">
            <thead>
              <tr>
                <th>Deneme</th>
                <th>Tarih</th>
                <th className="num">Net</th>
                <th className="num">Değişim</th>
              </tr>
            </thead>
            <tbody>
              {[...(denemeSorgu.data ?? [])].reverse().map((d) => (
                <tr key={d.id}>
                  <td style={{ fontWeight: 600 }}>{d.ad}</td>
                  <td className="hint">{tarihKisa(d.tarih)}</td>
                  <td className="num">{netBicim(d.net)}</td>
                  <td className="num">{d.degisim === null ? '—' : degisim(d.degisim)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </TabloKart>

        <Kart style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <h3 style={{ fontSize: '1.05rem' }}>Görüşme notları</h3>
          {notSorgu.data?.length ? (
            notSorgu.data.map((n) => (
              <div key={n.id} className="satir" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 6 }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', width: '100%' }}>
                  <Rozet>{tarihKisa(n.tarih)}</Rozet>
                  <span className="hint" style={{ marginLeft: 'auto', fontSize: '.72rem' }}>
                    {n.veliylePaylasildi ? 'veliyle paylaşıldı' : 'yalnız koç'}
                  </span>
                </div>
                <p style={{ fontSize: '.88rem', lineHeight: 1.55 }}>{n.metin}</p>
              </div>
            ))
          ) : (
            <p className="hint">Not yok.</p>
          )}
          <div className="hint">Toplam {gecmis.data?.length ?? 0} geçmiş görüşme.</div>
        </Kart>
      </div>
    </div>
  );
}
