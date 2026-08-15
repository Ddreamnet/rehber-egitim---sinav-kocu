import { useLayoutEffect, useRef } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import { Kart } from './temel';

/**
 * Tablo kabı.
 *
 * Masaüstünde normal tablo; ≤880px'te satırlar kart yığınına döner
 * (kurallar app.css `.tablo-kart` bloğunda). Sütun adı mobilde satır
 * başlığı olarak lazım olduğu için her hücreye `data-b` damgalıyoruz —
 * yatay kaydırmayı dokunmatikte kimse fark etmiyor.
 */
export function TabloKart({
  children,
  style,
  className,
}: {
  children: ReactNode;
  style?: CSSProperties;
  className?: string;
}) {
  const kap = useRef<HTMLDivElement>(null);

  // Bağımlılık yok: veri geldiğinde çocuklar yeniden render olur, biz de
  // yeni satırları damgalarız.
  useLayoutEffect(() => {
    const tablo = kap.current?.querySelector('table');
    if (!tablo) return;

    const basliklar = Array.from(tablo.querySelectorAll('thead th')).map((th) => th.textContent?.trim() ?? '');

    tablo.querySelectorAll('tbody tr').forEach((tr) => {
      Array.from(tr.children).forEach((hucre, i) => {
        const td = hucre as HTMLTableCellElement;
        // "Kayıt yok" gibi birleşik hücreler tek başına tam satır kalsın.
        if (td.colSpan > 1) {
          td.removeAttribute('data-b');
          td.setAttribute('data-tam', '');
          return;
        }
        const etiket = basliklar[i] ?? '';
        if (etiket) td.setAttribute('data-b', etiket);
        else td.removeAttribute('data-b');
        // İlk sütun kartın başlığı olur: tam genişlik, etiketsiz.
        if (i === 0) td.setAttribute('data-bas', '');
      });
    });
  });

  return (
    <div ref={kap} style={{ display: 'contents' }}>
      <Kart
        className={['tablo-kart', className].filter(Boolean).join(' ')}
        style={{ padding: '8px 24px 16px', overflowX: 'auto', ...style }}
      >
        {children}
      </Kart>
    </div>
  );
}
