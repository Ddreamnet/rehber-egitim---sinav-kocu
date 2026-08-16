import { MARKA } from '@/config/site';

/** Görüşmeyi .ics olarak indirir — takvim uygulamasına eklenir. */
export function takvimeEkle(g: { baslangic: string; sureDk: number; kocAdi: string }): void {
  const bas = new Date(g.baslangic);
  const bit = new Date(bas.getTime() + g.sureDk * 60000);
  const bicim = (d: Date) => d.toISOString().replace(/[-:]|\.\d{3}/g, '');
  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    `PRODID:-//${MARKA.alanAdi}//TR`,
    'BEGIN:VEVENT',
    `UID:${crypto.randomUUID()}`,
    `DTSTAMP:${bicim(new Date())}`,
    `DTSTART:${bicim(bas)}`,
    `DTEND:${bicim(bit)}`,
    `SUMMARY:Koç görüşmesi — ${g.kocAdi}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');

  const url = URL.createObjectURL(new Blob([ics], { type: 'text/calendar' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = 'rehber-gorusme.ics';
  a.click();
  URL.revokeObjectURL(url);
}
