import { Mesajlasma } from '@/components/Mesajlasma';
import { Uyari } from '@/components/ui/temel';

export default function AdminMesajlar() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Uyari tur="info">
        Sistemdeki bütün koç–öğrenci ve koç–veli yazışmaları burada. Her mesajı düzenleyebilir ya da
        silebilirsin; yazdıklarınsa kendi adınla görünür.
      </Uyari>
      <Mesajlasma yetkili />
    </div>
  );
}
