import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Check, Mail, Phone } from 'lucide-react';
import { Alan, Avatar, Bar, Buton, Halka, Kart, Nokta, Rozet, Segment, Uyari, BosDurum } from '@/components/ui/temel';
import { Akordeon } from '@/components/ui/Akordeon';
import { TabloKart } from '@/components/ui/TabloKart';
import { NetAlanGrafigi } from '@/components/grafik';
import { degisim, gunAdi, konuIlerlemesi, net as netBicim, saat, sayi, tarihKisa, yuzde } from '@/lib/format';
import type { Ders } from '@/data/tipler';
import { ALANLAR, SINIFLAR } from './OgrenciEkle';
import { HesapDurumu } from './HesapDurumu';
import { GirisBilgileri } from './GirisBilgileri';
import {
  denemeler,
  gecmisGorusmeler,
  haftaPlani,
  koclar,
  kocAta,
  mufredat,
  notlar,
  oturumlar,
  ogrenciKocu,
  profil as profilGetir,
  profilGuncelle,
  sonrakiGorusme,
  tumOgrenciler,
  veliDetaySeviyesi,
  veliler,
} from '@/data/repo';

export default function AdminOgrenciDetay() {
  const { ogrenciId = '' } = useParams();

  const liste = useQuery({ queryKey: ['tum-ogrenciler'], queryFn: tumOgrenciler });
  const ogrenci = liste.data?.find((o) => o.id === ogrenciId);

  const plan = useQuery({ queryKey: ['plan', ogrenciId], queryFn: () => haftaPlani(ogrenciId) });
  const oturumSorgu = useQuery({ queryKey: ['oturumlar'], queryFn: oturumlar });
  const oturumId = oturumSorgu.data?.[0]?.id ?? '';
  const mufredatSorgu = useQuery({
    queryKey: ['mufredat', oturumId, ogrenciId],
    queryFn: () => mufredat(oturumId, ogrenciId),
    enabled: Boolean(oturumId),
  });
  const toplamKonu = (mufredatSorgu.data ?? []).reduce((a, d) => a + d.toplamKonu, 0);
  const tamamlananKonu = (mufredatSorgu.data ?? []).reduce((a, d) => a + d.tamamlanan, 0);
  const oranDegeri = toplamKonu ? tamamlananKonu / toplamKonu : 0;
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
        <Avatar ad={ogrenci.adSoyad} renk={ogrenci.avatarRengi} foto={ogrenci.avatarUrl} boy="lg" />
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

      <YonetimKarti ogrenciId={ogrenciId} />

      <VeliKarti ogrenciId={ogrenciId} />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: 24 }}>
        <Kart style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <h3 style={{ fontSize: '1.05rem' }}>Müfredat ilerlemesi</h3>
            <span className="hint" style={{ marginLeft: 'auto' }}>
              derse tıkla, konuları gör
            </span>
          </div>
          <div style={{ display: 'flex', gap: 18, alignItems: 'center' }}>
            <Halka oran={oranDegeri} boyut={88} />
            <div className="hint" style={{ flex: 1, lineHeight: 1.55 }}>
              {toplamKonu > 0
                ? `${tamamlananKonu}/${toplamKonu} konu tamamlandı.`
                : 'Bu oturum için konu listesi yok.'}
              <br />
              Haftalık plan: {yuzde(plan.data?.oran ?? 0)} tamamlandı
            </div>
          </div>

          {/* Yüzdenin arkasında hangi konuların bittiği görünmüyordu */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {mufredatSorgu.data?.map((d) => (
              <DersIlerlemesi key={d.id} ders={d} />
            ))}
          </div>
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
                    {n.veliylePaylasildi ? 'veliyle paylaşıldı' : 'veliyle paylaşılmadı'}
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

/**
 * Velinin bilgileri ve iletişim.
 *
 * Admin panelinde veliye ulaşacak hiçbir ekran yoktu; iletişim bilgileri
 * yalnızca veritabanında duruyordu.
 */
function VeliKarti({ ogrenciId }: { ogrenciId: string }) {
  const qc = useQueryClient();
  const liste = useQuery({ queryKey: ['veliler', ogrenciId], queryFn: () => veliler(ogrenciId) });
  const [islemde, setIslemde] = useState(false);

  const seviyeDegistir = async (veliId: string, seviye: 'ozet' | 'tam') => {
    setIslemde(true);
    try {
      await veliDetaySeviyesi(veliId, ogrenciId, seviye);
      await qc.invalidateQueries({ queryKey: ['veliler', ogrenciId] });
    } finally {
      setIslemde(false);
    }
  };

  return (
    <Kart style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <h3 style={{ fontSize: '1.05rem' }}>Veli</h3>

      {!liste.data?.length && (
        <p className="hint" style={{ lineHeight: 1.55 }}>
          Bu öğrenciye bağlı veli hesabı yok. Veli hesabı, öğrenci eklenirken “Veli hesabı da aç” seçeneğiyle
          oluşturuluyor.
        </p>
      )}

      {liste.data?.map((v) => (
        <div key={v.id} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <Avatar ad={v.adSoyad} foto={v.avatarUrl} boy="md" />
            <div>
              <strong>{v.adSoyad}</strong>
              <div className="hint" style={{ fontSize: '.78rem' }}>
                {[v.eposta, v.telefon].filter(Boolean).join(' · ') || 'iletişim bilgisi yok'}
              </div>
            </div>
            <div className="eylem-satiri" style={{ marginLeft: 'auto', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {v.telefon && (
                <a className="btn btn-outline btn-sm" href={`tel:${v.telefon.replace(/\s/g, '')}`}>
                  <Phone size={14} /> Ara
                </a>
              )}
              {v.eposta && (
                <a
                  className="btn btn-outline btn-sm"
                  href={`mailto:${v.eposta}?subject=${encodeURIComponent('Rehber Eğitim & Sınav Koçu')}`}
                >
                  <Mail size={14} /> E-posta
                </a>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <span className="hint">Velinin göreceği detay</span>
            <Segment
              etiket="Veli detay seviyesi"
              deger={v.detaySeviyesi}
              degistir={(seviye) => void seviyeDegistir(v.id, seviye)}
              secenekler={[
                { deger: 'ozet' as const, etiket: 'Özet' },
                { deger: 'tam' as const, etiket: 'Tam' },
              ]}
            />
            {islemde && <span className="hint">kaydediliyor…</span>}
          </div>

          <GirisBilgileri kisiId={v.id} eposta={v.eposta} etiket="Veli" />
        </div>
      ))}
    </Kart>
  );
}

/**
 * Ders satırı — açılınca o dersin konuları ve durumları listelenir.
 *
 * Ekranda yalnızca yüzde vardı; hangi konuların bittiğini görmenin yolu yoktu.
 */
function DersIlerlemesi({ ders }: { ders: Ders }) {
  const oran = ders.toplamKonu ? ders.tamamlanan / ders.toplamKonu : 0;

  return (
    <Akordeon
      kartMi={false}
      className="ders-ilerleme"
      ozetStyle={{ padding: '10px 12px' }}
      ozet={
        <>
          <Nokta renk={ders.renk} />
          <span style={{ fontSize: '.88rem', fontWeight: 600, flex: '0 1 auto' }}>{ders.ad}</span>
          <Bar oran={oran} renk={ders.renk} style={{ flex: 1, minWidth: 60, marginLeft: 8 }} />
          <span className="hint" style={{ fontVariantNumeric: 'tabular-nums' }}>
            {ders.tamamlanan}/{ders.toplamKonu} · {yuzde(oran)}
          </span>
        </>
      }
    >
      <div style={{ padding: '2px 12px 12px', display: 'flex', flexDirection: 'column', gap: 4 }}>
        {ders.konular.length === 0 && <span className="hint">Konu listesi yok.</span>}
        {ders.konular.map((k) => (
          <div
            key={k.id}
            style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '.85rem', padding: '3px 0' }}
          >
            {k.durum === 'tamam' ? (
              <Check size={14} strokeWidth={2.5} color="var(--color-success)" style={{ flex: 'none' }} />
            ) : (
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  flex: 'none',
                  border: '2px solid var(--color-border)',
                  ...(k.durum === 'devam'
                    ? { background: 'var(--color-primary)', borderColor: 'var(--color-primary)' }
                    : {}),
                }}
                aria-hidden="true"
              />
            )}
            <span
              style={{
                color: k.durum === 'tamam' ? 'var(--color-text-muted)' : undefined,
                textDecoration: k.durum === 'tamam' ? 'line-through' : undefined,
              }}
            >
              {k.ad}
            </span>
            {k.soruOrtalamasi > 0 && <Rozet style={{ marginLeft: 'auto' }}>~{sayi(k.soruOrtalamasi)} soru</Rozet>}
            <span className="hint" style={{ fontVariantNumeric: 'tabular-nums', minWidth: 78, textAlign: 'right' }}>
              {konuIlerlemesi(k.cozulen, k.hedef, k.durum)}
            </span>
          </div>
        ))}
      </div>
    </Akordeon>
  );
}

/**
 * Öğrenci yönetimi.
 *
 * Koç ataması yalnızca hesap açılırken yapılabiliyordu; sonradan koç değiştirmek
 * ya da öğrenci bilgisini düzeltmek için hiçbir ekran yoktu.
 */
function YonetimKarti({ ogrenciId }: { ogrenciId: string }) {
  const qc = useQueryClient();
  const kisi = useQuery({ queryKey: ['profil', ogrenciId], queryFn: () => profilGetir(ogrenciId) });
  const kocListesi = useQuery({ queryKey: ['koclar'], queryFn: koclar });
  const mevcutKoc = useQuery({ queryKey: ['ogrenci-kocu', ogrenciId], queryFn: () => ogrenciKocu(ogrenciId) });

  const [adSoyad, setAdSoyad] = useState('');
  const [telefon, setTelefon] = useState('');
  const [sinif, setSinif] = useState('');
  const [hedefAlan, setHedefAlan] = useState('');
  const [hedef, setHedef] = useState('');
  const [kocId, setKocId] = useState('');
  const [islemde, setIslemde] = useState(false);
  const [durum, setDurum] = useState<{ tur: 'success' | 'error'; mesaj: string } | null>(null);

  // Sorgular döndüğünde formu doldur (kullanıcı yazmaya başladıysa üstüne yazma).
  useEffect(() => {
    if (!kisi.data) return;
    setAdSoyad(kisi.data.adSoyad);
    setTelefon(kisi.data.telefon ?? '');
    setSinif(kisi.data.sinif ?? '');
    setHedefAlan(kisi.data.hedefAlan ?? '');
    setHedef(kisi.data.hedef ?? '');
  }, [kisi.data]);

  useEffect(() => {
    setKocId(mevcutKoc.data?.id ?? '');
  }, [mevcutKoc.data]);

  if (!kisi.data) return null;
  const aktif = kisi.data.aktif;

  const kaydet = async () => {
    setIslemde(true);
    setDurum(null);
    try {
      await profilGuncelle(ogrenciId, {
        adSoyad: adSoyad.trim(),
        telefon: telefon.trim(),
        sinif,
        hedefAlan,
        hedef: hedef.trim(),
      });
      if ((mevcutKoc.data?.id ?? '') !== kocId) await kocAta(ogrenciId, kocId || null);
      await Promise.all([
        qc.invalidateQueries({ queryKey: ['profil', ogrenciId] }),
        qc.invalidateQueries({ queryKey: ['ogrenci-kocu', ogrenciId] }),
        qc.invalidateQueries({ queryKey: ['tum-ogrenciler'] }),
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
        <h3 style={{ fontSize: '1.05rem' }}>Öğrenci yönetimi</h3>
        <span className="hint" style={{ marginLeft: 'auto' }}>
          {kisi.data.eposta}
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 12 }}>
        <Alan etiket="Ad soyad">
          <input className="input" value={adSoyad} onChange={(e) => setAdSoyad(e.target.value)} />
        </Alan>
        <Alan etiket="Telefon">
          <input className="input" value={telefon} onChange={(e) => setTelefon(e.target.value)} inputMode="tel" />
        </Alan>
        <Alan etiket="Sınıf">
          <select className="input" value={sinif} onChange={(e) => setSinif(e.target.value)}>
            <option value="">—</option>
            {SINIFLAR.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </Alan>
        <Alan etiket="Alan">
          <select className="input" value={hedefAlan} onChange={(e) => setHedefAlan(e.target.value)}>
            <option value="">—</option>
            {ALANLAR.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </Alan>
        <Alan
          etiket="Hedefi"
          ipucu="Sınava hazırlanmayan öğrencide panelde geri sayım yerine bu görünür."
        >
          <input
            className="input"
            value={hedef}
            onChange={(e) => setHedef(e.target.value)}
            placeholder="Örn. haftada 5 gün düzenli çalışmak"
          />
        </Alan>
        <Alan etiket="Koç" ipucu="Değiştirince öğrenci yeni koçun listesine geçer.">
          <select className="input" value={kocId} onChange={(e) => setKocId(e.target.value)}>
            <option value="">Koç atanmadı</option>
            {kocListesi.data?.map((k) => (
              <option key={k.id} value={k.id}>
                {k.adSoyad} ({k.ogrenciSayisi} öğrenci)
              </option>
            ))}
          </select>
        </Alan>
      </div>

      {durum && <Uyari tur={durum.tur === 'success' ? 'success' : 'error'}>{durum.mesaj}</Uyari>}

      <Buton onClick={kaydet} disabled={islemde} style={{ alignSelf: 'flex-start' }}>
        Kaydet
      </Buton>

      <GirisBilgileri kisiId={ogrenciId} eposta={kisi.data.eposta} etiket="Öğrenci" />

      <HesapDurumu
        kisiId={ogrenciId}
        aktif={aktif}
        tur="ogrenci"
        donusYolu="/admin/ogrenciler"
        tazelenecek={['profil', 'tum-ogrenciler', 'admin-metrikleri', 'ogrenci-buyumesi', 'koclar']}
      />
    </Kart>
  );
}
