import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Alan, Avatar, Bar, Buton, Kart, Rozet, Uyari, BosDurum } from '@/components/ui/temel';
import { TabloKart } from '@/components/ui/TabloKart';
import { Sparkline } from '@/components/grafik';
import { degisim, gunAdi, net as netBicim, saat, tarihKisa, yuzde } from '@/lib/format';
import { donemAdi, tutar } from '@/pages/koc/Odemeler';
import { koclar, kocGorusmeleri, odemeler, ogrencilerim, profil as profilGetir, profilGuncelle } from '@/data/repo';
import { HesapDurumu } from './HesapDurumu';
import { GirisBilgileri } from './GirisBilgileri';

export default function AdminKocDetay() {
  const { kocId = '' } = useParams();

  const kocListesi = useQuery({ queryKey: ['koclar'], queryFn: koclar });
  const koc = kocListesi.data?.find((k) => k.id === kocId);

  const ogrenciler = useQuery({ queryKey: ['ogrencilerim', kocId], queryFn: () => ogrencilerim(kocId) });
  const gorusmeler = useQuery({ queryKey: ['koc-gorusmeleri', kocId], queryFn: () => kocGorusmeleri(kocId) });
  const odeme = useQuery({ queryKey: ['odemeler', kocId], queryFn: () => odemeler(kocId) });

  if (kocListesi.isLoading) return <div className="iskelet" style={{ minHeight: 240 }} />;
  if (!koc) {
    return (
      <Kart>
        <BosDurum baslik="Koç bulunamadı">
          <Link to="/admin/koclar" className="btn btn-outline btn-sm">
            Koç listesine dön
          </Link>
        </BosDurum>
      </Kart>
    );
  }

  const yaklasan = (gorusmeler.data ?? [])
    .filter((g) => new Date(g.baslangic).getTime() >= Date.now() && g.durum === 'planlandi')
    .slice(0, 6);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
        <Link to="/admin/koclar" className="btn btn-ghost btn-sm">
          <ArrowLeft size={15} /> Koçlar
        </Link>
        <Avatar ad={koc.adSoyad} renk={koc.avatarRengi} foto={koc.avatarUrl} boy="lg" />
        <div>
          <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 700 }}>{koc.adSoyad}</div>
          <div className="hint" style={{ fontSize: '.75rem' }}>
            {koc.ogrenciSayisi} öğrenci · haftada {koc.haftalikGorusme} görüşme
          </div>
        </div>
        <Rozet ton={koc.durum === 'takipte' ? 'warning' : 'success'} style={{ marginLeft: 'auto' }}>
          {koc.durum === 'cokIyi' ? 'Çok iyi' : koc.durum === 'iyi' ? 'İyi' : 'Takipte'}
        </Rozet>
      </div>

      <div className="stat-grid">
        <Kart style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: 20 }}>
          <div className="hint">Ort. plan tamamlama</div>
          <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '1.6rem' }}>
            {yuzde(koc.planTamamlama)}
          </div>
          <Bar oran={koc.planTamamlama} />
        </Kart>
        <Kart style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: 20 }}>
          <div className="hint">Ort. net değişimi</div>
          <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '1.6rem' }}>
            {degisim(koc.netDegisimi)}
          </div>
        </Kart>
        <Kart style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: 20 }}>
          <div className="hint">Bekleyen hakediş</div>
          <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '1.6rem' }}>
            {tutar((odeme.data ?? []).filter((o) => o.durum === 'bekliyor').reduce((a, o) => a + o.tutar, 0))}
          </div>
        </Kart>
      </div>

      <KocYonetimi kocId={kocId} ogrenciSayisi={koc.ogrenciSayisi} />

      <TabloKart>
        <div style={{ display: 'flex', alignItems: 'center', padding: '16px 0 8px' }}>
          <h3 style={{ fontSize: '1.05rem' }}>Öğrencileri</h3>
        </div>
        <table className="table">
          <thead>
            <tr>
              <th>Öğrenci</th>
              <th>Sınav</th>
              <th>Plan</th>
              <th className="hide-m">Net trendi</th>
              <th className="num">Son net</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {ogrenciler.data?.map((o) => (
              <tr key={o.id}>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Avatar ad={o.adSoyad} renk={o.avatarRengi} foto={o.avatarUrl} boy="md" />
                    <strong>{o.adSoyad}</strong>
                  </div>
                </td>
                <td>{o.sinav}</td>
                <td>
                  <Bar oran={o.planOrani} style={{ width: 110 }} />
                </td>
                <td className="hide-m">
                  <Sparkline noktalar={o.netTrendi} renk="var(--color-success)" />
                </td>
                <td className="num">{o.sonNet === null ? '—' : netBicim(o.sonNet)}</td>
                <td>
                  <Link to={`/admin/ogrenci/${o.id}`} className="btn btn-outline btn-sm">
                    Detay
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </TabloKart>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: 24 }}>
        <Kart style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <h3 style={{ fontSize: '1.05rem' }}>Yaklaşan görüşmeler</h3>
          {yaklasan.length ? (
            yaklasan.map((g) => (
              <div key={g.id} className="satir">
                <span style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 600, fontSize: '.9rem' }}>
                  {tarihKisa(g.baslangic)} {gunAdi(g.baslangic).slice(0, 3)} {saat(g.baslangic)}
                </span>
                <span className="hint" style={{ marginLeft: 'auto' }}>
                  {g.ogrenciAdi}
                </span>
              </div>
            ))
          ) : (
            <p className="hint">Planlanmış görüşme yok.</p>
          )}
        </Kart>

        <TabloKart style={{ paddingBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', padding: '16px 0 8px' }}>
            <h3 style={{ fontSize: '1.05rem' }}>Hakediş geçmişi</h3>
          </div>
          <table className="table">
            <thead>
              <tr>
                <th>Dönem</th>
                <th className="num">Tutar</th>
                <th>Durum</th>
              </tr>
            </thead>
            <tbody>
              {odeme.data?.map((o) => (
                <tr key={o.id}>
                  <td>{donemAdi(o.donem)}</td>
                  <td className="num">{tutar(o.tutar)}</td>
                  <td>
                    <Rozet ton={o.durum === 'odendi' ? 'success' : 'warning'}>
                      {o.durum === 'odendi' ? 'Ödendi' : 'Bekliyor'}
                    </Rozet>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </TabloKart>
      </div>
    </div>
  );
}

/**
 * Koç yönetimi.
 *
 * Koç detayı tamamen salt-okunurdu: bilgi düzeltmek, hesabı pasife almak ya da
 * silmek için hiçbir yol yoktu.
 */
function KocYonetimi({ kocId, ogrenciSayisi }: { kocId: string; ogrenciSayisi: number }) {
  const qc = useQueryClient();
  const kisi = useQuery({ queryKey: ['profil', kocId], queryFn: () => profilGetir(kocId) });

  const [adSoyad, setAdSoyad] = useState('');
  const [telefon, setTelefon] = useState('');
  const [islemde, setIslemde] = useState(false);
  const [durum, setDurum] = useState<{ tur: 'success' | 'error'; mesaj: string } | null>(null);

  useEffect(() => {
    if (!kisi.data) return;
    setAdSoyad(kisi.data.adSoyad);
    setTelefon(kisi.data.telefon ?? '');
  }, [kisi.data]);

  if (!kisi.data) return null;

  const kaydet = async () => {
    setIslemde(true);
    setDurum(null);
    try {
      await profilGuncelle(kocId, { adSoyad: adSoyad.trim(), telefon: telefon.trim() });
      await Promise.all([
        qc.invalidateQueries({ queryKey: ['profil', kocId] }),
        qc.invalidateQueries({ queryKey: ['koclar'] }),
      ]);
      setDurum({ tur: 'success', mesaj: 'Kaydedildi.' });
    } catch (h) {
      setDurum({ tur: 'error', mesaj: h instanceof Error ? h.message : 'Kaydedilemedi.' });
    } finally {
      setIslemde(false);
    }
  };

  return (
    <Kart style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <h3 style={{ fontSize: '1.05rem' }}>Koç yönetimi</h3>
        <span className="hint" style={{ marginLeft: 'auto' }}>
          {kisi.data.eposta}
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 12 }}>
        <Alan etiket="Ad soyad">
          <input className="input" value={adSoyad} onChange={(e) => setAdSoyad(e.target.value)} />
        </Alan>
        <Alan etiket="Telefon">
          <input className="input" value={telefon} onChange={(e) => setTelefon(e.target.value)} inputMode="tel" />
        </Alan>
      </div>

      {durum && <Uyari tur={durum.tur === 'success' ? 'success' : 'error'}>{durum.mesaj}</Uyari>}

      <Buton onClick={kaydet} disabled={islemde} style={{ alignSelf: 'flex-start' }}>
        Kaydet
      </Buton>

      {ogrenciSayisi > 0 && (
        <Uyari tur="info">
          Bu koça bağlı {ogrenciSayisi} öğrenci var. Hesabı silmek için önce öğrencileri başka bir koça atamalısın;
          pasife almak için buna gerek yok.
        </Uyari>
      )}

      <GirisBilgileri kisiId={kocId} eposta={kisi.data.eposta} etiket="Koç" />

      <HesapDurumu
        kisiId={kocId}
        aktif={kisi.data.aktif}
        tur="koc"
        donusYolu="/admin/koclar"
        tazelenecek={['profil', 'koclar', 'admin-metrikleri', 'tum-ogrenciler']}
      />
    </Kart>
  );
}
