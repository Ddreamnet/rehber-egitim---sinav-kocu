import { useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Camera, KeyRound, LogOut, Trash2 } from 'lucide-react';
import type { ReactNode } from 'react';
import { Avatar } from '@/components/ui/temel';
import { LogoIsareti } from '@/components/ui/Logo';
import { MARKA } from '@/config/site';
import { useOturum } from '@/auth/Oturum';
import { avatarKaldir, avatarYukle, kendiSifreniDegistir } from '@/data/repo';
import { fotografiKucult } from '@/lib/gorsel';
import type { Profil } from '@/data/tipler';

const ROL_ETIKETI: Record<Profil['rol'], string> = {
  ogrenci: 'Öğrenci',
  veli: 'Veli',
  koc: 'Koç',
  admin: 'Admin',
};

/** Profil hapındaki alt satır: öğrencide sınıf · alan, diğerlerinde unvan. */
function altSatir(profil: Profil | null): string {
  if (!profil) return '';
  const parcalar = [profil.sinif, profil.hedefAlan].filter(Boolean);
  if (profil.rol === 'ogrenci' && parcalar.length) return parcalar.join(' · ');
  return profil.hedefAlan || ROL_ETIKETI[profil.rol];
}

export interface RayOgesi {
  yol: string;
  etiket: string;
  /** Alt sekme çubuğunda sığması için kısa ad (yoksa etiket kullanılır) */
  kisaEtiket?: string;
  ikon: ReactNode;
  /** Alt rotaları da aktif sayma (varsayılan: sadece tam eşleşme) */
  tam?: boolean;
  /** Sağ üstte küçük sayı — okunmamış mesaj gibi */
  sayac?: number;
}

/**
 * Panel kabuğu: kareli dış zemin üzerinde 28px radius gradyan tuval,
 * solda 84px ikon-only beyaz ray. ≤880px'te ray alta yüzen hap tab-bar olur
 * (davranış design-tokens.css'teki `.app-shell` kurallarından gelir).
 */
export function UygulamaKabugu({
  menu,
  baslik,
  rolEtiketi,
  baslikEkstra,
  children,
}: {
  menu: RayOgesi[];
  baslik: string;
  rolEtiketi?: string;
  baslikEkstra?: ReactNode;
  children: ReactNode;
}) {
  const { profil, cikis } = useOturum();
  const git = useNavigate();

  const cikisYap = async () => {
    await cikis();
    git('/');
  };

  return (
    <div className="bg-kareli" style={{ color: 'var(--color-text)' }}>
      <a className="skip-link" href="#panel-icerik">
        İçeriğe atla
      </a>
      <div className="app-shell">
        <aside className="app-side" aria-label="Panel menüsü">
          {/* Ray 84px ikon-only: tokens.css `.side-brand` ilk çocuk dışındakileri gizler. */}
          <div className="side-brand">
            <Link to="/" aria-label={`${MARKA.ad} ana sayfa`}>
              <LogoIsareti boyut={32} radius={10} />
            </Link>
            <div>
              <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '1.1rem', lineHeight: 1.2 }}>
                {MARKA.ad}
              </div>
              <div className="hint" style={{ fontSize: '.68rem' }}>
                {rolEtiketi ?? MARKA.altAd}
              </div>
            </div>
          </div>

          {menu.map((m) => (
            <NavLink
              key={m.yol}
              to={m.yol}
              end={m.tam ?? true}
              className={({ isActive }) => (isActive ? 'side-link on' : 'side-link')}
              title={m.etiket}
              aria-label={m.etiket}
            >
              {m.ikon}
              {/* Masaüstünde ray ikon-only (CSS gizler); mobil sekme çubuğunda
                  etiket görünür — dokunmatikte ikon tek başına yetmiyor. */}
              <span>{m.kisaEtiket ?? m.etiket}</span>
              {(m.sayac ?? 0) > 0 && (
                <span className="side-sayac" aria-label={`${m.sayac} okunmamış`}>
                  {m.sayac}
                </span>
              )}
            </NavLink>
          ))}

          <div className="side-foot">
            <button type="button" className="side-link" style={{ padding: '8px 14px', fontSize: '.82rem' }} onClick={cikisYap}>
              <LogOut size={15} />
              Çıkış
            </button>
          </div>
        </aside>

        <main className="app-main" id="panel-icerik">
          <header className="panel-baslik" style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
            <h1 style={{ fontSize: '1.35rem', fontWeight: 700 }}>{baslik}</h1>
            {baslikEkstra && <div className="baslik-ekstra">{baslikEkstra}</div>}
            <div className="panel-eylem" style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10 }}>
              <KullaniciMenusu profil={profil} cikisYap={cikisYap} />
            </div>
          </header>
          {children}
        </main>
      </div>
    </div>
  );
}

/**
 * Profil hapı + menü.
 *
 * Mobilde ve uygulamada sol ray alt tab-bar'a dönüşüyor ve "Çıkış" bağlantısını
 * taşıyan alt bölüm gizleniyor — çıkışın tek erişilebilir yeri burası.
 */
function KullaniciMenusu({ profil, cikisYap }: { profil: Profil | null; cikisYap: () => void }) {
  const [acik, setAcik] = useState(false);
  const [islemde, setIslemde] = useState(false);
  const [hata, setHata] = useState<string | null>(null);
  const [sifreAcik, setSifreAcik] = useState(false);
  const [yeniSifre, setYeniSifre] = useState('');
  const [tekrar, setTekrar] = useState('');
  const [basarili, setBasarili] = useState(false);
  const sarmal = useRef<HTMLDivElement>(null);
  const dosyaGirdisi = useRef<HTMLInputElement>(null);
  const qc = useQueryClient();
  const { profiliTazele } = useOturum();

  const fotoSec = async (dosya: File | undefined) => {
    if (!dosya || !profil) return;
    setIslemde(true);
    setHata(null);
    try {
      // Telefon fotoğrafları 3–5 MB gelebiliyor; 256 px kareye indiriyoruz.
      await avatarYukle(profil.id, await fotografiKucult(dosya));
      await profiliTazele();
      await qc.invalidateQueries();
      setAcik(false);
    } catch (h) {
      setHata(h instanceof Error ? h.message : 'Fotoğraf yüklenemedi.');
    } finally {
      setIslemde(false);
    }
  };

  const sifreDegistir = async () => {
    setHata(null);
    if (yeniSifre !== tekrar) {
      setHata('İki şifre birbirini tutmuyor.');
      return;
    }
    setIslemde(true);
    try {
      await kendiSifreniDegistir(yeniSifre);
      setBasarili(true);
      setYeniSifre('');
      setTekrar('');
      setSifreAcik(false);
    } catch (h) {
      setHata(h instanceof Error ? h.message : 'Şifre değiştirilemedi.');
    } finally {
      setIslemde(false);
    }
  };

  const fotoKaldir = async () => {
    if (!profil) return;
    setIslemde(true);
    try {
      await avatarKaldir(profil.id);
      await profiliTazele();
      await qc.invalidateQueries();
      setAcik(false);
    } finally {
      setIslemde(false);
    }
  };

  useEffect(() => {
    if (!acik) return;
    const disariTikla = (e: MouseEvent) => {
      if (!sarmal.current?.contains(e.target as Node)) setAcik(false);
    };
    const kacis = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setAcik(false);
    };
    document.addEventListener('mousedown', disariTikla);
    document.addEventListener('keydown', kacis);
    return () => {
      document.removeEventListener('mousedown', disariTikla);
      document.removeEventListener('keydown', kacis);
    };
  }, [acik]);

  return (
    <div ref={sarmal} style={{ position: 'relative' }}>
      <button
        type="button"
        className="user-pill"
        onClick={() => setAcik((a) => !a)}
        aria-expanded={acik}
        aria-haspopup="menu"
        aria-label={`${profil?.adSoyad ?? 'Hesap'} — hesap menüsü`}
      >
        <Avatar ad={profil?.adSoyad ?? '—'} renk={profil?.avatarRengi} foto={profil?.avatarUrl} boy="md" />
        <div className="hide-m">
          <div className="ad">{profil?.adSoyad}</div>
          <div className="rol">{altSatir(profil)}</div>
        </div>
      </button>

      <input
        ref={dosyaGirdisi}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        hidden
        onChange={(e) => {
          void fotoSec(e.target.files?.[0]);
          e.target.value = '';
        }}
      />

      {acik && (
        <div className="hesap-menu" role="menu">
          <div className="hesap-menu-ust">
            <div className="ad">{profil?.adSoyad}</div>
            <div className="rol">{profil?.eposta ?? altSatir(profil)}</div>
          </div>

          {/* Fotoğrafı kişinin kendisi yüklüyor; her rolde aynı yer */}
          <button type="button" role="menuitem" onClick={() => dosyaGirdisi.current?.click()} disabled={islemde}>
            <Camera size={15} />
            {islemde ? 'Yükleniyor…' : profil?.avatarUrl ? 'Fotoğrafı değiştir' : 'Fotoğraf ekle'}
          </button>
          {profil?.avatarUrl && (
            <button type="button" role="menuitem" onClick={fotoKaldir} disabled={islemde}>
              <Trash2 size={15} />
              Fotoğrafı kaldır
            </button>
          )}
          {/* Herkes kendi şifresini değiştirebilsin — admin araya girmesin */}
          {!sifreAcik ? (
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setSifreAcik(true);
                setBasarili(false);
                setHata(null);
              }}
              disabled={islemde}
            >
              <KeyRound size={15} />
              Şifre değiştir
            </button>
          ) : (
            <div className="hesap-menu-form">
              <label>
                Yeni şifre
                <input
                  className="input"
                  type="password"
                  value={yeniSifre}
                  onChange={(e) => setYeniSifre(e.target.value)}
                  minLength={8}
                  autoComplete="new-password"
                  placeholder="En az 8 karakter"
                />
              </label>
              <label>
                Yeni şifre (tekrar)
                <input
                  className="input"
                  type="password"
                  value={tekrar}
                  onChange={(e) => setTekrar(e.target.value)}
                  autoComplete="new-password"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') void sifreDegistir();
                  }}
                />
              </label>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={sifreDegistir}
                  disabled={islemde || yeniSifre.length < 8}
                >
                  {islemde ? 'Kaydediliyor…' : 'Kaydet'}
                </button>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => {
                    setSifreAcik(false);
                    setYeniSifre('');
                    setTekrar('');
                    setHata(null);
                  }}
                >
                  Vazgeç
                </button>
              </div>
            </div>
          )}

          {basarili && (
            <span className="hesap-menu-basarili" role="status">
              Şifren güncellendi.
            </span>
          )}
          {hata && (
            <span className="hesap-menu-hata" role="alert">
              {hata}
            </span>
          )}

          <button type="button" role="menuitem" onClick={cikisYap} className="cikis">
            <LogOut size={15} />
            Çıkış yap
          </button>
        </div>
      )}
    </div>
  );
}
