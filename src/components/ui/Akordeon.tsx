import { ChevronDown } from 'lucide-react';
import type { CSSProperties, ReactNode } from 'react';

/**
 * Native <details> akordeonu (tasarımdaki `.acc` sınıfı).
 * Klavye ve ekran okuyucu davranışı tarayıcıdan gelir.
 */
export function Akordeon({
  ozet,
  varsayilanAcik,
  kartMi = true,
  ozetStyle,
  style,
  className,
  children,
}: {
  ozet: ReactNode;
  varsayilanAcik?: boolean;
  /** Kart yüzeyi üstünde mi duruyor? (iç içe akordeonlarda false) */
  kartMi?: boolean;
  ozetStyle?: CSSProperties;
  style?: CSSProperties;
  className?: string;
  children: ReactNode;
}) {
  return (
    <details
      className={['acc', kartMi ? 'card' : '', className].filter(Boolean).join(' ')}
      open={varsayilanAcik}
      style={kartMi ? { padding: 0, overflow: 'hidden', ...style } : style}
    >
      <summary style={{ padding: '18px 24px', ...ozetStyle }}>
        {ozet}
        <ChevronDown className="chev" size={18} strokeWidth={2} />
      </summary>
      {children}
    </details>
  );
}
