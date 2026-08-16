/**
 * Hesap açma ekranlarının ortak parçaları (öğrenci + koç).
 *
 * İki ekran da aynı şifre üreticisini ve aynı "giriş bilgileri" kartını
 * kullanıyor; kopyalamak yerine burada tutuluyor.
 */

import { Copy } from 'lucide-react';
import { Buton } from '@/components/ui/temel';
import { DERS_RENKLERI } from '@/config/site';

/** Okunması kolay, karıştırılabilir karakterler olmadan şifre üretir. */
export function sifreUret(): string {
  const harf = 'abcdefghijkmnpqrstuvwxyz';
  const buyuk = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const rakam = '23456789';
  const havuz = harf + buyuk + rakam;
  const rastgele = (k: string) => k[Math.floor(Math.random() * k.length)];
  const govde = Array.from({ length: 7 }, () => rastgele(havuz)).join('');
  return rastgele(buyuk) + govde + rastgele(rakam);
}

const AVATAR_RENKLERI = Object.values(DERS_RENKLERI);

export function rastgeleAvatarRengi(): string {
  return AVATAR_RENKLERI[Math.floor(Math.random() * AVATAR_RENKLERI.length)];
}

export async function panoyaKopyala(metin: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(metin);
  } catch {
    /* pano izni yoksa sessiz geç — bilgiler ekranda görünüyor */
  }
}

export function GirisBilgisi({ baslik, eposta, sifre }: { baslik: string; eposta: string; sifre: string }) {
  return (
    <div
      style={{
        background: 'var(--color-bg)',
        borderRadius: 14,
        padding: '14px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
      }}
    >
      <strong style={{ fontSize: '.85rem', fontFamily: 'var(--font-heading)' }}>{baslik}</strong>
      {[
        ['E-posta', eposta],
        ['Şifre', sifre],
      ].map(([etiket, deger]) => (
        <div key={etiket} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span className="hint" style={{ width: 60 }}>
            {etiket}
          </span>
          <code style={{ fontSize: '.88rem', fontWeight: 600, wordBreak: 'break-all' }}>{deger}</code>
          <Buton
            tip="ghost"
            boy="sm"
            style={{ marginLeft: 'auto', flex: 'none' }}
            onClick={() => panoyaKopyala(deger)}
            aria-label={`${etiket} kopyala`}
          >
            <Copy size={14} />
          </Buton>
        </div>
      ))}
    </div>
  );
}
