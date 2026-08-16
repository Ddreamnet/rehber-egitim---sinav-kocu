import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Avatar, Kart, Rozet, BosDurum } from '@/components/ui/temel';
import { TabloKart } from '@/components/ui/TabloKart';
import { goreliZaman, gorusmeTuru, gunAdi, saat, tarihKisa } from '@/lib/format';
import { useOturum } from '@/auth/Oturum';
import { kocGorusmeleri, veliMesajlari } from '@/data/repo';

const DURUM_ETIKET = {
  planlandi: { etiket: 'Planlandı', ton: 'info' as const },
  tamamlandi: { etiket: 'Tamamlandı', ton: 'success' as const },
  iptal: { etiket: 'İptal', ton: 'error' as const },
};

export default function KocGorusmeler() {
  const { profil } = useOturum();
  const kocId = profil?.id ?? '';

  const gorusmeler = useQuery({ queryKey: ['koc-gorusmeleri', kocId], queryFn: () => kocGorusmeleri(kocId) });
  const mesajlar = useQuery({ queryKey: ['koc-mesajlari', kocId], queryFn: () => veliMesajlari({ kocId }) });

  const sirali = [...(gorusmeler.data ?? [])].sort((a, b) => b.baslangic.localeCompare(a.baslangic));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <TabloKart>
        <div style={{ display: 'flex', alignItems: 'center', padding: '16px 0 8px' }}>
          <h3 style={{ fontSize: '1.05rem' }}>Tüm görüşmeler</h3>
        </div>
        <table className="table">
          <thead>
            <tr>
              <th>Öğrenci</th>
              <th>Tarih</th>
              <th>Saat</th>
              <th className="num">Süre</th>
              <th>Tür</th>
              <th>Durum</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {sirali.map((g) => (
              <tr key={g.id}>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Avatar ad={g.ogrenciAdi} boy="md" />
                    <strong>{g.ogrenciAdi}</strong>
                  </div>
                </td>
                <td className="hint">
                  {tarihKisa(g.baslangic)} · {gunAdi(g.baslangic).slice(0, 3)}
                </td>
                <td style={{ fontVariantNumeric: 'tabular-nums' }}>{saat(g.baslangic)}</td>
                <td className="num">{g.sureDk} dk</td>
                <td className="hint">{gorusmeTuru(g.tur)}</td>
                <td>
                  <Rozet ton={DURUM_ETIKET[g.durum].ton}>{DURUM_ETIKET[g.durum].etiket}</Rozet>
                </td>
                <td>
                  <Link to={`/koc/ogrenci/${g.ogrenciId}`} className="btn btn-outline btn-sm">
                    Detay
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {sirali.length === 0 && <BosDurum baslik="Görüşme kaydı yok" />}
      </TabloKart>

      <Kart style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <h3 style={{ fontSize: '1.05rem' }}>Velilerden gelen mesajlar</h3>
        {mesajlar.data?.length ? (
          mesajlar.data.map((m) => (
            <div key={m.id} className="satir" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 6 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%' }}>
                <Avatar ad={m.veliAdi} renk="var(--ders-dil)" boy="md" />
                <strong style={{ fontSize: '.9rem' }}>{m.veliAdi}</strong>
                <span className="hint" style={{ marginLeft: 'auto', fontSize: '.75rem' }}>
                  {goreliZaman(m.tarih)}
                </span>
              </div>
              <p style={{ fontSize: '.9rem', lineHeight: 1.55 }}>{m.metin}</p>
            </div>
          ))
        ) : (
          <p className="hint">Yeni mesaj yok.</p>
        )}
      </Kart>
    </div>
  );
}
