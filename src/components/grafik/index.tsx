/**
 * Grafikler — Chart.js (brief §2.5: bar+çizgi kombosu, alan, donut).
 * Renkler ders token'larından okunur; ızgara açık, eksen etiketleri muted.
 * Canvas CSS değişkeni okuyamadığı için token'lar `tokenRengi()` ile çözülür.
 */

import { useMemo } from 'react';
import {
  ArcElement,
  BarController,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LineController,
  LineElement,
  LinearScale,
  PointElement,
  Tooltip,
  type ChartOptions,
} from 'chart.js';
import { Chart, Doughnut, Line } from 'react-chartjs-2';
import { opaklik, tokenRengi } from '@/lib/renk';
import { net as netBicim, sayi } from '@/lib/format';
import type { DersDagilimi, Deneme, HaftalikSeri } from '@/data/tipler';

ChartJS.register(
  ArcElement,
  BarController,
  BarElement,
  CategoryScale,
  Filler,
  Legend,
  LineController,
  LineElement,
  LinearScale,
  PointElement,
  Tooltip,
);

function eksenRenkleri() {
  return {
    izgara: tokenRengi('--color-border'),
    metin: tokenRengi('--color-text-muted'),
    yuzey: tokenRengi('--color-surface'),
    kenar: tokenRengi('--color-border'),
    yazi: tokenRengi('--color-text'),
  };
}

function ortakSecenekler(): ChartOptions<any> {
  const r = eksenRenkleri();
  return {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: r.yuzey,
        titleColor: r.yazi,
        bodyColor: r.metin,
        borderColor: r.kenar,
        borderWidth: 1,
        padding: 12,
        cornerRadius: 12,
        displayColors: true,
        boxPadding: 4,
      },
    },
    font: { family: 'Inter' },
  };
}

// ---------- Haftalık çözülen soru + ortalama net (bar + çizgi) ----------

export function SoruNetGrafigi({ seri }: { seri: HaftalikSeri[] }) {
  const { data, options } = useMemo(() => {
    const r = eksenRenkleri();
    const barRenk = tokenRengi('--color-primary-soft-2');
    const cizgiRenk = tokenRengi('--color-accent');

    return {
      data: {
        labels: seri.map((s) => s.etiket),
        datasets: [
          {
            type: 'bar' as const,
            label: 'Çözülen soru',
            data: seri.map((s) => s.cozulenSoru),
            backgroundColor: barRenk,
            borderRadius: 7,
            borderSkipped: false,
            yAxisID: 'soru',
            order: 2,
          },
          {
            type: 'line' as const,
            label: 'Ortalama net',
            data: seri.map((s) => s.ortalamaNet),
            borderColor: cizgiRenk,
            backgroundColor: cizgiRenk,
            borderWidth: 3.5,
            pointRadius: 4.5,
            pointHoverRadius: 6,
            tension: 0.25,
            yAxisID: 'net',
            order: 1,
          },
        ],
      },
      options: {
        ...ortakSecenekler(),
        scales: {
          x: {
            grid: { display: false },
            border: { display: false },
            ticks: { color: r.metin, font: { size: 12 } },
          },
          soru: {
            position: 'left' as const,
            beginAtZero: true,
            grid: { color: r.izgara, drawTicks: false },
            border: { display: false, dash: [3, 5] },
            ticks: { color: r.metin, font: { size: 11 }, maxTicksLimit: 5 },
          },
          net: {
            position: 'right' as const,
            grid: { display: false },
            border: { display: false },
            ticks: {
              color: r.metin,
              font: { size: 11 },
              maxTicksLimit: 5,
              callback: (v: any) => netBicim(Number(v)),
            },
          },
        },
        plugins: {
          ...ortakSecenekler().plugins,
          tooltip: {
            ...ortakSecenekler().plugins!.tooltip,
            callbacks: {
              label: (ctx: any) =>
                ctx.dataset.yAxisID === 'net'
                  ? `Ortalama net: ${netBicim(ctx.parsed.y)}`
                  : `Çözülen soru: ${sayi(ctx.parsed.y)}`,
            },
          },
        },
      } as ChartOptions<any>,
    };
  }, [seri]);

  return (
    <div style={{ height: 220 }}>
      <Chart type="bar" data={data} options={options} aria-label="Haftalık çözülen soru ve ortalama net" />
    </div>
  );
}

// ---------- Ders dağılımı (donut) ----------

export function DersDonutu({ dagilim }: { dagilim: DersDagilimi[] }) {
  const toplam = dagilim.reduce((a, d) => a + d.soru, 0);

  const { data, options } = useMemo(
    () => ({
      data: {
        labels: dagilim.map((d) => d.ad),
        datasets: [
          {
            data: dagilim.map((d) => d.soru),
            backgroundColor: dagilim.map((d) => tokenRengi(d.renk)),
            borderWidth: 0,
            hoverOffset: 6,
          },
        ],
      },
      options: {
        ...ortakSecenekler(),
        cutout: '72%',
        plugins: {
          ...ortakSecenekler().plugins,
          tooltip: {
            ...ortakSecenekler().plugins!.tooltip,
            callbacks: {
              label: (ctx: any) => ` ${ctx.label}: ${sayi(ctx.parsed)} soru`,
            },
          },
        },
      } as ChartOptions<'doughnut'>,
    }),
    [dagilim],
  );

  return (
    <div style={{ position: 'relative', width: 140, height: 140, flex: 'none' }}>
      <Doughnut data={data} options={options} aria-label="Ders dağılımı" />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          pointerEvents: 'none',
        }}
      >
        <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '1.25rem' }}>
          {sayi(toplam)}
        </span>
        <span className="hint" style={{ fontSize: '.66rem' }}>
          soru / ay
        </span>
      </div>
    </div>
  );
}

// ---------- Net gelişimi (alan grafiği) ----------

export function NetAlanGrafigi({ denemeler }: { denemeler: Deneme[] }) {
  const { data, options } = useMemo(() => {
    const r = eksenRenkleri();
    const cizgi = tokenRengi('--color-primary');
    return {
      data: {
        labels: denemeler.map((d) => d.ad),
        datasets: [
          {
            data: denemeler.map((d) => d.net),
            borderColor: cizgi,
            borderWidth: 3,
            pointRadius: 4,
            pointHoverRadius: 6,
            pointBackgroundColor: cizgi,
            tension: 0.3,
            fill: true,
            backgroundColor: (ctx: any) => {
              const { chart } = ctx;
              if (!chart.chartArea) return opaklik('--color-primary', 0.15);
              const g = chart.ctx.createLinearGradient(0, chart.chartArea.top, 0, chart.chartArea.bottom);
              g.addColorStop(0, opaklik('--color-primary', 0.25));
              g.addColorStop(1, opaklik('--color-primary', 0));
              return g;
            },
          },
        ],
      },
      options: {
        ...ortakSecenekler(),
        scales: {
          x: { grid: { display: false }, border: { display: false }, ticks: { color: r.metin, font: { size: 11 } } },
          y: {
            grid: { color: r.izgara },
            border: { display: false, dash: [3, 5] },
            ticks: { color: r.metin, font: { size: 11 }, maxTicksLimit: 4, callback: (v: any) => netBicim(Number(v)) },
          },
        },
        plugins: {
          ...ortakSecenekler().plugins,
          tooltip: {
            ...ortakSecenekler().plugins!.tooltip,
            callbacks: { label: (ctx: any) => ` ${netBicim(ctx.parsed.y)} net` },
          },
        },
      } as ChartOptions<'line'>,
    };
  }, [denemeler]);

  return (
    <div style={{ height: 150 }}>
      <Line data={data} options={options} aria-label="Net gelişimi" />
    </div>
  );
}

// ---------- Öğrenci büyümesi (admin) ----------

export function BuyumeGrafigi({ veri }: { veri: Array<{ ay: string; sayi: number }> }) {
  const { data, options } = useMemo(() => {
    const r = eksenRenkleri();
    const soluk = tokenRengi('--color-primary-soft-2');
    const vurgu = tokenRengi('--color-primary');
    return {
      data: {
        labels: veri.map((v) => v.ay),
        datasets: [
          {
            data: veri.map((v) => v.sayi),
            backgroundColor: veri.map((_, i) => (i === veri.length - 1 ? vurgu : soluk)),
            borderRadius: 9,
            borderSkipped: false,
          },
        ],
      },
      options: {
        ...ortakSecenekler(),
        scales: {
          x: { grid: { display: false }, border: { display: false }, ticks: { color: r.metin, font: { size: 12 } } },
          y: {
            beginAtZero: true,
            grid: { color: r.izgara },
            border: { display: false, dash: [3, 5] },
            ticks: { color: r.metin, font: { size: 11 }, maxTicksLimit: 4 },
          },
        },
        plugins: {
          ...ortakSecenekler().plugins,
          tooltip: {
            ...ortakSecenekler().plugins!.tooltip,
            callbacks: { label: (ctx: any) => ` ${sayi(ctx.parsed.y)} öğrenci` },
          },
        },
      } as ChartOptions<'bar'>,
    };
  }, [veri]);

  return (
    <div style={{ height: 190 }}>
      <Chart type="bar" data={data} options={options} aria-label="Öğrenci büyümesi" />
    </div>
  );
}

// ---------- Sparkline (tablo hücresi — küçük olduğu için satır içi SVG) ----------

export function Sparkline({ noktalar, renk }: { noktalar: number[]; renk: string }) {
  if (noktalar.length < 2) return <span className="hint">yeni</span>;
  const en = Math.min(...noktalar);
  const boy = Math.max(...noktalar);
  const aralik = boy - en || 1;
  const yol = noktalar
    .map((n, i) => {
      const x = 2 + (i * 60) / (noktalar.length - 1);
      const y = 18 - ((n - en) / aralik) * 14;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');
  return (
    <svg width="64" height="22" viewBox="0 0 64 22" aria-hidden="true">
      <polyline points={yol} fill="none" stroke={renk} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
