import { Mesajlasma } from '@/components/Mesajlasma';
import { useOturum } from '@/auth/Oturum';

export default function KocMesajlar() {
  const { profil } = useOturum();
  return <Mesajlasma kocId={profil?.id} />;
}
