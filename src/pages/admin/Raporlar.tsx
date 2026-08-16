import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Avatar, Bar, Kart, Rozet, BosDurum } from '@/components/ui/temel';
import { TabloKart } from '@/components/ui/TabloKart';
import { gunAdi, net as netBicim, saat, sayi, yuzde } from '@/lib/format';
import { adminMetrikleri, tumOgrenciler } from '@/data/repo';

/*
 * Raporlar, Genel bakış ile aynı büyüme grafiğini ve Koçlar ile aynı koç
 * tablosunu tekrar basıyordu — üç ekranda üç kopya. Burada yalnızca diğer iki
 * ekranda olmayan şey var: aksiyon bekleyen öğrenciler.
 */

const DURUM_ETIKET: Record<string, { etiket: string; ton: 'success' | 'warning' | 'error' | 'info' }> = {
  yolunda: { etiket: 'Yolunda', ton: 'success' },
  gecikti: { etiket: 'Plan gecikti', ton: 'warning' },
  riskli: { etiket: 'Riskli', ton: 'error' },
  yeni: { etiket: 'Yeni', ton: 'info' },
};

const SIRA = ['riskli', 'gecikti', 'yeni', 'yolunda'];

export default function AdminRaporlar() {
  const metrik = useQuery({ queryKey: ['admin-metrikleri'], queryFn: adminMetrikleri });
  const ogrenciler = useQuery({ queryKey: ['tum-ogrenciler'], queryFn: tumOgrenciler });

  const liste = useMemo(() => ogrenciler.data ?? [], [ogrenciler.data]);

  const dagilim = useMemo(() => {
    const sayac = new Map<string, number>();
    for (const o of liste) sayac.set(o.durum, (sayac.get(o.durum) ?? 0) + 1);
    return SIRA.filter((d) => sayac.has(d)).map((durum) => ({
      durum,
      adet: sayac.get(durum) ?? 0,
      oran: liste.length ? (sayac.get(durum) ?? 0) / liste.length : 0,
    }));
  }, [liste]);

  const bosluklar = useMemo(
    () => ({
      kocsuz: liste.filter((o) => !o.kocAdi),
      gorusmesiz: liste.filter((o) => !o.sonrakiGorusme),
      plansiz: liste.filter((o) => o.planOrani === 0),
      denemesiz: liste.filter((o) => o.sonNet === null),
    }),
    [liste],
  );

  // Aksiyon bekleyenler: risk sırasına göre, düşük plan oranı öne.
  const dikkat = useMemo(
    () =>
      [...liste]
        .filter((o) => o.durum !== 'yolunda' || !o.kocAdi || !o.sonrakiGorusme)
        .sort((a, b) => SIRA.indexOf(a.durum) - SIRA.indexOf(b.durum) || a.planOrani - b.planOrani),
    [liste],
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div className="stat-grid">
        <BoslukKarti etiket="Koçu atanmamış" adet={bosluklar.kocsuz.length} toplam={liste.length} />
        <BoslukKarti etiket="Görüşmesi planlanmamış" adet={bosluklar.gorusmesiz.length} toplam={liste.length} />
        <BoslukKarti etiket="Haftalık planı boş" adet={bosluklar.plansiz.length} toplam={liste.length} />
        <BoslukKarti etiket="Deneme kaydı yok" adet={bosluklar.denemesiz.length} toplam={liste.length} />
      </div>

      <Kart style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <h3 style={{ fontSize: '1.05rem' }}>Öğrenci durum dağılımı</h3>
        {dagilim.length === 0 && <p className="hint">Henüz öğrenci yok.</p>}
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
          <div className="hint" style={{ borderTop: '1px solid var(--color-border)', paddingTop: 12 }}>
            Ortalama plan tamamlama: <strong>{yuzde(metrik.data.planTamamlama)}</strong> · Bu hafta{' '}
            {sayi(metrik.data.haftalikGorusme)} görüşme ({metrik.data.iptal} iptal) · Koç başına{' '}
            {metrik.data.kocBasinaOgrenci.toLocaleString('tr-TR')} öğrenci
          </div>
        )}
      </Kart>

      <TabloKart>
        <div style={{ display: 'flex', alignItems: 'center', padding: '16px 0 8px', gap: 10, flexWrap: 'wrap' }}>
          <h3 style={{ fontSize: '1.05rem' }}>Aksiyon bekleyen öğrenciler</h3>
          <span className="hint">durumu takip gerektiren, koçu atanmamış ya da görüşmesi planlanmamış öğrenciler</span>
        </div>
        <table className="table">
          <thead>
            <tr>
              <th>Öğrenci</th>
              <th>Koç</th>
              <th>Haftalık plan</th>
              <th className="num">Son net</th>
              <th className="hide-m">Sonraki görüşme</th>
              <th>Durum</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {dikkat.map((o) => (
              <tr key={o.id}>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Avatar ad={o.adSoyad} renk={o.avatarRengi} foto={o.avatarUrl} boy="md" />
                    <strong>{o.adSoyad}</strong>
                  </div>
                </td>
                <td className={o.kocAdi ? undefined : 'hint'}>{o.kocAdi ?? 'atanmadı'}</td>
                <td>
                  <Bar
                    oran={o.planOrani}
                    renk={o.planOrani < 0.2 ? 'var(--color-error)' : o.planOrani < 0.5 ? 'var(--color-urgent)' : undefined}
                    style={{ width: 110 }}
                  />
                </td>
                <td className="num">{o.sonNet === null ? '—' : netBicim(o.sonNet)}</td>
                <td className="hide-m hint">
                  {o.sonrakiGorusme
                    ? `${gunAdi(o.sonrakiGorusme).slice(0, 3)} ${saat(o.sonrakiGorusme)}`
                    : 'planlanmadı'}
                </td>
                <td>
                  <Rozet ton={DURUM_ETIKET[o.durum]?.ton ?? 'info'}>{DURUM_ETIKET[o.durum]?.etiket ?? o.durum}</Rozet>
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
        {!ogrenciler.isLoading && dikkat.length === 0 && (
          <BosDurum baslik="Aksiyon bekleyen öğrenci yok" aciklama="Herkesin koçu, planı ve görüşmesi yerinde." />
        )}
      </TabloKart>
    </div>
  );
}

function BoslukKarti({ etiket, adet, toplam }: { etiket: string; adet: number; toplam: number }) {
  return (
    <Kart style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: 20 }}>
      <div className="hint">{etiket}</div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
        <span
          style={{
            fontFamily: 'var(--font-heading)',
            fontWeight: 700,
            fontSize: '1.7rem',
            color: adet > 0 ? 'var(--color-urgent-deep)' : undefined,
          }}
        >
          {sayi(adet)}
        </span>
        <span className="hint">/ {sayi(toplam)} öğrenci</span>
      </div>
    </Kart>
  );
}
