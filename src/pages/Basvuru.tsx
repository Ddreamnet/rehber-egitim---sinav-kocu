import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Check } from 'lucide-react';
import { SiteSayfasi } from '@/components/layout/SiteKabugu';
import { Alan, Buton, ButonLink, Kart, Segment, Uyari } from '@/components/ui/temel';
import { basvuruGonder } from '@/data/repo';

/**
 * Başvuru formu — alan sayısı bilinçli olarak minimumda (aktivasyon enerjisi).
 * Ad, telefon ve sınav zorunlu; e-posta ve hedef isteğe bağlı.
 */
export default function Basvuru() {
  const [ad, setAd] = useState('');
  const [telefon, setTelefon] = useState('');
  const [eposta, setEposta] = useState('');
  const [sinav, setSinav] = useState<'yks' | 'lgs'>('yks');
  const [hedef, setHedef] = useState('');
  const [hatalar, setHatalar] = useState<{ ad?: string; telefon?: string }>({});
  const [gonderiliyor, setGonderiliyor] = useState(false);
  const [sonuc, setSonuc] = useState<'ok' | 'hata' | null>(null);

  const gonder = async (e: React.FormEvent) => {
    e.preventDefault();
    const yeniHatalar: typeof hatalar = {};
    if (ad.trim().length < 3) yeniHatalar.ad = 'Ad soyad alanı eksik görünüyor.';
    if (telefon.replace(/\D/g, '').length < 10) yeniHatalar.telefon = 'Telefon numaran eksik görünüyor.';
    setHatalar(yeniHatalar);
    if (Object.keys(yeniHatalar).length) return;

    setGonderiliyor(true);
    try {
      await basvuruGonder({ adSoyad: ad.trim(), telefon: telefon.trim(), eposta: eposta.trim() || undefined, sinav, hedef: hedef.trim() || undefined });
      setSonuc('ok');
    } catch {
      setSonuc('hata');
    } finally {
      setGonderiliyor(false);
    }
  };

  return (
    <SiteSayfasi>
      <section className="bg-kareli-gradient" style={{ minHeight: '70vh' }}>
        <div
          className="container"
          style={{
            padding: '112px 0 96px',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit,minmax(320px,1fr))',
            gap: 48,
            alignItems: 'start',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div className="kicker">Başvuru</div>
            <h1 style={{ fontSize: 'clamp(1.9rem,4.2vw,2.6rem)', fontWeight: 700, maxWidth: '16ch' }}>
              Ücretsiz ilk görüşme
            </h1>
            <p
              className="el-yazi"
              style={{ fontSize: '1.55rem', color: 'var(--color-text)', maxWidth: '30ch', lineHeight: 1.4 }}
            >
              20 dakikalık bir görüşmede sistemi tanıtıyor, hedefini konuşuyor ve nasıl başlayacağını birlikte planlıyoruz.
            </p>
          </div>

          <Kart style={{ boxShadow: 'var(--shadow-lift)' }}>
            {sonuc === 'ok' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'flex-start' }}>
                <span
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 14,
                    background: 'var(--color-success-soft)',
                    color: 'var(--color-success-deep)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Check size={22} strokeWidth={2.5} />
                </span>
                <h2 style={{ fontSize: '1.35rem' }}>Başvurun bize ulaştı</h2>
                <p style={{ color: 'var(--color-text-muted)', lineHeight: 1.6 }}>
                  Aynı gün içinde arayıp ücretsiz görüşme için uygun bir saat belirliyoruz. Bu arada blogdaki
                  “deneme analizi” yazısına göz atabilirsin.
                </p>
                <ButonLink to="/blog" tip="outline">
                  Blog’a göz at
                </ButonLink>
              </div>
            ) : (
              <form onSubmit={gonder} style={{ display: 'flex', flexDirection: 'column', gap: 16 }} noValidate>
                <h2 style={{ fontSize: '1.15rem' }}>İletişim bilgilerin</h2>

                <Alan etiket="Ad soyad" hata={hatalar.ad}>
                  <input
                    className={hatalar.ad ? 'input input-err' : 'input'}
                    value={ad}
                    onChange={(e) => setAd(e.target.value)}
                    autoComplete="name"
                    required
                  />
                </Alan>

                <Alan etiket="Telefon" ipucu="Sadece görüşme için ararız." hata={hatalar.telefon}>
                  <input
                    className={hatalar.telefon ? 'input input-err' : 'input'}
                    value={telefon}
                    onChange={(e) => setTelefon(e.target.value)}
                    inputMode="tel"
                    autoComplete="tel"
                    placeholder="05xx xxx xx xx"
                    required
                  />
                </Alan>

                {/* Segment bir form kontrolü değil; label[for] yerine aria-label taşır. */}
                <div className="field">
                  <span style={{ fontSize: '.85rem', fontWeight: 600 }}>Sınav</span>
                  <Segment
                    etiket="Sınav"
                    deger={sinav}
                    degistir={setSinav}
                    secenekler={[
                      { deger: 'yks', etiket: 'YKS (TYT/AYT)' },
                      { deger: 'lgs', etiket: 'LGS' },
                    ]}
                  />
                </div>

                <Alan etiket="E-posta (isteğe bağlı)">
                  <input
                    className="input"
                    type="email"
                    value={eposta}
                    onChange={(e) => setEposta(e.target.value)}
                    autoComplete="email"
                  />
                </Alan>

                <Alan etiket="Hedefin (isteğe bağlı)" ipucu="Örn: ilk 100.000 · sayısal">
                  <input className="input" value={hedef} onChange={(e) => setHedef(e.target.value)} />
                </Alan>

                {sonuc === 'hata' && <Uyari tur="error">Gönderilemedi. Bağlantını kontrol edip yeniden deneyebilirsin.</Uyari>}

                <Buton type="submit" boy="lg" disabled={gonderiliyor}>
                  {gonderiliyor ? 'Gönderiliyor…' : 'Ücretsiz görüşme ayarlayalım'}
                </Buton>
                {/* Metne ulaşılacak bir bağlantı yoktu; yalnız alt bilgiden erişiliyordu. */}
                <p className="hint">
                  Formu gönderdiğinde{' '}
                  <Link to="/kvkk" style={{ fontWeight: 600 }}>
                    KVKK aydınlatma metnini
                  </Link>{' '}
                  okumuş sayılıyorsun. Numaranı üçüncü taraflarla paylaşmıyoruz.
                </p>
              </form>
            )}
          </Kart>
        </div>
      </section>
    </SiteSayfasi>
  );
}
