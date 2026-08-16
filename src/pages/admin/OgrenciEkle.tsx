import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { ArrowLeft, RefreshCw, UserPlus } from 'lucide-react';
import { Alan, Buton, Kart, Rozet, Segment, Uyari } from '@/components/ui/temel';
import { GirisBilgisi, rastgeleAvatarRengi, sifreUret } from './hesap';
import { koclar, ogrenciEkle } from '@/data/repo';
import { OKUL_ALANI } from '@/config/site';

// Ortaokul sınıfları ve sınava hazırlanmayan öğrenciler de sisteme giriyor:
// "Okul müfredatı" seçilince panel, öğrencinin sınıf müfredatını çekiyor.
export const ALANLAR = ['Sayısal', 'Eşit Ağırlık', 'Sözel', 'Dil', 'LGS', OKUL_ALANI];
export const SINIFLAR = [
  '5. sınıf',
  '6. sınıf',
  '7. sınıf',
  '8. sınıf',
  '9. sınıf',
  '10. sınıf',
  '11. sınıf',
  '12. sınıf',
  'Mezun',
];

export default function AdminOgrenciEkle() {
  const qc = useQueryClient();
  const kocListesi = useQuery({ queryKey: ['koclar'], queryFn: koclar });

  const [adSoyad, setAdSoyad] = useState('');
  const [eposta, setEposta] = useState('');
  const [sifre, setSifre] = useState(sifreUret);
  const [telefon, setTelefon] = useState('');
  const [sinif, setSinif] = useState('12. sınıf');
  const [hedefAlan, setHedefAlan] = useState('Sayısal');
  const [hedef, setHedef] = useState('');
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
        hedef: hedef.trim() || undefined,
        avatarRengi: rastgeleAvatarRengi(),
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <Link to="/admin/ogrenciler" className="btn btn-ghost btn-sm">
          <ArrowLeft size={15} /> Öğrenciler
        </Link>
      </div>

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

          <Alan
            etiket="Hedefi (isteğe bağlı)"
            ipucu="Sınava hazırlanmayan öğrencide panelde geri sayım yerine bu yazıyor."
          >
            <input
              className="input"
              value={hedef}
              onChange={(e) => setHedef(e.target.value)}
              placeholder="Örn. haftada 5 gün düzenli çalışmak"
            />
          </Alan>

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
              Bu bilgileri öğrenciye iletebilirsin. Şifre bir daha gösterilmiyor; kaybolursa yenisini üretmen
              gerekiyor.
            </p>

            <GirisBilgisi baslik="Öğrenci" eposta={sonuc.eposta} sifre={sonuc.sifre} />
            {sonuc.veli && <GirisBilgisi baslik="Veli" eposta={sonuc.veli.eposta} sifre={sonuc.veli.sifre} />}
          </Kart>
        )}

        <Kart style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <h3 style={{ fontSize: '1.05rem' }}>Nasıl işliyor</h3>
          <ol style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingLeft: 20, margin: 0, fontSize: '.92rem', lineHeight: 1.55 }}>
            <li>Ücretsiz görüşme yapılır, öğrenci devam etmeye karar verir ve ödemesini yapar.</li>
            <li>Hesabı buradan açıyorsun; sistem kullanıcıyı ve profilini oluşturuyor, rolünü “öğrenci” olarak ayarlıyor.</li>
            <li>Koç atadığında öğrenci o koçun listesine geçiyor ve koç plan kurmaya başlayabiliyor.</li>
            <li>Kullanıcı adı ve şifreyi öğrenciye iletiyorsun; sitede kayıt formu yok.</li>
          </ol>
        </Kart>
      </div>
      </div>
    </div>
  );
}
