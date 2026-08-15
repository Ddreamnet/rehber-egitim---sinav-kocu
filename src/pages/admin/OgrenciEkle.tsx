import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Copy, RefreshCw, UserPlus } from 'lucide-react';
import { Alan, Buton, Kart, Rozet, Segment, Uyari } from '@/components/ui/temel';
import { DERS_RENKLERI } from '@/config/site';
import { koclar, ogrenciEkle } from '@/data/repo';

const ALANLAR = ['Sayısal', 'Eşit Ağırlık', 'Sözel', 'Dil', 'LGS'];
const SINIFLAR = ['9. sınıf', '10. sınıf', '11. sınıf', '12. sınıf', 'Mezun', '8. sınıf'];

/** Okunması kolay, karıştırılabilir karakterler olmadan şifre üretir. */
function sifreUret(): string {
  const harf = 'abcdefghijkmnpqrstuvwxyz';
  const buyuk = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const rakam = '23456789';
  const havuz = harf + buyuk + rakam;
  const rastgele = (k: string) => k[Math.floor(Math.random() * k.length)];
  const govde = Array.from({ length: 7 }, () => rastgele(havuz)).join('');
  return rastgele(buyuk) + govde + rastgele(rakam);
}

const AVATAR_RENKLERI = Object.values(DERS_RENKLERI);

export default function AdminOgrenciEkle() {
  const qc = useQueryClient();
  const kocListesi = useQuery({ queryKey: ['koclar'], queryFn: koclar });

  const [adSoyad, setAdSoyad] = useState('');
  const [eposta, setEposta] = useState('');
  const [sifre, setSifre] = useState(sifreUret);
  const [telefon, setTelefon] = useState('');
  const [sinif, setSinif] = useState('12. sınıf');
  const [hedefAlan, setHedefAlan] = useState('Sayısal');
  const [kocId, setKocId] = useState('');

  const [veliEkle, setVeliEkle] = useState(false);
  const [veliAd, setVeliAd] = useState('');
  const [veliEposta, setVeliEposta] = useState('');
  const [veliSifre, setVeliSifre] = useState(sifreUret);
  const [veliDetay, setVeliDetay] = useState<'ozet' | 'tam'>('ozet');

  const [islemde, setIslemde] = useState(false);
  const [hata, setHata] = useState<string | null>(null);
  const [sonuc, setSonuc] = useState<{ eposta: string; sifre: string; veli?: { eposta: string; sifre: string } } | null>(
    null,
  );

  const kopyala = async (metin: string) => {
    try {
      await navigator.clipboard.writeText(metin);
    } catch {
      /* pano izni yoksa sessiz geç — bilgiler ekranda görünüyor */
    }
  };

  const gonder = async (e: React.FormEvent) => {
    e.preventDefault();
    setHata(null);
    setIslemde(true);
    try {
      await ogrenciEkle({
        adSoyad: adSoyad.trim(),
        eposta: eposta.trim(),
        sifre,
        telefon: telefon.trim() || undefined,
        sinif,
        hedefAlan,
        avatarRengi: AVATAR_RENKLERI[Math.floor(Math.random() * AVATAR_RENKLERI.length)],
        kocId: kocId || undefined,
        veli:
          veliEkle && veliEposta.trim()
            ? { adSoyad: veliAd.trim() || 'Veli', eposta: veliEposta.trim(), sifre: veliSifre, detaySeviyesi: veliDetay }
            : undefined,
      });

      setSonuc({
        eposta: eposta.trim(),
        sifre,
        veli: veliEkle && veliEposta.trim() ? { eposta: veliEposta.trim(), sifre: veliSifre } : undefined,
      });

      setAdSoyad('');
      setEposta('');
      setTelefon('');
      setSifre(sifreUret());
      setVeliAd('');
      setVeliEposta('');
      setVeliSifre(sifreUret());
      setVeliEkle(false);

      await qc.invalidateQueries({ queryKey: ['tum-ogrenciler'] });
      await qc.invalidateQueries({ queryKey: ['koclar'] });
    } catch (h) {
      setHata(h instanceof Error ? h.message : 'Öğrenci eklenemedi.');
    } finally {
      setIslemde(false);
    }
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(320px,1fr))', gap: 24, alignItems: 'start' }}>
      <Kart style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span
            style={{
              width: 42,
              height: 42,
              borderRadius: 13,
              background: 'var(--color-primary-soft)',
              color: 'var(--color-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flex: 'none',
            }}
          >
            <UserPlus size={19} />
          </span>
          <div>
            <h3 style={{ fontSize: '1.05rem' }}>Yeni öğrenci</h3>
            <p className="hint">Hesap burada açılır; kullanıcı adı ve şifre öğrenciye iletilir.</p>
          </div>
        </div>

        <form onSubmit={gonder} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Alan etiket="Ad soyad">
            <input className="input" value={adSoyad} onChange={(e) => setAdSoyad(e.target.value)} required />
          </Alan>

          <Alan etiket="E-posta" ipucu="Giriş bilgisi olarak kullanılır.">
            <input
              className="input"
              type="email"
              value={eposta}
              onChange={(e) => setEposta(e.target.value)}
              autoComplete="off"
              required
            />
          </Alan>

          <Alan etiket="Şifre" ipucu="En az 8 karakter. Öğrenci ilk girişte değiştirebilir.">
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                className="input"
                value={sifre}
                onChange={(e) => setSifre(e.target.value)}
                minLength={8}
                required
                style={{ fontFamily: 'var(--font-body)', letterSpacing: '.02em' }}
              />
              <Buton
                type="button"
                tip="secondary"
                onClick={() => setSifre(sifreUret())}
                aria-label="Yeni şifre üret"
                style={{ width: 44, padding: 0, flex: 'none' }}
              >
                <RefreshCw size={16} />
              </Buton>
            </div>
          </Alan>

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <Alan etiket="Sınıf" style={{ flex: 1, minWidth: 140 }}>
              <select className="input" value={sinif} onChange={(e) => setSinif(e.target.value)}>
                {SINIFLAR.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </Alan>
            <Alan etiket="Alan" style={{ flex: 1, minWidth: 140 }}>
              <select className="input" value={hedefAlan} onChange={(e) => setHedefAlan(e.target.value)}>
                {ALANLAR.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
            </Alan>
          </div>

          <Alan etiket="Telefon (isteğe bağlı)">
            <input className="input" value={telefon} onChange={(e) => setTelefon(e.target.value)} inputMode="tel" />
          </Alan>

          <Alan etiket="Koç ataması" ipucu="Sonradan da atanabilir.">
            <select className="input" value={kocId} onChange={(e) => setKocId(e.target.value)}>
              <option value="">Koç seçilmedi</option>
              {kocListesi.data?.map((k) => (
                <option key={k.id} value={k.id}>
                  {k.adSoyad} ({k.ogrenciSayisi} öğrenci)
                </option>
              ))}
            </select>
          </Alan>

          <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '.9rem', cursor: 'pointer' }}>
              <input type="checkbox" checked={veliEkle} onChange={(e) => setVeliEkle(e.target.checked)} />
              Veli hesabı da aç
            </label>

            {veliEkle && (
              <>
                <Alan etiket="Veli adı">
                  <input className="input" value={veliAd} onChange={(e) => setVeliAd(e.target.value)} />
                </Alan>
                <Alan etiket="Veli e-postası">
                  <input
                    className="input"
                    type="email"
                    value={veliEposta}
                    onChange={(e) => setVeliEposta(e.target.value)}
                    autoComplete="off"
                  />
                </Alan>
                <Alan etiket="Veli şifresi">
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input className="input" value={veliSifre} onChange={(e) => setVeliSifre(e.target.value)} minLength={8} />
                    <Buton
                      type="button"
                      tip="secondary"
                      onClick={() => setVeliSifre(sifreUret())}
                      aria-label="Veli için yeni şifre üret"
                      style={{ width: 44, padding: 0, flex: 'none' }}
                    >
                      <RefreshCw size={16} />
                    </Buton>
                  </div>
                </Alan>
                <div className="field">
                  <span style={{ fontSize: '.85rem', fontWeight: 600 }}>Velinin göreceği detay</span>
                  <Segment
                    etiket="Veli detay seviyesi"
                    deger={veliDetay}
                    degistir={setVeliDetay}
                    secenekler={[
                      { deger: 'ozet', etiket: 'Özet' },
                      { deger: 'tam', etiket: 'Tam' },
                    ]}
                  />
                </div>
              </>
            )}
          </div>

          {hata && <Uyari tur="error">{hata}</Uyari>}

          <Buton type="submit" boy="lg" disabled={islemde}>
            {islemde ? 'Ekleniyor…' : 'Öğrenciyi ekle'}
          </Buton>
        </form>
      </Kart>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        {sonuc && (
          <Kart style={{ display: 'flex', flexDirection: 'column', gap: 14, outline: '2px solid var(--color-success)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <h3 style={{ fontSize: '1.05rem' }}>Hesap açıldı</h3>
              <Rozet ton="success" style={{ marginLeft: 'auto' }}>
                Hazır
              </Rozet>
            </div>
            <p className="hint" style={{ lineHeight: 1.55 }}>
              Bu bilgileri öğrenciye ilet. Şifre bir daha gösterilmez — kaybolursa yenisini üretip güncellemen gerekir.
            </p>

            <GirisBilgisi baslik="Öğrenci" eposta={sonuc.eposta} sifre={sonuc.sifre} kopyala={kopyala} />
            {sonuc.veli && <GirisBilgisi baslik="Veli" eposta={sonuc.veli.eposta} sifre={sonuc.veli.sifre} kopyala={kopyala} />}
          </Kart>
        )}

        <Kart style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <h3 style={{ fontSize: '1.05rem' }}>Nasıl işliyor</h3>
          <ol style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingLeft: 20, margin: 0, fontSize: '.92rem', lineHeight: 1.55 }}>
            <li>Ücretsiz görüşme yapılır, öğrenci devam etmeye karar verir ve ödemesini yapar.</li>
            <li>Buradan hesabı açarsın; sistem kullanıcıyı ve profilini oluşturur, rolünü “öğrenci” yapar.</li>
            <li>Koç atarsan öğrenci o koçun listesine düşer ve koç plan göndermeye başlayabilir.</li>
            <li>Kullanıcı adı ve şifreyi öğrenciye iletirsin; sitede kayıt formu yoktur.</li>
          </ol>
        </Kart>
      </div>
    </div>
  );
}

function GirisBilgisi({
  baslik,
  eposta,
  sifre,
  kopyala,
}: {
  baslik: string;
  eposta: string;
  sifre: string;
  kopyala: (m: string) => void;
}) {
  return (
    <div style={{ background: 'var(--color-bg)', borderRadius: 14, padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
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
            onClick={() => kopyala(deger)}
            aria-label={`${etiket} kopyala`}
          >
            <Copy size={14} />
          </Buton>
        </div>
      ))}
    </div>
  );
}
