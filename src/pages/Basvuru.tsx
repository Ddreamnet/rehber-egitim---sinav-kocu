import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Check } from 'lucide-react';
import { SiteSayfasi } from '@/components/layout/SiteKabugu';
import { Alan, Buton, ButonLink, Kart, RadyoGrubu, Uyari } from '@/components/ui/temel';
import {
  ALAN_SORULAN_SINIFLAR,
  BASVURU_ALANLARI,
  BASVURU_PROGRAMLARI,
  BASVURU_SINIFLARI,
  basvuruPaketSecenekleri,
  sinifaGoreProgram,
  type BasvuruAlani,
  type BasvuruProgrami,
  type BasvuruSinifi,
} from '@/config/site';
import { telefonBicimle, telefonNormalle } from '@/lib/format';
import { basvuruGonder } from '@/data/repo';
import { useSayfaBilgisi } from '@/lib/sayfaBasligi';

const PAKETLER = basvuruPaketSecenekleri();

interface Hatalar {
  ad?: string;
  soyad?: string;
  telefon?: string;
  eposta?: string;
  sinif?: string;
  program?: string;
  paket?: string;
  veliOnayi?: string;
}

/** Mezun dışındaki sınıflarda öğrenci 18 yaşın altında sayılır. */
const veliOnayiGerekir = (sinif: string) => Boolean(sinif) && sinif !== 'mezun';

/**
 * Başvuru formu.
 *
 * Sınıf, alan, program ve paket ayrı sorular: öğrenci sınav adayı olmasa da
 * (ara dönem 7/9/10. sınıf) doğru programa yönlensin diye. Alan sorusu yalnız
 * 11, 12 ve mezun öğrencilere görünür.
 */
export default function Basvuru() {
  const [ad, setAd] = useState('');
  const [soyad, setSoyad] = useState('');
  const [telefon, setTelefon] = useState('');
  const [eposta, setEposta] = useState('');
  const [sinif, setSinif] = useState<BasvuruSinifi | ''>('');
  const [alan, setAlan] = useState<BasvuruAlani | ''>('');
  const [program, setProgram] = useState<BasvuruProgrami | ''>('');
  /** Program elle seçildiyse sınıf değişince üzerine yazmıyoruz. */
  const [programElle, setProgramElle] = useState(false);
  const [paket, setPaket] = useState('');
  const [notu, setNotu] = useState('');
  const [veliOnayi, setVeliOnayi] = useState(false);
  /** Bot tuzağı — insan kullanıcı bu alanı hiç görmez, dolu gelirse gönderim elenir. */
  const [tuzak, setTuzak] = useState('');

  const [hatalar, setHatalar] = useState<Hatalar>({});
  const [gonderiliyor, setGonderiliyor] = useState(false);
  const [sonuc, setSonuc] = useState<'ok' | 'hata' | null>(null);
  const [hataMetni, setHataMetni] = useState('');

  const alanSorulur = ALAN_SORULAN_SINIFLAR.includes(sinif);

  const sinifSec = (yeni: BasvuruSinifi) => {
    setSinif(yeni);
    if (!ALAN_SORULAN_SINIFLAR.includes(yeni)) setAlan('');
    if (!veliOnayiGerekir(yeni)) setVeliOnayi(false);
    if (!programElle) setProgram(sinifaGoreProgram(yeni));
  };

  const programSec = (yeni: BasvuruProgrami) => {
    setProgram(yeni);
    setProgramElle(true);
  };

  const gonder = async (e: React.FormEvent) => {
    e.preventDefault();
    const yeni: Hatalar = {};
    if (ad.trim().length < 2) yeni.ad = 'Adını yazar mısın?';
    if (soyad.trim().length < 2) yeni.soyad = 'Soyadını yazar mısın?';

    const numara = telefonNormalle(telefon);
    if (!numara) yeni.telefon = 'Numarayı 0532 123 45 67 gibi eksiksiz yazabilir misin?';
    if (eposta.trim() && !/^\S+@\S+\.\S+$/.test(eposta.trim())) yeni.eposta = 'E-posta adresi eksik görünüyor.';
    if (!sinif) yeni.sinif = 'Sınıf seçilmedi.';
    if (!program) yeni.program = 'Program seçilmedi.';
    if (!paket) yeni.paket = 'Paket seçilmedi.';
    if (veliOnayiGerekir(sinif) && !veliOnayi)
      yeni.veliOnayi = '18 yaş altındaki öğrenciler için veli onayı gerekiyor.';

    setHatalar(yeni);
    if (Object.keys(yeni).length) return;

    setGonderiliyor(true);
    setHataMetni('');
    try {
      await basvuruGonder({
        ad: ad.trim(),
        soyad: soyad.trim(),
        telefon: numara!,
        eposta: eposta.trim() || undefined,
        sinif,
        alan: alanSorulur ? alan || undefined : undefined,
        program,
        paket,
        not: notu.trim() || undefined,
        veliOnayi: veliOnayiGerekir(sinif) ? veliOnayi : undefined,
        tuzak: tuzak || undefined,
      });
      setSonuc('ok');
    } catch (hata) {
      setHataMetni(hata instanceof Error ? hata.message : '');
      setSonuc('hata');
    } finally {
      setGonderiliyor(false);
    }
  };

  useSayfaBilgisi({
    baslik: 'Ücretsiz ilk görüşme',
    aciklama:
      '20 dakikalık ücretsiz görüşmede hedefini konuşuyor, sistemi tanıtıyor ve nasıl başlayacağını birlikte planlıyoruz.',
    yol: '/basvuru',
  });

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
              <form onSubmit={gonder} className="basvuru-form" noValidate>
                <h2 style={{ fontSize: '1.15rem' }}>İletişim bilgilerin</h2>

                <div className="form-ikili">
                  <Alan etiket="Ad *" hata={hatalar.ad}>
                    <input
                      className={hatalar.ad ? 'input input-err' : 'input'}
                      value={ad}
                      onChange={(e) => setAd(e.target.value)}
                      autoComplete="given-name"
                    />
                  </Alan>

                  <Alan etiket="Soyad *" hata={hatalar.soyad}>
                    <input
                      className={hatalar.soyad ? 'input input-err' : 'input'}
                      value={soyad}
                      onChange={(e) => setSoyad(e.target.value)}
                      autoComplete="family-name"
                    />
                  </Alan>
                </div>

                <Alan
                  etiket="Telefon numarası *"
                  ipucu="Sadece görüşme için ararız."
                  hata={hatalar.telefon}
                >
                  <input
                    className={hatalar.telefon ? 'input input-err' : 'input'}
                    value={telefon}
                    /* Yazarken biçimlenir; +90 / 0090 / boşluklu yazım da kabul edilir. */
                    onChange={(e) => setTelefon(telefonBicimle(e.target.value))}
                    inputMode="tel"
                    autoComplete="tel"
                    placeholder="0532 123 45 67"
                    maxLength={20}
                  />
                </Alan>

                <Alan etiket="E-posta" ipucu="İsteğe bağlı." hata={hatalar.eposta}>
                  <input
                    className={hatalar.eposta ? 'input input-err' : 'input'}
                    type="email"
                    value={eposta}
                    onChange={(e) => setEposta(e.target.value)}
                    autoComplete="email"
                  />
                </Alan>

                <div className="form-bolum">
                  <RadyoGrubu
                    etiket="Öğrencinin sınıfı"
                    ad="sinif"
                    zorunlu
                    secenekler={BASVURU_SINIFLARI}
                    deger={sinif}
                    degistir={sinifSec}
                    hata={hatalar.sinif}
                  />
                </div>

                {alanSorulur && (
                  <div className="form-bolum">
                    <RadyoGrubu
                      etiket="Öğrencinin alanı"
                      ad="alan"
                      ipucu="Henüz karar vermediysen boş bırakabilirsin."
                      secenekler={BASVURU_ALANLARI}
                      deger={alan}
                      degistir={setAlan}
                    />
                  </div>
                )}

                <div className="form-bolum">
                  <RadyoGrubu
                    etiket="İlgilendiğin program"
                    ad="program"
                    zorunlu
                    secenekler={BASVURU_PROGRAMLARI}
                    deger={program}
                    degistir={programSec}
                    hata={hatalar.program}
                  />
                </div>

                <div className="form-bolum">
                  <RadyoGrubu
                    etiket="İlgilendiğin paket"
                    ad="paket"
                    zorunlu
                    secenekler={PAKETLER}
                    deger={paket}
                    degistir={setPaket}
                    hata={hatalar.paket}
                  />
                </div>

                <div className="form-bolum">
                  <Alan etiket="Eklemek istediklerin" ipucu="İsteğe bağlı. Örn: hedefin, şu anki durumun.">
                    <textarea
                      className="input"
                      rows={3}
                      value={notu}
                      onChange={(e) => setNotu(e.target.value)}
                    />
                  </Alan>
                </div>

                {veliOnayiGerekir(sinif) && (
                  <div className="form-bolum">
                    <label className={hatalar.veliOnayi ? 'onay-kutusu onay-kutusu-hata' : 'onay-kutusu'}>
                      <input
                        type="checkbox"
                        checked={veliOnayi}
                        onChange={(e) => setVeliOnayi(e.target.checked)}
                      />
                      <span>
                        Öğrenci 18 yaşından küçük; velisi olarak bu başvuruyu yapıyorum ve{' '}
                        <Link to="/kvkk" style={{ fontWeight: 600 }}>
                          KVKK aydınlatma metnini
                        </Link>{' '}
                        okudum. *
                      </span>
                    </label>
                    {hatalar.veliOnayi && (
                      <span className="hint" style={{ color: 'var(--color-error-deep)', marginTop: 6, display: 'block' }}>
                        {hatalar.veliOnayi}
                      </span>
                    )}
                  </div>
                )}

                {/* Bot tuzağı: ekran okuyucudan ve klavyeden gizli, yalnız otomatik
                    doldurucular yakalanır. Dolu gelirse gönderim elenir. */}
                <div className="tuzak" aria-hidden="true">
                  <label htmlFor="basvuru-sirket">Şirket</label>
                  <input
                    id="basvuru-sirket"
                    name="sirket"
                    type="text"
                    tabIndex={-1}
                    autoComplete="off"
                    value={tuzak}
                    onChange={(e) => setTuzak(e.target.value)}
                  />
                </div>

                {sonuc === 'hata' && (
                  <Uyari tur="error">
                    {hataMetni || 'Gönderilemedi. Bağlantını kontrol edip yeniden deneyebilirsin.'}
                  </Uyari>
                )}

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
