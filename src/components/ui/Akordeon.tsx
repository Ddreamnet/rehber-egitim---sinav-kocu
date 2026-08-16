import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import type { CSSProperties, ReactNode } from 'react';

/**
 * Native <details> akordeonu (tasarımdaki `.acc` sınıfı).
 * Klavye ve ekran okuyucu davranışı tarayıcıdan gelir.
 *
 * `open` React'e bırakılıyor ve `onToggle` ile DOM'dan geri okunuyor: doğrudan
 * `open={varsayilanAcik}` verildiğinde React kendi bildiği değeri koruyor ve
 * kullanıcının açtığı akordeon bir sonraki render'da tekrar kapanıyordu.
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
  const [acik, setAcik] = useState(Boolean(varsayilanAcik));

  return (
    <details
      className={['acc', kartMi ? 'card' : '', className].filter(Boolean).join(' ')}
      open={acik}
      onToggle={(e) => setAcik(e.currentTarget.open)}
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
