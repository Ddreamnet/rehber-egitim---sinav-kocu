import { Bar, Nokta, Rozet } from '@/components/ui/temel';
import { TabloKart } from '@/components/ui/TabloKart';
import { net as netBicim, sayi, tarihKisa, yuzde } from '@/lib/format';
import type { DersBazliOzet } from '@/data/repo';

/**
 * Ders bazlı toplam tablo.
 *
 * Panellerde yalnız yüzde ve "bu hafta" vardı; öğrencinin başlangıçtan bugüne
 * hangi dersten kaç soru çözdüğü hiçbir yerde toplu görünmüyordu. Aynı tablo
 * öğrenci ve koç panelinde kullanılıyor; koç sürümünde ek sütunlar açılıyor.
 */
export function DersOzetTablosu({
  dersler,
  baslik = 'Ders bazlı toplam',
  detayli = false,
  ustEkstra,
}: {
  dersler: DersBazliOzet[];
  baslik?: string;
  /** Koç sürümü: D/Y/B, başarı, son 4 hafta ve son giriş sütunları */
  detayli?: boolean;
  ustEkstra?: React.ReactNode;
}) {
  const t = {
    toplam: dersler.reduce((a, d) => a + d.toplam, 0),
    dogru: dersler.reduce((a, d) => a + d.dogru, 0),
    yanlis: dersler.reduce((a, d) => a + d.yanlis, 0),
    bos: dersler.reduce((a, d) => a + d.bos, 0),
    net: dersler.reduce((a, d) => a + d.net, 0),
    buHafta: dersler.reduce((a, d) => a + d.buHafta, 0),
    sonDortHafta: dersler.reduce((a, d) => a + d.sonDortHafta, 0),
    konuTamam: dersler.reduce((a, d) => a + d.konuTamam, 0),
    konuToplam: dersler.reduce((a, d) => a + d.konuToplam, 0),
  };

  return (
    <TabloKart>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 0 8px', flexWrap: 'wrap' }}>
        <h3 style={{ fontSize: '1.05rem' }}>{baslik}</h3>
        <Rozet>{sayi(t.toplam)} soru</Rozet>
        <Rozet ton="primary">{netBicim(t.net)} net</Rozet>
        {ustEkstra}
      </div>

      <table className="table tablo-ozet">
        <thead>
          <tr>
            <th>Ders</th>
            <th className="num">Toplam soru</th>
            {detayli && <th className="num">D</th>}
            {detayli && <th className="num">Y</th>}
            {detayli && <th className="num">B</th>}
            <th className="num">Net</th>
            <th className="num">Başarı</th>
            <th className="num">Bu hafta</th>
            {detayli && <th className="num hide-m">Son 4 hafta</th>}
            <th>Konu ilerlemesi</th>
            {detayli && <th className="hide-m">Son giriş</th>}
          </tr>
        </thead>
        <tbody>
          {dersler.map((d) => (
            <tr key={d.dersId}>
              <td>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Nokta renk={d.renk} />
                  <strong>{d.ad}</strong>
                </div>
              </td>
              <td className="num">
                <strong>{sayi(d.toplam)}</strong>
              </td>
              {detayli && <td className="num" style={{ color: 'var(--color-success-deep)' }}>{sayi(d.dogru)}</td>}
              {detayli && <td className="num" style={{ color: 'var(--color-error-deep)' }}>{sayi(d.yanlis)}</td>}
              {detayli && <td className="num hint">{sayi(d.bos)}</td>}
              <td className="num">{netBicim(d.net)}</td>
              <td className="num">{d.toplam ? yuzde(d.basari) : '—'}</td>
              <td className="num">{d.buHafta ? sayi(d.buHafta) : '—'}</td>
              {detayli && <td className="num hide-m">{d.sonDortHafta ? sayi(d.sonDortHafta) : '—'}</td>}
              <td>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Bar oran={d.konuToplam ? d.konuTamam / d.konuToplam : 0} renk={d.renk} style={{ width: 90 }} />
                  <span className="hint" style={{ fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>
                    {d.konuTamam}/{d.konuToplam}
                  </span>
                </div>
              </td>
              {detayli && <td className="hide-m hint">{d.sonGiris ? tarihKisa(d.sonGiris) : '—'}</td>}
            </tr>
          ))}

          {/* Toplam satırı — koçun aradığı "toplu görünüm" */}
          <tr className="tablo-toplam">
            <td>
              <strong>Toplam</strong>
            </td>
            <td className="num">
              <strong>{sayi(t.toplam)}</strong>
            </td>
            {detayli && <td className="num">{sayi(t.dogru)}</td>}
            {detayli && <td className="num">{sayi(t.yanlis)}</td>}
            {detayli && <td className="num">{sayi(t.bos)}</td>}
            <td className="num">
              <strong>{netBicim(t.net)}</strong>
            </td>
            <td className="num">{t.toplam ? yuzde(t.dogru / t.toplam) : '—'}</td>
            <td className="num">
              <strong>{t.buHafta ? sayi(t.buHafta) : '—'}</strong>
            </td>
            {detayli && <td className="num hide-m">{t.sonDortHafta ? sayi(t.sonDortHafta) : '—'}</td>}
            <td>
              <span className="hint" style={{ fontVariantNumeric: 'tabular-nums' }}>
                {t.konuTamam}/{t.konuToplam} konu
              </span>
            </td>
            {detayli && <td className="hide-m" />}
          </tr>
        </tbody>
      </table>

      {t.toplam === 0 && (
        <p className="hint" style={{ padding: '4px 0 12px' }}>
          Henüz soru girişi yok. Girişler yapıldıkça ders bazlı toplamlar burada birikir.
        </p>
      )}
    </TabloKart>
  );
}
