import { Outlet, useLocation } from 'react-router-dom';
import { ChartColumnIncreasing, GraduationCap, LayoutGrid, UserPlus, Users, Wallet } from 'lucide-react';
import { UygulamaKabugu, type RayOgesi } from '@/components/layout/UygulamaKabugu';
import { Rozet } from '@/components/ui/temel';

const MENU: Array<RayOgesi & { baslik: string }> = [
  { yol: '/admin', etiket: 'Genel bakış', baslik: 'Genel bakış', ikon: <LayoutGrid size={19} />, tam: true },
  { yol: '/admin/koclar', etiket: 'Koçlar', baslik: 'Koçlar', ikon: <Users size={19} /> },
  { yol: '/admin/ogrenciler', etiket: 'Öğrenciler', baslik: 'Öğrenciler', ikon: <GraduationCap size={19} /> },
  { yol: '/admin/ogrenci-ekle', etiket: 'Öğrenci ekle', baslik: 'Öğrenci ekle', ikon: <UserPlus size={19} /> },
  { yol: '/admin/odemeler', etiket: 'Ödemeler', baslik: 'Koç ödemeleri', ikon: <Wallet size={19} /> },
  { yol: '/admin/raporlar', etiket: 'Raporlar', baslik: 'Raporlar', ikon: <ChartColumnIncreasing size={19} /> },
];

export default function AdminKabugu() {
  const { pathname } = useLocation();
  const aktif = [...MENU].reverse().find((m) => pathname === m.yol || pathname.startsWith(`${m.yol}/`));
  const donem = `${new Date().getFullYear()}–${String(new Date().getFullYear() + 1).slice(2)} dönemi`;

  return (
    <UygulamaKabugu
      menu={MENU}
      baslik={aktif?.baslik ?? 'Admin'}
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
