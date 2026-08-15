import { Outlet, useLocation } from 'react-router-dom';
import { CalendarDays, MessageCircle, Users, Wallet } from 'lucide-react';
import { UygulamaKabugu, type RayOgesi } from '@/components/layout/UygulamaKabugu';

const MENU: Array<RayOgesi & { baslik: string }> = [
  { yol: '/koc', etiket: 'Öğrencilerim', baslik: 'Öğrencilerim', ikon: <Users size={19} />, tam: true },
  { yol: '/koc/takvim', etiket: 'Takvim', baslik: 'Takvim', ikon: <CalendarDays size={19} /> },
  { yol: '/koc/gorusmeler', etiket: 'Görüşmeler', baslik: 'Görüşmeler', ikon: <MessageCircle size={19} /> },
  { yol: '/koc/odemeler', etiket: 'Ödemeler', baslik: 'Ödemelerim', ikon: <Wallet size={19} /> },
];

export default function KocKabugu() {
  const { pathname } = useLocation();
  const aktif = [...MENU].reverse().find((m) => pathname === m.yol || pathname.startsWith(`${m.yol}/`));
  const detayMi = /^\/koc\/ogrenci\//.test(pathname);

  return (
    <UygulamaKabugu
      menu={MENU}
      baslik={detayMi ? 'Öğrenci detayı' : (aktif?.baslik ?? 'Koç paneli')}
      rolEtiketi="Koç paneli"
      aramaYerTutucu="Öğrenci ara…"
    >
      <Outlet />
    </UygulamaKabugu>
  );
}
