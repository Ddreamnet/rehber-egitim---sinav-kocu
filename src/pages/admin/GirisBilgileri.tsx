import { useState } from 'react';
import { Copy, KeyRound } from 'lucide-react';
import { Buton, Rozet, Uyari } from '@/components/ui/temel';
import { panoyaKopyala } from './hesap';
import { sifreYenile } from '@/data/repo';

/**
 * Bir hesabın giriş bilgileri (admin).
 *
 * Kullanıcı adı = e-posta, her zaman görünür. Mevcut şifre gösterilemez çünkü
 * Supabase şifreleri hash'li saklıyor; bilgiyi yeniden iletmek gerektiğinde
 * yeni bir şifre üretilip bir kez gösteriliyor.
 */
export function GirisBilgileri({
  kisiId,
  eposta,
  etiket,
}: {
  kisiId: string;
  eposta?: string | null;
  /** "Öğrenci", "Koç", "Veli" */
  etiket: string;
}) {
  const [sifre, setSifre] = useState<string | null>(null);
  const [islemde, setIslemde] = useState(false);
  const [hata, setHata] = useState<string | null>(null);

  const uret = async () => {
    setIslemde(true);
    setHata(null);
    try {
      const sonuc = await sifreYenile(kisiId);
      setSifre(sonuc.sifre);
    } catch (h) {
      setHata(h instanceof Error ? h.message : 'Şifre üretilemedi.');
    } finally {
      setIslemde(false);
    }
  };

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
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <strong style={{ fontSize: '.85rem', fontFamily: 'var(--font-heading)' }}>{etiket} giriş bilgileri</strong>
        {sifre && <Rozet ton="success">yeni şifre üretildi</Rozet>}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <span className="hint" style={{ width: 74 }}>
          Kullanıcı
        </span>
        <code style={{ fontSize: '.88rem', fontWeight: 600, wordBreak: 'break-all' }}>{eposta ?? '—'}</code>
        {eposta && (
          <Buton
            tip="ghost"
            boy="sm"
            style={{ marginLeft: 'auto', flex: 'none' }}
            onClick={() => panoyaKopyala(eposta)}
            aria-label="Kullanıcı adını kopyala"
          >
            <Copy size={14} />
          </Buton>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <span className="hint" style={{ width: 74 }}>
          Şifre
        </span>
        {sifre ? (
          <>
            <code style={{ fontSize: '.88rem', fontWeight: 600, letterSpacing: '.02em' }}>{sifre}</code>
            <Buton
              tip="ghost"
              boy="sm"
              style={{ marginLeft: 'auto', flex: 'none' }}
              onClick={() => panoyaKopyala(sifre)}
              aria-label="Şifreyi kopyala"
            >
              <Copy size={14} />
            </Buton>
          </>
        ) : (
          <span className="hint" style={{ flex: '1 1 160px', lineHeight: 1.45 }}>
            Kayıtlı şifre şifrelenmiş tutulduğu için görüntülenemiyor.
          </span>
        )}
      </div>

      {hata && <Uyari tur="error">{hata}</Uyari>}

      <Buton tip="outline" boy="sm" style={{ alignSelf: 'flex-start' }} onClick={uret} disabled={islemde}>
        <KeyRound size={14} /> {islemde ? 'Üretiliyor…' : sifre ? 'Yeniden üret' : 'Yeni şifre üret'}
      </Buton>

      {sifre && (
        <p className="hint" style={{ lineHeight: 1.5 }}>
          Eski şifre artık geçersiz. Bu bilgileri {etiket.toLocaleLowerCase('tr-TR')}ye ilettiğinden emin ol —
          sayfadan çıkınca şifre bir daha gösterilmez.
        </p>
      )}
    </div>
  );
}
