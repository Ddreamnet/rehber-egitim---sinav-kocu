/**
 * Blog içeriği için küçük markdown yorumlayıcısı.
 * Desteklenen: ## başlık, paragraf, > alıntı (pull-quote), 1. numaralı plan kartı,
 * ![görsel](url), [bağlantı](url), **kalın**, *italik* ve özel blok:
 *
 *     ```grafik-karsilastirma```
 *
 * Ham HTML işlenmez (metin olarak kaçırılır) — CMS'ten gelen içerik güvenlidir.
 */

import { Fragment, type ReactNode } from 'react';
import { Link } from 'react-router-dom';

type Blok =
  | { tur: 'baslik'; metin: string }
  | { tur: 'paragraf'; metin: string }
  | { tur: 'alinti'; metin: string }
  | { tur: 'liste'; maddeler: string[] }
  | { tur: 'gorsel'; url: string; alt: string }
  | { tur: 'ozel'; ad: string };

function ayristir(kaynak: string): Blok[] {
  const bloklar: Blok[] = [];
  const satirlar = kaynak.replace(/\r\n/g, '\n').split('\n');
  let i = 0;

  while (i < satirlar.length) {
    const s = satirlar[i];

    if (!s.trim()) {
      i++;
      continue;
    }

    const ozel = s.match(/^```(\S+)```?$/) ?? s.match(/^```(\S+)$/);
    if (ozel) {
      bloklar.push({ tur: 'ozel', ad: ozel[1] });
      i++;
      if (satirlar[i]?.trim() === '```') i++;
      continue;
    }

    if (s.startsWith('## ')) {
      bloklar.push({ tur: 'baslik', metin: s.slice(3).trim() });
      i++;
      continue;
    }

    if (s.startsWith('> ')) {
      const parcalar: string[] = [];
      while (i < satirlar.length && satirlar[i].startsWith('> ')) {
        parcalar.push(satirlar[i].slice(2).trim());
        i++;
      }
      bloklar.push({ tur: 'alinti', metin: parcalar.join(' ') });
      continue;
    }

    if (/^\d+\.\s/.test(s)) {
      const maddeler: string[] = [];
      while (i < satirlar.length && /^\d+\.\s/.test(satirlar[i])) {
        maddeler.push(satirlar[i].replace(/^\d+\.\s/, '').trim());
        i++;
      }
      bloklar.push({ tur: 'liste', maddeler });
      continue;
    }

    const gorsel = s.match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
    if (gorsel) {
      bloklar.push({ tur: 'gorsel', alt: gorsel[1], url: gorsel[2] });
      i++;
      continue;
    }

    const parcalar: string[] = [];
    while (i < satirlar.length && satirlar[i].trim() && !/^(##\s|>\s|\d+\.\s|!\[|```)/.test(satirlar[i])) {
      parcalar.push(satirlar[i].trim());
      i++;
    }
    bloklar.push({ tur: 'paragraf', metin: parcalar.join(' ') });
  }

  return bloklar;
}

/** **kalın**, *italik* ve [bağlantı](url) işaretlerini React düğümlerine çevirir. */
function satirIci(metin: string): ReactNode {
  const parcalar: ReactNode[] = [];
  const desen = /(\*\*[^*]+\*\*|\*[^*]+\*|\[[^\]]+\]\([^)]+\))/g;
  let son = 0;
  let eslesme: RegExpExecArray | null;
  let sira = 0;

  while ((eslesme = desen.exec(metin))) {
    if (eslesme.index > son) parcalar.push(metin.slice(son, eslesme.index));
    const p = eslesme[0];
    if (p.startsWith('**')) {
      parcalar.push(<strong key={sira++}>{p.slice(2, -2)}</strong>);
    } else if (p.startsWith('*')) {
      parcalar.push(<em key={sira++}>{p.slice(1, -1)}</em>);
    } else {
      const m = p.match(/^\[([^\]]+)\]\(([^)]+)\)$/)!;
      const [, etiket, url] = m;
      parcalar.push(
        url.startsWith('/') ? (
          <Link key={sira++} to={url}>
            {etiket}
          </Link>
        ) : (
          <a key={sira++} href={url} rel="noreferrer noopener" target="_blank">
            {etiket}
          </a>
        ),
      );
    }
    son = eslesme.index + p.length;
  }
  if (son < metin.length) parcalar.push(metin.slice(son));
  return parcalar.map((p, i) => <Fragment key={i}>{p}</Fragment>);
}

export function Markdown({
  metin,
  ozelBloklar,
}: {
  metin: string;
  /** ```ad``` bloklarına karşılık gelen bileşenler */
  ozelBloklar?: Record<string, ReactNode>;
}) {
  const bloklar = ayristir(metin);
  let ilkParagrafGorüldü = false;

  return (
    <>
      {bloklar.map((b, i) => {
        switch (b.tur) {
          case 'baslik':
            return (
              <section key={i} style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 12 }}>
                <h2 style={{ fontSize: '1.5rem' }}>{b.metin}</h2>
              </section>
            );
          case 'paragraf': {
            const lead = !ilkParagrafGorüldü;
            ilkParagrafGorüldü = true;
            return (
              <p
                key={i}
                style={
                  lead
                    ? { fontSize: '1.2rem', lineHeight: 1.7, color: 'var(--color-text-muted)' }
                    : { lineHeight: 1.7 }
                }
              >
                {satirIci(b.metin)}
              </p>
            );
          }
          case 'alinti':
            return <blockquote key={i}>{satirIci(b.metin)}</blockquote>;
          case 'liste':
            return (
              <div
                key={i}
                className="card"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 14,
                  background: 'var(--color-primary-soft)',
                  boxShadow: 'none',
                }}
              >
                {b.maddeler.map((m, j) => (
                  <div key={j} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                    <span
                      style={{
                        width: 26,
                        height: 26,
                        borderRadius: 9,
                        background: 'var(--color-primary)',
                        color: 'var(--color-on-primary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontFamily: 'var(--font-heading)',
                        fontWeight: 600,
                        fontSize: '.8rem',
                        flex: 'none',
                      }}
                    >
                      {j + 1}
                    </span>
                    <p style={{ lineHeight: 1.6, fontSize: '.95rem' }}>{satirIci(m)}</p>
                  </div>
                ))}
              </div>
            );
          case 'gorsel':
            return (
              <img
                key={i}
                src={b.url}
                alt={b.alt}
                style={{ width: '100%', borderRadius: 'var(--radius-card)' }}
                loading="lazy"
              />
            );
          case 'ozel':
            return <Fragment key={i}>{ozelBloklar?.[b.ad] ?? null}</Fragment>;
          default:
            return null;
        }
      })}
    </>
  );
}
