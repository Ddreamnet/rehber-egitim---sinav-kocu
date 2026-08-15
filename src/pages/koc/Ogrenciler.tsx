import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { CalendarDays, TrendingUp, TriangleAlert, Users } from 'lucide-react';
import { Avatar, Bar, Buton, Kart, Rozet } from '@/components/ui/temel';
import { Sparkline } from '@/components/grafik';
import { degisim, gunAdi, net as netBicim, saat } from '@/lib/format';
import { useOturum } from '@/auth/Oturum';
import { kocGorusmeleri, ogrencilerim } from '@/data/repo';
import type { OgrenciOzeti } from '@/data/tipler';

const DURUM: Record<OgrenciOzeti['durum'], { etiket: string; ton: 'success' | 'warning' | 'error' | 'info' }> = {
  yolunda: { etiket: 'Yolunda', ton: 'success' },
  gecikti: { etiket: 'Plan gecikti', ton: 'warning' },
  riskli: { etiket: 'Riskli', ton: 'error' },
  yeni: { etiket: 'Yeni', ton: 'info' },
};

export default function KocOgrenciler() {
  const { profil } = useOturum();
  const kocId = profil?.id ?? '';
  const git = useNavigate();

  const ogrenciler = useQuery({ queryKey: ['ogrencilerim', kocId], queryFn: () => ogrencilerim(kocId) });
  const gorusmeler = useQuery({ queryKey: ['koc-gorusmeleri', kocId], queryFn: () => kocGorusmeleri(kocId) });

  const istatistik = useMemo(() => {
    const liste = ogrenciler.data ?? [];
    const bugun = new Date().toDateString();
    const bugunku = (gorusmeler.data ?? []).filter((g) => new Date(g.baslangic).toDateString() === bugun).length;
    const geciken = liste.filter((o) => o.durum === 'gecikti' || o.durum === 'riskli').length;
    const degisimler = liste
      .filter((o) => o.netTrendi.length > 1)
      .map((o) => o.netTrendi[o.netTrendi.length - 1] - o.netTrendi[0]);
    const ortDegisim = degisimler.length ? degisimler.reduce((a, b) => a + b, 0) / degisimler.length : 0;
    return { aktif: liste.length, bugunku, geciken, ortDegisim };
  }, [ogrenciler.data, gorusmeler.data]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 16 }}>
        <StatKarti
          ikon={<Users size={19} />}
          zemin="var(--color-primary-soft)"
          renk="var(--color-primary)"
          deger={String(istatistik.aktif)}
          etiket="aktif öğrenci"
        />
        <StatKarti
          ikon={<CalendarDays size={19} />}
          zemin="var(--ders-fen)"
          renk="var(--on-pastel)"
          deger={String(istatistik.bugunku)}
          etiket="bugün görüşme"
        />
        <StatKarti
          ikon={<TriangleAlert size={19} />}
          zemin="var(--color-urgent-soft)"
          renk="var(--color-urgent-deep)"
          deger={String(istatistik.geciken)}
          etiket="plan gecikti"
        />
        <StatKarti
          ikon={<TrendingUp size={19} />}
          zemin="var(--ders-sosyal)"
          renk="var(--on-pastel)"
          deger={degisim(istatistik.ortDegisim)}
          etiket="ort. net değişimi"
        />
      </div>

      <Kart style={{ padding: '8px 24px 16px', overflowX: 'auto' }}>
        <table className="table">
          <thead>
            <tr>
              <th>Öğrenci</th>
              <th>Sınav</th>
              <th>Haftalık plan</th>
              <th className="hide-m">Net trendi</th>
              <th className="num">Son net</th>
              <th>Sonraki görüşme</th>
              <th>Durum</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {ogrenciler.data?.map((o) => {
              const trendRengi =
                o.netTrendi.length > 1
                  ? o.netTrendi[o.netTrendi.length - 1] >= o.netTrendi[0]
                    ? 'var(--color-success)'
                    : 'var(--color-error)'
                  : 'var(--color-text-muted)';
              const planRengi =
                o.planOrani < 0.2 ? 'var(--color-error)' : o.planOrani < 0.5 ? 'var(--color-urgent)' : undefined;

              return (
                <tr key={o.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <Avatar ad={o.adSoyad} renk={o.avatarRengi} boy="md" />
                      <strong>{o.adSoyad}</strong>
                    </div>
                  </td>
                  <td>{o.sinav}</td>
                  <td>
                    <Bar oran={o.planOrani} renk={planRengi} style={{ width: 110 }} />
                  </td>
                  <td className="hide-m">
                    <Sparkline noktalar={o.netTrendi} renk={trendRengi} />
                  </td>
                  <td className="num">{o.sonNet === null ? '—' : netBicim(o.sonNet)}</td>
                  <td className="hint">
                    {o.sonrakiGorusme
                      ? `${gunAdi(o.sonrakiGorusme).slice(0, 3)} ${saat(o.sonrakiGorusme)}`
                      : 'planlanmadı'}
                  </td>
                  <td>
                    <Rozet ton={DURUM[o.durum].ton}>{DURUM[o.durum].etiket}</Rozet>
                  </td>
                  <td>
                    <Buton tip="outline" boy="sm" onClick={() => git(`/koc/ogrenci/${o.id}`)}>
                      Detay
                    </Buton>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Kart>
    </div>
  );
}

function StatKarti({
  ikon,
  zemin,
  renk,
  deger,
  etiket,
}: {
  ikon: React.ReactNode;
  zemin: string;
  renk: string;
  deger: string;
  etiket: string;
}) {
  return (
    <Kart style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '18px 20px' }}>
      <span
        style={{
          width: 42,
          height: 42,
          borderRadius: 13,
          background: zemin,
          color: renk,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flex: 'none',
        }}
      >
        {ikon}
      </span>
      <div>
        <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '1.3rem' }}>{deger}</div>
        <div className="hint">{etiket}</div>
      </div>
    </Kart>
  );
}
