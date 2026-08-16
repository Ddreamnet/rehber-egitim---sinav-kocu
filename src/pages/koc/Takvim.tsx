import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Avatar, Kart, Rozet, BosDurum } from '@/components/ui/temel';
import { gorusmeTuru, gunAdi, saat, tarihBlogu, tarihUzun } from '@/lib/format';
import { useOturum } from '@/auth/Oturum';
import { kocGorusmeleri } from '@/data/repo';

export default function KocTakvim() {
  const { profil } = useOturum();
  const kocId = profil?.id ?? '';
  const gorusmeler = useQuery({ queryKey: ['koc-gorusmeleri', kocId], queryFn: () => kocGorusmeleri(kocId) });

  const gunler = useMemo(() => {
    const yaklasan = (gorusmeler.data ?? [])
      .filter((g) => new Date(g.baslangic).getTime() >= Date.now() - 3600000 && g.durum !== 'iptal')
      .sort((a, b) => a.baslangic.localeCompare(b.baslangic));

    const harita = new Map<string, typeof yaklasan>();
    for (const g of yaklasan) {
      const anahtar = new Date(g.baslangic).toISOString().slice(0, 10);
      harita.set(anahtar, [...(harita.get(anahtar) ?? []), g]);
    }
    return [...harita.entries()];
  }, [gorusmeler.data]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {gunler.length === 0 && (
        <Kart>
          <BosDurum
            baslik="Yaklaşan görüşme yok"
            aciklama="Öğrenci detay sayfasından yeni görüşme planlayabilirsin."
          />
        </Kart>
      )}

      {gunler.map(([gun, liste]) => (
        <Kart key={gun} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div className="date-block">
              <span className="gun">{tarihBlogu(gun).gun}</span>
              <span className="ay">{tarihBlogu(gun).ay}</span>
            </div>
            <div>
              <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 600 }}>{gunAdi(gun)}</div>
              <div className="hint">{tarihUzun(gun)}</div>
            </div>
            <Rozet style={{ marginLeft: 'auto' }}>{liste.length} görüşme</Rozet>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {liste.map((g) => (
              <Link
                key={g.id}
                to={`/koc/ogrenci/${g.ogrenciId}`}
                className="satir"
                style={{ color: 'var(--color-text)' }}
              >
                <span style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 600, fontSize: '.9rem', width: 52 }}>
                  {saat(g.baslangic)}
                </span>
                <Avatar ad={g.ogrenciAdi} boy="md" />
                <span style={{ fontSize: '.92rem', fontWeight: 600 }}>{g.ogrenciAdi}</span>
                <span className="hint" style={{ marginLeft: 'auto' }}>
                  {g.sureDk} dk · {gorusmeTuru(g.tur)}
                </span>
              </Link>
            ))}
          </div>
        </Kart>
      ))}
    </div>
  );
}
