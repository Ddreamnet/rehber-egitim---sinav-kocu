import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Bell, LogOut, Search } from 'lucide-react';
import type { ReactNode } from 'react';
import { Avatar } from '@/components/ui/temel';
import { LogoIsareti } from '@/components/ui/Logo';
import { MARKA } from '@/config/site';
import { useOturum } from '@/auth/Oturum';
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
  ikon: ReactNode;
  /** Alt rotaları da aktif sayma (varsayılan: sadece tam eşleşme) */
  tam?: boolean;
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
  aramaYerTutucu,
  bildirimVar,
  baslikEkstra,
  digerPaneller,
  children,
}: {
  menu: RayOgesi[];
  baslik: string;
  rolEtiketi?: string;
  aramaYerTutucu?: string;
  bildirimVar?: boolean;
  baslikEkstra?: ReactNode;
  digerPaneller?: Array<{ yol: string; etiket: string }>;
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
            >
              {m.ikon}
              <span>{m.etiket}</span>
            </NavLink>
          ))}

          <div className="side-foot">
            {digerPaneller && digerPaneller.length > 0 && (
              <>
                <div className="side-sec">Diğer paneller</div>
                {digerPaneller.map((p) => (
                  <NavLink key={p.yol} to={p.yol} className="side-link" style={{ padding: '8px 14px', fontSize: '.82rem' }}>
                    {p.etiket}
                  </NavLink>
                ))}
              </>
            )}
            <button type="button" className="side-link" style={{ padding: '8px 14px', fontSize: '.82rem' }} onClick={cikisYap}>
              <LogOut size={15} />
              Çıkış
            </button>
          </div>
        </aside>

        <main className="app-main" id="panel-icerik">
          <header style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
            <h1 style={{ fontSize: '1.35rem', fontWeight: 700 }}>{baslik}</h1>
            {baslikEkstra}
            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10 }}>
              {aramaYerTutucu && (
                <div className="search-wrap hide-m">
                  <Search size={16} aria-hidden="true" />
                  <input className="input" placeholder={aramaYerTutucu} aria-label={aramaYerTutucu} style={{ width: 220 }} />
                </div>
              )}
              <button type="button" className="icon-btn" aria-label="Bildirimler">
                <Bell size={18} />
                {bildirimVar && <span className="nokta" />}
              </button>
              <div className="user-pill">
                <Avatar ad={profil?.adSoyad ?? '—'} renk={profil?.avatarRengi} boy="md" />
                <div className="hide-m">
                  <div className="ad">{profil?.adSoyad}</div>
                  <div className="rol">{altSatir(profil)}</div>
                </div>
              </div>
            </div>
          </header>
          {children}
        </main>
      </div>
    </div>
  );
}
