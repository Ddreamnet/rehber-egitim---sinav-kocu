import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { supabase, supabaseVar } from '@/lib/supabase';
import { mevcutProfil, PASIF_HESAP } from '@/data/repo';
import { PROFILLER } from '@/data/demo';
import type { Profil, Rol } from '@/data/tipler';

interface OturumDurumu {
  profil: Profil | null;
  yukleniyor: boolean;
  demoMod: boolean;
  girisYap: (eposta: string, sifre: string) => Promise<void>;
  demoGiris: (rol: Rol) => void;
  cikis: () => Promise<void>;
  /** Profil fotoğrafı gibi kendi verisi değişince yeniden çeker */
  profiliTazele: () => Promise<void>;
}

const Baglam = createContext<OturumDurumu | null>(null);

const DEMO_ANAHTAR = 'rehber.demoRol';

export function OturumSaglayici({ children }: { children: ReactNode }) {
  const [profil, setProfil] = useState<Profil | null>(null);
  const [yukleniyor, setYukleniyor] = useState(true);

  useEffect(() => {
    let iptal = false;

    if (!supabaseVar) {
      const kayitli = localStorage.getItem(DEMO_ANAHTAR) as Rol | null;
      setProfil(kayitli ? PROFILLER[kayitli] ?? null : null);
      setYukleniyor(false);
      return;
    }

    const yukle = async () => {
      try {
        const p = await mevcutProfil();
        if (!iptal) setProfil(p);
      } catch {
        // Pasife alınan hesapta mevcutProfil oturumu kapatıp fırlatır.
        if (!iptal) setProfil(null);
      } finally {
        if (!iptal) setYukleniyor(false);
      }
    };
    void yukle();

    // INITIAL_SESSION mount'taki yükleme ile aynı işi yapar; iki kez profil
    // çekmemek için atlanır (her sayfa açılışında profiles+user_roles ×2 idi).
    const { data: abone } = supabase!.auth.onAuthStateChange((olay) => {
      if (olay === 'INITIAL_SESSION') return;
      void yukle();
    });
    return () => {
      iptal = true;
      abone.subscription.unsubscribe();
    };
  }, []);

  const girisYap = useCallback(async (eposta: string, sifre: string) => {
    if (!supabaseVar) throw new Error('Supabase yapılandırılmadı. Demo girişini kullanabilirsin.');
    const { error } = await supabase!.auth.signInWithPassword({ email: eposta, password: sifre });
    if (error) throw new Error(cevirHata(error.message));

    // Şifre doğru olsa bile hesap pasifse içeri alınmaz; mevcutProfil oturumu
    // kapatır ve mesajı fırlatır.
    try {
      await mevcutProfil();
    } catch (h) {
      throw new Error(h instanceof Error ? h.message : PASIF_HESAP);
    }
  }, []);

  const demoGiris = useCallback((rol: Rol) => {
    localStorage.setItem(DEMO_ANAHTAR, rol);
    setProfil(PROFILLER[rol]);
  }, []);

  const profiliTazele = useCallback(async () => {
    if (!supabaseVar) return;
    try {
      setProfil(await mevcutProfil());
    } catch {
      setProfil(null);
    }
  }, []);

  const cikis = useCallback(async () => {
    localStorage.removeItem(DEMO_ANAHTAR);
    if (supabaseVar) await supabase!.auth.signOut();
    setProfil(null);
  }, []);

  const deger = useMemo<OturumDurumu>(
    () => ({ profil, yukleniyor, demoMod: !supabaseVar, girisYap, demoGiris, cikis, profiliTazele }),
    [profil, yukleniyor, girisYap, demoGiris, cikis, profiliTazele],
  );

  return <Baglam.Provider value={deger}>{children}</Baglam.Provider>;
}

export function useOturum(): OturumDurumu {
  const b = useContext(Baglam);
  if (!b) throw new Error('useOturum yalnızca OturumSaglayici içinde kullanılır.');
  return b;
}

/** Rolün varsayılan panel adresi. */
export function rolAnasayfasi(rol: Rol): string {
  switch (rol) {
    case 'veli':
      return '/veli';
    case 'koc':
      return '/koc';
    case 'admin':
      return '/admin';
    default:
      return '/panel';
  }
}

function cevirHata(mesaj: string): string {
  if (/invalid login credentials/i.test(mesaj)) return 'E-posta veya şifre hatalı.';
  if (/email not confirmed/i.test(mesaj)) return 'E-postanı doğrulaman gerekiyor.';
  return mesaj;
}
