import { Suspense, lazy } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import type { ReactNode } from 'react';
import { rolAnasayfasi, useOturum } from '@/auth/Oturum';
import { SiteSayfasi } from '@/components/layout/SiteKabugu';
import { BosDurum, ButonLink, Kart } from '@/components/ui/temel';
import type { Rol } from '@/data/tipler';

// Landing ilk açılışta gerekiyor; gerisi rota bazlı bölünür (mobile-first yükleme).
import Landing from '@/pages/Landing';

const NasilCalisir = lazy(() => import('@/pages/NasilCalisir'));
const Blog = lazy(() => import('@/pages/Blog'));
const BlogYazisi = lazy(() => import('@/pages/BlogYazisi'));
const Basvuru = lazy(() => import('@/pages/Basvuru'));
const Giris = lazy(() => import('@/pages/Giris'));
const Styleguide = lazy(() => import('@/pages/Styleguide'));
const Yasal = lazy(() => import('@/pages/Yasal'));

const PanelKabugu = lazy(() => import('@/pages/panel/PanelKabugu'));
const PanelGenelBakis = lazy(() => import('@/pages/panel/GenelBakis'));
const PanelMufredat = lazy(() => import('@/pages/panel/Mufredat'));
const PanelIlerleme = lazy(() => import('@/pages/panel/Ilerleme'));
const PanelNetDenge = lazy(() => import('@/pages/panel/NetDenge'));
const PanelGorusmeler = lazy(() => import('@/pages/panel/Gorusmeler'));

const VeliKabugu = lazy(() => import('@/pages/veli/VeliKabugu'));
const VeliOzet = lazy(() => import('@/pages/veli/Ozet'));
const VeliGorusmeler = lazy(() => import('@/pages/veli/Gorusmeler'));

const KocKabugu = lazy(() => import('@/pages/koc/KocKabugu'));
const KocOgrenciler = lazy(() => import('@/pages/koc/Ogrenciler'));
const KocOgrenciDetay = lazy(() => import('@/pages/koc/OgrenciDetay'));
const KocTakvim = lazy(() => import('@/pages/koc/Takvim'));
const KocGorusmeler = lazy(() => import('@/pages/koc/Gorusmeler'));
const KocOdemeler = lazy(() => import('@/pages/koc/Odemeler'));

const AdminKabugu = lazy(() => import('@/pages/admin/AdminKabugu'));
const AdminGenelBakis = lazy(() => import('@/pages/admin/GenelBakis'));
const AdminKoclar = lazy(() => import('@/pages/admin/Koclar'));
const AdminKocDetay = lazy(() => import('@/pages/admin/KocDetay'));
const AdminOgrenciler = lazy(() => import('@/pages/admin/Ogrenciler'));
const AdminOgrenciEkle = lazy(() => import('@/pages/admin/OgrenciEkle'));
const AdminOgrenciDetay = lazy(() => import('@/pages/admin/OgrenciDetay'));
const AdminOdemeler = lazy(() => import('@/pages/admin/Odemeler'));
const AdminRaporlar = lazy(() => import('@/pages/admin/Raporlar'));

function Yukleniyor() {
  return (
    <div className="bg-kareli" style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 24 }}>
      <div className="iskelet" style={{ width: 'min(420px,90vw)', height: 120 }} />
    </div>
  );
}

/** Rol tabanlı rota koruması. Admin tüm panelleri görebilir. */
function Koruma({ roller, children }: { roller: Rol[]; children: ReactNode }) {
  const { profil, yukleniyor } = useOturum();

  if (yukleniyor) {
    return (
      <div className="bg-kareli" style={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}>
        <div className="iskelet" style={{ width: 'min(420px,90vw)', height: 120 }} />
      </div>
    );
  }

  if (!profil) return <Navigate to="/giris" replace />;
  if (!roller.includes(profil.rol) && profil.rol !== 'admin') {
    return <Navigate to={rolAnasayfasi(profil.rol)} replace />;
  }
  return <>{children}</>;
}

function Bulunamadi() {
  return (
    <SiteSayfasi>
      <div className="container" style={{ padding: '128px 0 96px' }}>
        <Kart>
          <h1 style={{ fontSize: '1.6rem', textAlign: 'center', marginBottom: 8 }}>Sayfa bulunamadı</h1>
          <BosDurum baslik="" aciklama="Aradığın adres taşınmış ya da hiç var olmamış olabilir.">
            <ButonLink to="/" tip="outline" boy="sm">
              Ana sayfaya dön
            </ButonLink>
          </BosDurum>
        </Kart>
      </div>
    </SiteSayfasi>
  );
}

export default function App() {
  return (
    <Suspense fallback={<Yukleniyor />}>
      <Rotalar />
    </Suspense>
  );
}

function Rotalar() {
  return (
    <Routes>
      {/* Herkese açık */}
      <Route path="/" element={<Landing />} />
      <Route path="/nasil-calisir" element={<NasilCalisir />} />
      <Route path="/blog" element={<Blog />} />
      <Route path="/blog/:slug" element={<BlogYazisi />} />
      <Route path="/basvuru" element={<Basvuru />} />
      <Route path="/giris" element={<Giris />} />
      <Route path="/styleguide" element={<Styleguide />} />
      <Route path="/gizlilik" element={<Yasal tur="gizlilik" />} />
      <Route path="/kvkk" element={<Yasal tur="kvkk" />} />

      {/* Öğrenci */}
      <Route
        path="/panel"
        element={
          <Koruma roller={['ogrenci']}>
            <PanelKabugu />
          </Koruma>
        }
      >
        <Route index element={<PanelGenelBakis />} />
        <Route path="mufredat" element={<PanelMufredat />} />
        <Route path="ilerleme" element={<PanelIlerleme />} />
        <Route path="net-denge" element={<PanelNetDenge />} />
        <Route path="gorusmeler" element={<PanelGorusmeler />} />
      </Route>

      {/* Veli */}
      <Route
        path="/veli"
        element={
          <Koruma roller={['veli']}>
            <VeliKabugu />
          </Koruma>
        }
      >
        <Route index element={<VeliOzet />} />
        <Route path="gorusmeler" element={<VeliGorusmeler />} />
      </Route>

      {/* Koç */}
      <Route
        path="/koc"
        element={
          <Koruma roller={['koc']}>
            <KocKabugu />
          </Koruma>
        }
      >
        <Route index element={<KocOgrenciler />} />
        <Route path="ogrenci/:ogrenciId" element={<KocOgrenciDetay />} />
        <Route path="takvim" element={<KocTakvim />} />
        <Route path="gorusmeler" element={<KocGorusmeler />} />
        <Route path="odemeler" element={<KocOdemeler />} />
      </Route>

      {/* Admin */}
      <Route
        path="/admin"
        element={
          <Koruma roller={['admin']}>
            <AdminKabugu />
          </Koruma>
        }
      >
        <Route index element={<AdminGenelBakis />} />
        <Route path="koclar" element={<AdminKoclar />} />
        <Route path="koc/:kocId" element={<AdminKocDetay />} />
        <Route path="ogrenciler" element={<AdminOgrenciler />} />
        <Route path="ogrenci-ekle" element={<AdminOgrenciEkle />} />
        <Route path="ogrenci/:ogrenciId" element={<AdminOgrenciDetay />} />
        <Route path="odemeler" element={<AdminOdemeler />} />
        <Route path="raporlar" element={<AdminRaporlar />} />
      </Route>

      <Route path="*" element={<Bulunamadi />} />
    </Routes>
  );
}
