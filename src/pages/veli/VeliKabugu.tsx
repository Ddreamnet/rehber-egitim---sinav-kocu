import { Outlet, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { LayoutGrid, MessageCircle, MessagesSquare } from 'lucide-react';
import { UygulamaKabugu, type RayOgesi } from '@/components/layout/UygulamaKabugu';
import { Rozet } from '@/components/ui/temel';
import { useOturum } from '@/auth/Oturum';
import { cocugum, haftaPlani } from '@/data/repo';
import { useOkunmamis } from '@/lib/okunmamis';

const MENU: Array<RayOgesi & { baslik: (ad: string) => string }> = [
  { yol: '/veli', etiket: 'Özet', baslik: (ad) => `${ad} haftası`, ikon: <LayoutGrid size={19} />, tam: true },
  { yol: '/veli/gorusmeler', etiket: 'Görüşmeler', kisaEtiket: 'Görüşme', baslik: () => 'Görüşmeler', ikon: <MessageCircle size={19} /> },
  { yol: '/veli/mesajlar', etiket: 'Mesajlar', kisaEtiket: 'Mesaj', baslik: () => 'Koçla mesajlaşma', ikon: <MessagesSquare size={19} /> },
];

export default function VeliKabugu() {
  const { pathname } = useLocation();
  const { profil } = useOturum();
  const veliId = profil?.id ?? '';

  const bag = useQuery({ queryKey: ['cocugum', veliId], queryFn: () => cocugum(veliId) });
  const plan = useQuery({
    queryKey: ['plan', bag.data?.ogrenci.id],
    queryFn: () => haftaPlani(bag.data!.ogrenci.id),
    enabled: Boolean(bag.data?.ogrenci.id),
  });

  const cocukAdi = bag.data?.ogrenci.adSoyad.split(' ')[0] ?? '';
  const okunmamis = useOkunmamis();
  const menu = MENU.map((m) => (m.yol === '/veli/mesajlar' ? { ...m, sayac: okunmamis } : m));
  const aktif = [...MENU].reverse().find((m) => pathname === m.yol || pathname.startsWith(`${m.yol}/`));
  const oran = plan.data?.oran ?? 0;

  return (
    <UygulamaKabugu
      menu={menu}
      baslik={aktif?.baslik(cocukAdi ? `${cocukAdi}’in` : 'Bu') ?? 'Veli paneli'}
      rolEtiketi="Veli paneli"
      baslikEkstra={
        pathname === '/veli' ? (
          <Rozet ton={oran >= 0.5 ? 'success' : 'warning'}>{oran >= 0.5 ? 'Plan yolunda' : 'Plan gecikti'}</Rozet>
        ) : undefined
      }
    >
      <Outlet />
    </UygulamaKabugu>
  );
}
