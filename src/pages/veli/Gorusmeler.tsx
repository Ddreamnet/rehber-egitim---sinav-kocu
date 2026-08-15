import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Buton, Kart, Rozet, BosDurum } from '@/components/ui/temel';
import { goreliZaman, gunAdi, saat, tarihBlogu, tarihKisa } from '@/lib/format';
import { useOturum } from '@/auth/Oturum';
import { cocugum, gecmisGorusmeler, sonrakiGorusme, veliMesajGonder, veliMesajlari } from '@/data/repo';

export default function VeliGorusmeler() {
  const { profil } = useOturum();
  const veliId = profil?.id ?? '';
  const qc = useQueryClient();

  const bag = useQuery({ queryKey: ['cocugum', veliId], queryFn: () => cocugum(veliId) });
  const ogrenciId = bag.data?.ogrenci.id ?? '';
  const etkin = Boolean(ogrenciId);

  const sonraki = useQuery({ queryKey: ['sonraki-gorusme', ogrenciId], queryFn: () => sonrakiGorusme(ogrenciId), enabled: etkin });
  const gecmis = useQuery({ queryKey: ['gecmis-gorusmeler', ogrenciId], queryFn: () => gecmisGorusmeler(ogrenciId), enabled: etkin });
  const mesajlar = useQuery({ queryKey: ['veli-mesajlari', veliId], queryFn: () => veliMesajlari({ veliId }) });

  const [metin, setMetin] = useState('');
  const [gonderiliyor, setGonderiliyor] = useState(false);

  const gonder = async () => {
    const temiz = metin.trim();
    if (!temiz || !ogrenciId) return;
    setGonderiliyor(true);
    try {
      await veliMesajGonder(veliId, ogrenciId, sonraki.data?.kocId ?? null, temiz);
      setMetin('');
      await qc.invalidateQueries({ queryKey: ['veli-mesajlari', veliId] });
    } finally {
      setGonderiliyor(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {sonraki.data ? (
        <Kart style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
          <div className="date-block date-block-lg">
            <span className="gun">{tarihBlogu(sonraki.data.baslangic).gun}</span>
            <span className="ay">{tarihBlogu(sonraki.data.baslangic).ay}</span>
          </div>
          <div>
            <h3 style={{ fontSize: '1.15rem' }}>
              Sonraki görüşme: {gunAdi(sonraki.data.baslangic)} {saat(sonraki.data.baslangic)}
            </h3>
            <p className="hint">
              {bag.data?.ogrenci.adSoyad.split(' ')[0]} + {sonraki.data.kocAdi} · {sonraki.data.sureDk} dk — görüşme
              öğrenciyle yapılır.
            </p>
          </div>
        </Kart>
      ) : (
        <Kart>
          <BosDurum baslik="Planlanmış görüşme yok" aciklama="Koç yeni görüşme oluşturduğunda burada görünür." />
        </Kart>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: 24 }}>
        <Kart style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <h3 style={{ fontSize: '1.05rem' }}>Koça mesaj bırak</h3>
          <textarea
            className="input"
            rows={4}
            value={metin}
            onChange={(e) => setMetin(e.target.value)}
            placeholder="Görüşmede konuşulmasını istediğin bir konu…"
            aria-label="Koça mesaj"
          />
          <Buton boy="sm" style={{ alignSelf: 'flex-start' }} onClick={gonder} disabled={gonderiliyor || !metin.trim()}>
            Mesajı gönder
          </Buton>
          <p className="hint">Mesajın koça iletilir; öğrenci görmez.</p>
          {mesajlar.data?.map((m) => (
            <div key={m.id} className="satir" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 6 }}>
              <span className="hint" style={{ fontSize: '.75rem' }}>
                {goreliZaman(m.tarih)}
              </span>
              <p style={{ fontSize: '.88rem', lineHeight: 1.55 }}>{m.metin}</p>
            </div>
          ))}
        </Kart>

        <Kart style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <h3 style={{ fontSize: '1.05rem' }}>Paylaşılan görüşme özetleri</h3>
          {gecmis.data?.filter((g) => g.not).length ? (
            gecmis.data
              .filter((g) => g.not)
              .map((g) => (
                <div key={g.id} className="satir" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%' }}>
                    <Rozet>{tarihKisa(g.baslangic)}</Rozet>
                    <span className="hint" style={{ marginLeft: 'auto' }}>
                      {g.sureDk} dk
                    </span>
                  </div>
                  <p style={{ fontSize: '.9rem', lineHeight: 1.6 }}>{g.not}</p>
                </div>
              ))
          ) : (
            <p className="hint">Koç henüz veliyle paylaşılan bir özet yayınlamadı.</p>
          )}
        </Kart>
      </div>
    </div>
  );
}
