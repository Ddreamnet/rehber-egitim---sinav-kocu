import { Outlet, useLocation } from 'react-router-dom';
import { ChartColumnIncreasing, GraduationCap, LayoutGrid, Users, Wallet } from 'lucide-react';
import { UygulamaKabugu, type RayOgesi } from '@/components/layout/UygulamaKabugu';
import { Rozet } from '@/components/ui/temel';

const MENU: Array<RayOgesi & { baslik: string }> = [
  { yol: '/admin', etiket: 'Genel bakış', kisaEtiket: 'Genel', baslik: 'Genel bakış', ikon: <LayoutGrid size={19} />, tam: true },
  { yol: '/admin/koclar', etiket: 'Koçlar', baslik: 'Koçlar', ikon: <Users size={19} /> },
  { yol: '/admin/ogrenciler', etiket: 'Öğrenciler', kisaEtiket: 'Öğrenci', baslik: 'Öğrenciler', ikon: <GraduationCap size={19} /> },
  { yol: '/admin/odemeler', etiket: 'Ödemeler', kisaEtiket: 'Ödeme', baslik: 'Koç ödemeleri', ikon: <Wallet size={19} /> },
  { yol: '/admin/raporlar', etiket: 'Raporlar', kisaEtiket: 'Rapor', baslik: 'Raporlar', ikon: <ChartColumnIncreasing size={19} /> },
];

/* "Öğrenci ekle" sekme çubuğuna sığmıyordu (6 sekme mobilde fazla);
   Öğrenciler ekranındaki birincil butondan açılıyor. */
const EK_BASLIKLAR: Record<string, string> = { '/admin/ogrenci-ekle': 'Öğrenci ekle' };

export default function AdminKabugu() {
  const { pathname } = useLocation();
  const aktif = [...MENU].reverse().find((m) => pathname === m.yol || pathname.startsWith(`${m.yol}/`));
  const baslik = EK_BASLIKLAR[pathname] ?? aktif?.baslik ?? 'Admin';
  const donem = `${new Date().getFullYear()}–${String(new Date().getFullYear() + 1).slice(2)} dönemi`;

  return (
    <UygulamaKabugu
      menu={MENU}
      baslik={baslik}
      rolEtiketi="Admin"
      aramaYerTutucu="Koç, öğrenci ara…"
      baslikEkstra={pathname === '/admin' ? <Rozet>{donem}</Rozet> : undefined}
      digerPaneller={[
        { yol: '/panel', etiket: 'Öğrenci' },
        { yol: '/veli', etiket: 'Veli' },
        { yol: '/koc', etiket: 'Koç' },
      ]}
    >
      <Outlet />
    </UygulamaKabugu>
  );
}
