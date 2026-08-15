import { useEffect, useState } from 'react';
import { ACILIYET_ESIGI_GUN } from '@/config/site';

export interface GeriSayim {
  gun: number;
  saat: string;
  dakika: string;
  saniye: string;
  /** "10.15.32" — kompakt sayaç kartları için */
  saatDkSn: string;
  /** Sınava ≤30 gün kaldıysa true → gün rakamı amber'e döner */
  acil: boolean;
  bitti: boolean;
}

const iki = (n: number) => String(n).padStart(2, '0');

export function geriSayimHesapla(hedef: string | number | Date, simdi: number): GeriSayim {
  const hedefMs = hedef instanceof Date ? hedef.getTime() : new Date(hedef).getTime();
  const kalan = Math.floor(Math.max(0, hedefMs - simdi) / 1000);
  const gun = Math.floor(kalan / 86400);
  const saat = iki(Math.floor((kalan % 86400) / 3600));
  const dakika = iki(Math.floor((kalan % 3600) / 60));
  const saniye = iki(kalan % 60);
  return {
    gun,
    saat,
    dakika,
    saniye,
    saatDkSn: `${saat}.${dakika}.${saniye}`,
    acil: gun < ACILIYET_ESIGI_GUN,
    bitti: kalan === 0,
  };
}

/**
 * Canlı geri sayım. Saniye başına tik atar; `aralik` ile yavaşlatılabilir
 * (ör. yalnız gün gösterilen yerlerde 60000).
 */
export function useGeriSayim(hedef: string | number | Date, aralik = 1000): GeriSayim {
  const [simdi, setSimdi] = useState(() => Date.now());

  useEffect(() => {
    const t = setInterval(() => setSimdi(Date.now()), aralik);
    return () => clearInterval(t);
  }, [aralik]);

  return geriSayimHesapla(hedef, simdi);
}
