import { Link } from 'react-router-dom';
import { BookOpen, CalendarDays, Clock, FileText, MessageCircle, Target, TrendingUp } from 'lucide-react';
import type { ReactNode } from 'react';
import { Chip } from '@/components/ui/temel';
import { tarihKisa } from '@/lib/format';
import type { Yazi } from '@/data/tipler';

/** Kategoriye göre pastel gradyan kapak + ikon (gerçek görsel gelene kadar). */
const KATEGORI: Record<string, { gradyan: string; chip?: string; ikon: ReactNode }> = {
  Matematik: {
    gradyan: 'linear-gradient(135deg,var(--ders-matematik),var(--indigo-100))',
    chip: 'var(--ders-matematik)',
    ikon: <TrendingUp size={42} strokeWidth={1.6} />,
  },
  Strateji: {
    gradyan: 'linear-gradient(135deg,var(--indigo-100),var(--ders-dil))',
    ikon: <Target size={42} strokeWidth={1.6} />,
  },
  Planlama: {
    gradyan: 'linear-gradient(135deg,var(--ders-fen),var(--mint-50))',
    chip: 'var(--ders-fen)',
    ikon: <Clock size={42} strokeWidth={1.6} />,
  },
  Türkçe: {
    gradyan: 'linear-gradient(135deg,var(--ders-turkce),var(--indigo-50))',
    chip: 'var(--ders-turkce)',
    ikon: <BookOpen size={42} strokeWidth={1.6} />,
  },
  Alışkanlık: {
    gradyan: 'linear-gradient(135deg,var(--ders-sosyal),var(--amber-100))',
    chip: 'var(--ders-sosyal)',
    ikon: <CalendarDays size={42} strokeWidth={1.6} />,
  },
  'Veliler için': {
    gradyan: 'linear-gradient(135deg,var(--ders-dil),var(--rose-100))',
    chip: 'var(--ders-dil)',
    ikon: <MessageCircle size={42} strokeWidth={1.6} />,
  },
};

const VARSAYILAN = {
  gradyan: 'linear-gradient(135deg,var(--indigo-100),var(--ders-matematik))',
  chip: undefined,
  ikon: <FileText size={42} strokeWidth={1.6} />,
};

export function kategoriStili(kategori: string) {
  return KATEGORI[kategori] ?? VARSAYILAN;
}

export function BlogKapagi({
  kategori,
  yukseklik = 150,
  kapakUrl,
  baslik,
}: {
  kategori: string;
  yukseklik?: number;
  kapakUrl?: string | null;
  /** Alt metni için yazı başlığı; verilmezse kapak dekoratif sayılır. */
  baslik?: string;
}) {
  const s = kategoriStili(kategori);
  if (kapakUrl) {
    return (
      <div style={{ height: yukseklik, overflow: 'hidden' }}>
        <img
          src={kapakUrl}
          alt={baslik ? `${baslik} — ${kategori}` : ''}
          loading="lazy"
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      </div>
    );
  }
  return (
    <div
      style={{
        height: yukseklik,
        background: s.gradyan,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--on-pastel)',
        opacity: 0.99,
      }}
      aria-hidden="true"
    >
      <span style={{ opacity: 0.75 }}>{s.ikon}</span>
    </div>
  );
}

/** Blog ızgarasındaki kart (landing teaser + blog indeks). */
export function BlogKarti({ yazi, ozetGoster = true }: { yazi: Yazi; ozetGoster?: boolean }) {
  const s = kategoriStili(yazi.kategori);
  return (
    <Link
      to={`/blog/${yazi.slug}`}
      className="card card-interactive"
      style={{ padding: 0, overflow: 'hidden', color: 'var(--color-text)', display: 'flex', flexDirection: 'column' }}
    >
      <BlogKapagi kategori={yazi.kategori} kapakUrl={yazi.kapakUrl} baslik={yazi.baslik} />
      <div style={{ padding: '20px 24px 24px', display: 'flex', flexDirection: 'column', gap: 10, flex: 1 }}>
        <Chip renk={s.chip} style={{ alignSelf: 'flex-start', height: 24, fontSize: '.74rem' }}>
          {yazi.kategori}
        </Chip>
        <h3 style={{ fontSize: '1.08rem', lineHeight: 1.35 }}>{yazi.baslik}</h3>
        {ozetGoster && (
          <p className="hint" style={{ lineHeight: 1.55 }}>
            {yazi.ozet}
          </p>
        )}
        <span className="hint" style={{ marginTop: 'auto' }}>
          {yazi.okumaDk} dk · {tarihKisa(yazi.yayinTarihi)}
        </span>
      </div>
    </Link>
  );
}
