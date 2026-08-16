import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { ArrowLeft, RefreshCw, UserPlus } from 'lucide-react';
import { Alan, Buton, Kart, Rozet, Uyari } from '@/components/ui/temel';
import { GirisBilgisi, rastgeleAvatarRengi, sifreUret } from './hesap';
import { kocEkle } from '@/data/repo';

export default function AdminKocEkle() {
  const qc = useQueryClient();

  const [adSoyad, setAdSoyad] = useState('');
  const [eposta, setEposta] = useState('');
  const [sifre, setSifre] = useState(sifreUret);
  const [telefon, setTelefon] = useState('');

  const [islemde, setIslemde] = useState(false);
  const [hata, setHata] = useState<string | null>(null);
  const [sonuc, setSonuc] = useState<{ adSoyad: string; eposta: string; sifre: string } | null>(null);

  const gonder = async (e: React.FormEvent) => {
    e.preventDefault();
    setHata(null);
    setIslemde(true);
    try {
      await kocEkle({
        adSoyad: adSoyad.trim(),
        eposta: eposta.trim(),
        sifre,
        telefon: telefon.trim() || undefined,
        avatarRengi: rastgeleAvatarRengi(),
      });

      setSonuc({ adSoyad: adSoyad.trim(), eposta: eposta.trim(), sifre });
      setAdSoyad('');
      setEposta('');
      setTelefon('');
      setSifre(sifreUret());

      await qc.invalidateQueries({ queryKey: ['koclar'] });
    } catch (h) {
      setHata(h instanceof Error ? h.message : 'Koç eklenemedi.');
    } finally {
      setIslemde(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <Link to="/admin/koclar" className="btn btn-ghost btn-sm">
          <ArrowLeft size={15} /> Koçlar
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
              <h3 style={{ fontSize: '1.05rem' }}>Yeni koç</h3>
              <p className="hint">Hesap burada açılır; kullanıcı adı ve şifre koça iletilir.</p>
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

            <Alan etiket="Şifre" ipucu="En az 8 karakter. Koç ilk girişte değiştirebilir.">
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

            <Alan etiket="Telefon (isteğe bağlı)">
              <input className="input" value={telefon} onChange={(e) => setTelefon(e.target.value)} inputMode="tel" />
            </Alan>

            {hata && <Uyari tur="error">{hata}</Uyari>}

            <Buton type="submit" boy="lg" disabled={islemde}>
              {islemde ? 'Ekleniyor…' : 'Koçu ekle'}
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
                Bu bilgileri koça iletebilirsin. Şifre bir daha gösterilmiyor; kaybolursa yenisini üretmen
                gerekiyor.
              </p>
              <GirisBilgisi baslik={sonuc.adSoyad} eposta={sonuc.eposta} sifre={sonuc.sifre} />
            </Kart>
          )}

          <Kart style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <h3 style={{ fontSize: '1.05rem' }}>Sonraki adım</h3>
            <ol
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
                paddingLeft: 20,
                margin: 0,
                fontSize: '.92rem',
                lineHeight: 1.55,
              }}
            >
              <li>Hesap açılıyor ve koç listesine ekleniyor.</li>
              <li>Öğrenci detayından koç atamasını yapabilirsin; öğrenci o koçun listesine geçiyor.</li>
              <li>Koç kendi panelinden haftalık ders programını kuruyor ve görüşme planlıyor.</li>
              <li>Ay sonunda hakedişi Ödemeler ekranından hesaplayabilirsin.</li>
            </ol>
          </Kart>
        </div>
      </div>
    </div>
  );
}
