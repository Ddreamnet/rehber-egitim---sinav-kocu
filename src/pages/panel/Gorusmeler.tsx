import { useQuery } from '@tanstack/react-query';
import { Buton, Kart, Rozet, BosDurum } from '@/components/ui/temel';
import { goreliZaman, gorusmeTuru, gunAdi, saat, tarihBlogu, tarihKisa } from '@/lib/format';
import { useOturum } from '@/auth/Oturum';
import { takvimeEkle } from '@/lib/takvim';
import { gecmisGorusmeler, notlar, sonrakiGorusme } from '@/data/repo';

export default function Gorusmeler() {
  const { profil } = useOturum();
  const ogrenciId = profil?.id ?? '';

  const sonraki = useQuery({ queryKey: ['sonraki-gorusme', ogrenciId], queryFn: () => sonrakiGorusme(ogrenciId) });
  const gecmis = useQuery({ queryKey: ['gecmis-gorusmeler', ogrenciId], queryFn: () => gecmisGorusmeler(ogrenciId) });
  const notSorgu = useQuery({ queryKey: ['notlar', ogrenciId], queryFn: () => notlar(ogrenciId) });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {sonraki.data ? (
        <Kart style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
          <div className="date-block date-block-lg">
            <span className="gun">{tarihBlogu(sonraki.data.baslangic).gun}</span>
            <span className="ay">{tarihBlogu(sonraki.data.baslangic).ay}</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <h3 style={{ fontSize: '1.15rem' }}>
              Sonraki görüşme: {gunAdi(sonraki.data.baslangic)} {saat(sonraki.data.baslangic)}
            </h3>
            <p className="hint">
              {sonraki.data.kocAdi} · {sonraki.data.sureDk} dk · {gorusmeTuru(sonraki.data.tur)}
              {sonraki.data.gundem.length > 0 && ` — ${sonraki.data.gundem.join(', ')}`}
            </p>
          </div>
          <div className="eylem-satiri" style={{ display: 'flex', gap: 10, marginLeft: 'auto', flexWrap: 'wrap' }}>
            <Buton
              onClick={() => sonraki.data?.katilimUrl && window.open(sonraki.data.katilimUrl, '_blank', 'noopener')}
              disabled={!sonraki.data.katilimUrl}
              title={sonraki.data.katilimUrl ? undefined : 'Koçun henüz katılım bağlantısı eklemedi'}
            >
              Görüşmeye katıl
            </Buton>
            {/* Öğrenci görüşmeyi kendi değiştiremez (planlama koçta); takvime
                eklemek yerine ekranda duran ölü "Yeniden planla" butonu kaldırıldı. */}
            <Buton tip="ghost" onClick={() => takvimeEkle(sonraki.data!)}>
              Takvime ekle
            </Buton>
          </div>
        </Kart>
      ) : (
        <Kart>
          <BosDurum
            baslik="Planlanmış görüşme yok"
            aciklama="Koçun yeni bir görüşme oluşturduğunda burada göreceksin."
          />
        </Kart>
      )}

      {/* Koçun yazdığı notlar yalnız bir görüşmeye bağlıysa görünüyordu;
          serbest yazılan notlar öğrenciye hiç ulaşmıyordu. */}
      <Kart style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <h3 style={{ fontSize: '1.05rem' }}>Koçundan notlar</h3>
          {(notSorgu.data?.length ?? 0) > 0 && <Rozet>{notSorgu.data?.length}</Rozet>}
        </div>
        {notSorgu.data?.length ? (
          notSorgu.data.map((n) => (
            <div
              key={n.id}
              style={{
                background: 'var(--color-bg)',
                borderRadius: 12,
                padding: '12px 16px',
                display: 'flex',
                flexDirection: 'column',
                gap: 6,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <Rozet>{tarihKisa(n.tarih)}</Rozet>
                <span className="hint" style={{ fontSize: '.75rem' }}>
                  {n.kocAdi}
                </span>
                <span className="hint" style={{ marginLeft: 'auto', fontSize: '.72rem' }}>
                  {goreliZaman(n.tarih)}
                </span>
              </div>
              <p style={{ fontSize: '.92rem', lineHeight: 1.6 }}>{n.metin}</p>
            </div>
          ))
        ) : (
          <p className="hint">Koçun henüz not yazmadı.</p>
        )}
      </Kart>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <h3 style={{ fontSize: '1.02rem', paddingLeft: 4 }}>Geçmiş görüşmeler</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: 20 }}>
          {gecmis.data?.length ? (
            gecmis.data.map((g) => (
              <Kart key={g.id} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Rozet>{tarihKisa(g.baslangic)}</Rozet>
                  <span className="hint" style={{ marginLeft: 'auto' }}>
                    {g.sureDk} dk
                  </span>
                </div>
                {g.not ? (
                  <p style={{ fontSize: '.92rem', lineHeight: 1.6 }}>
                    <strong>Koç notu:</strong> {g.not}
                  </p>
                ) : (
                  <p className="hint">Bu görüşme için not paylaşılmadı.</p>
                )}
                {g.etiketler && g.etiketler.length > 0 && (
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 'auto' }}>
                    {g.etiketler.map((e) => (
                      <Rozet key={e}>{e}</Rozet>
                    ))}
                  </div>
                )}
              </Kart>
            ))
          ) : (
            <Kart>
              <BosDurum baslik="Henüz görüşme yapılmadı" />
            </Kart>
          )}
        </div>
      </div>
    </div>
  );
}
