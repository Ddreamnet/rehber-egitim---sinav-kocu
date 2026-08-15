/**
 * Token renklerini çözen yardımcılar.
 *
 * Uygulama tek temalıdır (koyu mod yok) — `tokens.css` içindeki `:root`
 * paleti her yerde geçerlidir. Canvas (Chart.js) CSS değişkeni okuyamadığı
 * için token'ın hesaplanmış değerine buradan ulaşılır.
 */

/** "var(--ders-fen)" ya da "--ders-fen" → "#6EE7B7" */
export function tokenRengi(ifade: string, kok: HTMLElement = document.documentElement): string {
  const ad = ifade.trim().startsWith('var(') ? ifade.trim().slice(4, -1).trim() : ifade.trim();
  if (!ad.startsWith('--')) return ifade;
  const deger = getComputedStyle(kok).getPropertyValue(ad).trim();
  return deger || ifade;
}

/** Hex/rgb rengi verilen opaklıkla rgba'ya çevirir (grafik dolguları için). */
export function opaklik(renk: string, alfa: number): string {
  const c = tokenRengi(renk);
  if (c.startsWith('#')) {
    const h = c.slice(1);
    const tam = h.length === 3 ? h.split('').map((x) => x + x).join('') : h;
    const n = parseInt(tam, 16);
    return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alfa})`;
  }
  if (c.startsWith('rgb(')) return c.replace('rgb(', 'rgba(').replace(')', `, ${alfa})`);
  return c;
}
