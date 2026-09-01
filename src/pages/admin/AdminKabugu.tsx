import { Outlet, useLocation } from 'react-router-dom';
import { Inbox, ChartColumnIncreasing, GraduationCap, LayoutGrid, MessagesSquare, Users, Wallet } from 'lucide-react';
import { UygulamaKabugu, type RayOgesi } from '@/components/layout/UygulamaKabugu';
import { Rozet } from '@/components/ui/temel';
import { useOkunmamis } from '@/lib/okunmamis';

const MENU: Array<RayOgesi & { baslik: string }> = [
  { yol: '/admin', etiket: 'Genel bakış', kisaEtiket: 'Genel', baslik: 'Genel bakış', ikon: <LayoutGrid size={19} />, tam: true },
  { yol: '/admin/basvurular', etiket: 'Başvurular', kisaEtiket: 'Başvuru', baslik: 'Gelen başvurular', ikon: <Inbox size={19} /> },
  { yol: '/admin/koclar', etiket: 'Koçlar', baslik: 'Koçlar', ikon: <Users size={19} /> },
  { yol: '/admin/ogrenciler', etiket: 'Öğrenciler', kisaEtiket: 'Öğrenci', baslik: 'Öğrenciler', ikon: <GraduationCap size={19} /> },
  { yol: '/admin/mesajlar', etiket: 'Mesajlar', kisaEtiket: 'Mesaj', baslik: 'Tüm mesajlaşmalar', ikon: <MessagesSquare size={19} /> },
  { yol: '/admin/odemeler', etiket: 'Ödemeler', kisaEtiket: 'Ödeme', baslik: 'Koç ödemeleri', ikon: <Wallet size={19} /> },
  { yol: '/admin/raporlar', etiket: 'Raporlar', kisaEtiket: 'Rapor', baslik: 'Raporlar', ikon: <ChartColumnIncreasing size={19} /> },
];

/* Ekleme ekranları sekme çubuğuna sığmıyor (6+ sekme mobilde fazla);
   ilgili liste ekranındaki birincil butondan açılıyorlar. */
const EK_BASLIKLAR: Record<string, string> = {
  '/admin/ogrenci-ekle': 'Öğrenci ekle',
  '/admin/koc-ekle': 'Koç ekle',
};

export default function AdminKabugu() {
  const { pathname } = useLocation();
  const okunmamis = useOkunmamis();
  const menu = MENU.map((m) => (m.yol === '/admin/mesajlar' ? { ...m, sayac: okunmamis } : m));
  const aktif = [...MENU].reverse().find((m) => pathname === m.yol || pathname.startsWith(`${m.yol}/`));
  const baslik = EK_BASLIKLAR[pathname] ?? aktif?.baslik ?? 'Admin';
  const donem = `${new Date().getFullYear()}–${String(new Date().getFullYear() + 1).slice(2)} dönemi`;

  return (
    <UygulamaKabugu
      menu={menu}
      baslik={baslik}
      rolEtiketi="Admin"
      baslikEkstra={pathname === '/admin' ? <Rozet>{donem}</Rozet> : undefined}
    >
      <Outlet />
    </UygulamaKabugu>
  );
}
