import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { GraduationCap, ShieldCheck, Users, UserRound } from 'lucide-react';
import { SiteSayfasi } from '@/components/layout/SiteKabugu';
import { Alan, Buton, Kart, Uyari } from '@/components/ui/temel';
import { rolAnasayfasi, useOturum } from '@/auth/Oturum';
import { MARKA } from '@/config/site';
import { nativeMi } from '@/lib/platform';
import type { Rol } from '@/data/tipler';
import { useSayfaBilgisi } from '@/lib/sayfaBasligi';

const DEMO_ROLLER: Array<{ rol: Rol; etiket: string; aciklama: string; ikon: React.ReactNode; renk: string }> = [
  {
    rol: 'ogrenci',
    etiket: 'Öğrenci',
    aciklama: 'Plan, müfredat, Net Denge',
    ikon: <GraduationCap size={20} />,
    renk: 'var(--ders-turkce)',
  },
  {
    rol: 'veli',
    etiket: 'Veli',
    aciklama: 'Salt-okunur haftalık özet',
    ikon: <UserRound size={20} />,
    renk: 'var(--ders-dil)',
  },
  {
    rol: 'koc',
    etiket: 'Koç',
    aciklama: 'Öğrenci listesi, plan, not',
    ikon: <Users size={20} />,
    renk: 'var(--ders-fen)',
  },
  {
    rol: 'admin',
    etiket: 'Admin',
    aciklama: 'Metrikler, koçlar, ödemeler',
    ikon: <ShieldCheck size={20} />,
    renk: 'var(--ders-sosyal)',
  },
];

export default function Giris() {
  const { profil, demoMod, girisYap, demoGiris } = useOturum();
  const git = useNavigate();

  const [eposta, setEposta] = useState('');
  const [sifre, setSifre] = useState('');
  const [hata, setHata] = useState<string | null>(null);
  const [islemde, setIslemde] = useState(false);

  useEffect(() => {
    if (profil) git(rolAnasayfasi(profil.rol), { replace: true });
  }, [profil, git]);

  const gonder = async (e: React.FormEvent) => {
    e.preventDefault();
    setHata(null);
    setIslemde(true);
    try {
      await girisYap(eposta, sifre);
    } catch (h) {
      setHata(h instanceof Error ? h.message : 'Giriş yapılamadı.');
    } finally {
      setIslemde(false);
    }
  };

  useSayfaBilgisi({
    baslik: 'Panele giriş',
    aciklama: 'Öğrenci, veli ve koç paneline giriş. Hesaplar ücretsiz ilk görüşmeden sonra açılır.',
    yol: '/giris',
  });

  return (
    <SiteSayfasi altlik={false}>
      <section className="bg-kareli-gradient giris-alan" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center' }}>
        <div className="container giris-kap" style={{ padding: '104px 0 64px', display: 'flex', justifyContent: 'center' }}>
          <Kart style={{ width: 'min(440px,100%)', boxShadow: 'var(--shadow-lift)', display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div>
              <div className="kicker">Giriş</div>
              <h1 style={{ fontSize: '1.5rem', marginTop: 8 }}>Panele giriş</h1>
            </div>

            {demoMod ? (
              <>
                <Uyari tur="info">
                  Supabase bağlantısı tanımlı değil. Demo veriyle panelleri gezmek için bir rol seçebilirsin.
                </Uyari>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {DEMO_ROLLER.map((r) => (
                    <button
                      key={r.rol}
                      type="button"
                      className="satir"
                      style={{ cursor: 'pointer', border: 'none', textAlign: 'left', width: '100%' }}
                      onClick={() => {
                        demoGiris(r.rol);
                        git(rolAnasayfasi(r.rol));
                      }}
                    >
                      <span
                        style={{
                          width: 38,
                          height: 38,
                          borderRadius: 12,
                          background: r.renk,
                          color: 'var(--on-pastel)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flex: 'none',
                        }}
                      >
                        {r.ikon}
                      </span>
                      <span>
                        <span style={{ display: 'block', fontWeight: 600, fontSize: '.95rem' }}>{r.etiket}</span>
                        <span className="hint" style={{ fontSize: '.8rem' }}>
                          {r.aciklama}
                        </span>
                      </span>
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <form onSubmit={gonder} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <Alan etiket="E-posta">
                  <input
                    className="input"
                    type="email"
                    value={eposta}
                    onChange={(e) => setEposta(e.target.value)}
                    autoComplete="email"
                    required
                  />
                </Alan>
                <Alan etiket="Şifre">
                  <input
                    className="input"
                    type="password"
                    value={sifre}
                    onChange={(e) => setSifre(e.target.value)}
                    autoComplete="current-password"
                    required
                  />
                </Alan>

                {hata && <Uyari tur="error">{hata}</Uyari>}

                <Buton type="submit" boy="lg" disabled={islemde}>
                  {islemde ? 'Bekle…' : 'Giriş yap'}
                </Buton>
              </form>
            )}

            {/* Uygulamada /basvuru yok (girişe yönleniyor); orada bağlantı yerine
                web adresini yazıyoruz ki kopuk bir bağlantı kalmasın. */}
            <p className="hint" style={{ lineHeight: 1.55 }}>
              Hesaplar tarafımızdan açılıyor; sitede kayıt formu yok. Henüz hesabın yoksa{' '}
              {nativeMi() ? (
                <a href={`https://${MARKA.alanAdi}/basvuru`} target="_blank" rel="noreferrer noopener" style={{ fontWeight: 600 }}>
                  {MARKA.alanAdi}
                </a>
              ) : (
                <Link to="/basvuru" style={{ fontWeight: 600 }}>
                  ücretsiz ilk görüşme
                </Link>
              )}
              {nativeMi()
                ? ' üzerinden ücretsiz ilk görüşmeyi alabilirsin; görüşmeden sonra kullanıcı adın ve şifren sana iletilir.'
                : ' alabilirsin; görüşmeden sonra kullanıcı adın ve şifren sana iletilir.'}
            </p>
          </Kart>
        </div>
      </section>
    </SiteSayfasi>
  );
}
