import { Outlet, useLocation } from 'react-router-dom';
import { BookOpen, ChartColumnIncreasing, LayoutGrid, MessageCircle, MessagesSquare, Target } from 'lucide-react';
import { UygulamaKabugu, type RayOgesi } from '@/components/layout/UygulamaKabugu';
import { ogrenciProgrami } from '@/config/site';
import { useOturum } from '@/auth/Oturum';
import { useOkunmamis } from '@/lib/okunmamis';

const MENU: Array<RayOgesi & { baslik: string }> = [
  { yol: '/panel', etiket: 'Genel bakış', kisaEtiket: 'Genel', baslik: 'Genel bakış', ikon: <LayoutGrid size={19} />, tam: true },
  { yol: '/panel/mufredat', etiket: 'Müfredat', baslik: 'Müfredat', ikon: <BookOpen size={19} /> },
  {
    yol: '/panel/ilerleme',
    etiket: 'İlerleme',
    kisaEtiket: 'İlerleme',
    baslik: 'Soru girişi & ilerleme',
    ikon: <ChartColumnIncreasing size={19} />,
  },
  { yol: '/panel/net-denge', etiket: 'Net Denge', baslik: 'Net Denge', ikon: <Target size={19} /> },
  { yol: '/panel/gorusmeler', etiket: 'Görüşmeler', kisaEtiket: 'Görüşme', baslik: 'Görüşmeler', ikon: <MessageCircle size={19} /> },
  { yol: '/panel/mesajlar', etiket: 'Mesajlar', kisaEtiket: 'Mesaj', baslik: 'Koçunla mesajlaşma', ikon: <MessagesSquare size={19} /> },
];

export default function PanelKabugu() {
  const { pathname } = useLocation();
  const { profil } = useOturum();
  // Net Denge sıralama/puan hedefine dayanıyor; sınava hazırlanmayan
  // öğrencide karşılığı olmayan bir ekran.
  const sinavAdayi = ogrenciProgrami(profil).tur === 'sinav';
  const okunmamis = useOkunmamis();
  const menu = (sinavAdayi ? MENU : MENU.filter((m) => m.yol !== '/panel/net-denge')).map((m) =>
    m.yol === '/panel/mesajlar' ? { ...m, sayac: okunmamis } : m,
  );
  const aktif = [...menu].reverse().find((m) => pathname === m.yol || pathname.startsWith(`${m.yol}/`));

  return (
    <UygulamaKabugu
      menu={menu}
      baslik={aktif?.baslik ?? 'Panel'}
      rolEtiketi="Öğrenci paneli"
    >
      <Outlet />
    </UygulamaKabugu>
  );
}
