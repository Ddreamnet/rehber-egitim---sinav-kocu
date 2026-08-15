import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/** Rota değişince sayfayı başa alır (hash varsa hedefe kaydırır). */
export function SayfaBasinaKaydir() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (hash) {
      const hedef = document.querySelector(hash);
      if (hedef) {
        hedef.scrollIntoView({ behavior: 'smooth', block: 'start' });
        return;
      }
    }
    window.scrollTo({ top: 0 });
  }, [pathname, hash]);

  return null;
}
