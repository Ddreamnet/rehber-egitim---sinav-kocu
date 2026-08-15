import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Check, MessageCircle, SquarePen, TriangleAlert } from 'lucide-react';
import type { ReactNode } from 'react';
import { Avatar, Bar, ButonLink, Kart, Rozet } from '@/components/ui/temel';
import { BuyumeGrafigi } from '@/components/grafik';
import { degisim, sayi, yuzde } from '@/lib/format';
import { adminMetrikleri, aktiviteler, koclar, ogrenciBuyumesi } from '@/data/repo';
import type { Aktivite } from '@/data/tipler';

const AKTIVITE_STILI: Record<Aktivite['tur'], { zemin: string; renk: string; ikon: ReactNode }> = {
  kayit: {
    zemin: 'var(--color-success-soft)',
    renk: 'var(--color-success-deep)',
    ikon: <Check size={14} strokeWidth={2.5} />,
  },
  uyari: { zemin: 'var(--color-urgent-soft)', renk: 'var(--color-urgent-deep)', ikon: <TriangleAlert size={14} /> },
  gorusme: { zemin: 'var(--color-info-soft)', renk: 'var(--color-info-deep)', ikon: <MessageCircle size={14} /> },
  blog: { zemin: 'var(--color-primary-soft)', renk: 'var(--color-primary)', ikon: <SquarePen size={14} /> },
};

/** **kalın** işaretlerini kalın metne çevirir (aktivite akışı). */
function vurgulu(metin: string): ReactNode {
  return metin.split(/(\*\*[^*]+\*\*)/).map((p, i) =>
    p.startsWith('**') ? <strong key={i}>{p.slice(2, -2)}</strong> : <span key={i}>{p}</span>,
  );
}

export default function AdminGenelBakis() {
  const metrik = useQuery({ queryKey: ['admin-metrikleri'], queryFn: adminMetrikleri });
  const buyume = useQuery({ queryKey: ['ogrenci-buyumesi'], queryFn: ogrenciBuyumesi });
  const akis = useQuery({ queryKey: ['aktiviteler'], queryFn: aktiviteler });
  const kocListesi = useQuery({ queryKey: ['koclar'], queryFn: koclar });

  const m = metrik.data;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 16 }}>
        <MetrikKarti
          etiket="Aktif öğrenci"
          deger={m ? sayi(m.aktifOgrenci) : '—'}
          rozet={m ? <Rozet ton="success">+{m.ogrenciArtisi} bu ay</Rozet> : null}
        />
        <MetrikKarti
          etiket="Koç"
          deger={m ? sayi(m.kocSayisi) : '—'}
          rozet={m ? <span className="hint">ort. {m.kocBasinaOgrenci.toLocaleString('tr-TR')} öğrenci</span> : null}
        />
        <MetrikKarti
          etiket="Bu hafta görüşme"
          deger={m ? sayi(m.haftalikGorusme) : '—'}
          rozet={m && m.iptal > 0 ? <Rozet ton="warning">{m.iptal} iptal</Rozet> : null}
        />
        <MetrikKarti
          etiket="Plan tamamlama (ort.)"
          deger={m ? yuzde(m.planTamamlama) : '—'}
          rozet={
            m && m.planTamamlamaArtisi ? <Rozet ton="success">+{m.planTamamlamaArtisi} puan</Rozet> : null
          }
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(320px,1fr))', gap: 24 }}>
        <Kart style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
            <h3 style={{ fontSize: '1.05rem' }}>Öğrenci büyümesi</h3>
            <span className="hint" style={{ marginLeft: 'auto' }}>
              son 6 ay
            </span>
          </div>
          {buyume.data && <BuyumeGrafigi veri={buyume.data} />}
        </Kart>

        <Kart style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <h3 style={{ fontSize: '1.05rem' }}>Son aktiviteler</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: '.88rem' }}>
            {akis.data?.map((a, i) => {
              const s = AKTIVITE_STILI[a.tur] ?? AKTIVITE_STILI.kayit;
              return (
                <div
                  key={a.id}
                  style={{
                    display: 'flex',
                    gap: 12,
                    alignItems: 'flex-start',
                    padding: '10px 0',
                    borderBottom: i === (akis.data?.length ?? 0) - 1 ? undefined : '1px solid var(--color-border)',
                  }}
                >
                  <span
                    style={{
                      width: 30,
                      height: 30,
                      borderRadius: 10,
                      background: s.zemin,
                      color: s.renk,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flex: 'none',
                    }}
                  >
                    {s.ikon}
                  </span>
                  <div>
                    {vurgulu(a.metin)}
                    <div className="hint" style={{ fontSize: '.74rem', marginTop: 2 }}>
                      {a.zaman}
                    </div>
                  </div>
                </div>
              );
            })}
            {!akis.data?.length && <p className="hint">Henüz aktivite yok.</p>}
          </div>
        </Kart>
      </div>

      <Kart style={{ padding: '8px 24px 16px', overflowX: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', padding: '16px 0 8px' }}>
          <h3 style={{ fontSize: '1.05rem' }}>Koçlar</h3>
          <ButonLink tip="outline" boy="sm" to="/admin/koclar" style={{ marginLeft: 'auto' }}>
            Koç ekle
          </ButonLink>
        </div>
        <table className="table">
          <thead>
            <tr>
              <th>Koç</th>
              <th className="num">Öğrenci</th>
              <th>Ort. plan tamamlama</th>
              <th className="num">Bu hafta görüşme</th>
              <th className="num">Ort. net değişimi</th>
              <th>Durum</th>
            </tr>
          </thead>
          <tbody>
            {kocListesi.data?.map((k) => (
              <tr key={k.id}>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Avatar ad={k.adSoyad} renk={k.avatarRengi} boy="md" />
                    <Link to={`/admin/koc/${k.id}`} style={{ color: 'var(--color-text)', fontWeight: 700 }}>
                      {k.adSoyad}
                    </Link>
                  </div>
                </td>
                <td className="num">{k.ogrenciSayisi}</td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Bar
                      oran={k.planTamamlama}
                      renk={k.planTamamlama < 0.6 ? 'var(--color-urgent)' : undefined}
                      style={{ width: 130 }}
                    />
                    <span className="hint">{yuzde(k.planTamamlama)}</span>
                  </div>
                </td>
                <td className="num">{k.haftalikGorusme}</td>
                <td
                  className="num"
                  style={{ color: k.netDegisimi > 1 ? 'var(--color-success-deep)' : 'var(--color-text-muted)' }}
                >
                  {degisim(k.netDegisimi)}
                </td>
                <td>
                  <Rozet ton={k.durum === 'takipte' ? 'warning' : 'success'}>
                    {k.durum === 'cokIyi' ? 'Çok iyi' : k.durum === 'iyi' ? 'İyi' : 'Takipte'}
                  </Rozet>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Kart>
    </div>
  );
}

function MetrikKarti({ etiket, deger, rozet }: { etiket: string; deger: string; rozet: ReactNode }) {
  return (
    <Kart style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: 20 }}>
      <div className="hint">{etiket}</div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
        <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '1.7rem' }}>{deger}</span>
        {rozet}
      </div>
    </Kart>
  );
}
