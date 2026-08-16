import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { BookOpen, Check, ChevronRight, FileText, RotateCcw } from 'lucide-react';
import { Akordeon } from '@/components/ui/Akordeon';
import { Alan, Bar, Buton, Nokta, Rozet, Segment } from '@/components/ui/temel';
import { konuIlerlemesi, sayi } from '@/lib/format';
import { girisEkle, konuDurumuAyarla, konuIlerlemesiArtir, mufredat, oturumlar } from '@/data/repo';
import { oturumSuz } from '@/config/site';
import { useOturum } from '@/auth/Oturum';
import type { Ders, Konu } from '@/data/tipler';

export default function Mufredat() {
  const { profil } = useOturum();
  const ogrenciId = profil?.id ?? '';
  const [oturumId, setOturumId] = useState<string>('');

  // LGS öğrencisine TYT/AYT oturumları gösteriliyordu; liste öğrencinin
  // kendi programına göre süzülüyor.
  const oturumSorgu = useQuery({
    queryKey: ['oturumlar'],
    queryFn: oturumlar,
    select: (hepsi) => oturumSuz(hepsi, profil),
  });
  const aktifOturum = oturumId || oturumSorgu.data?.[0]?.id || '';

  const dersler = useQuery({
    queryKey: ['mufredat', aktifOturum, ogrenciId],
    queryFn: () => mufredat(aktifOturum, ogrenciId, true),
    enabled: Boolean(aktifOturum),
  });

  const aktifAd = oturumSorgu.data?.find((o) => o.id === aktifOturum)?.ad ?? '';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
        <nav className="hint" style={{ display: 'flex', alignItems: 'center', gap: 6 }} aria-label="Konum">
          Panel
          <ChevronRight size={13} />
          Müfredat
          <ChevronRight size={13} />
          <span style={{ color: 'var(--color-text)', fontWeight: 600 }}>{aktifAd}</span>
        </nav>
        {oturumSorgu.data && oturumSorgu.data.length > 1 && (
          <Segment
            etiket="Sınav oturumu"
            style={{ marginLeft: 'auto' }}
            deger={aktifOturum}
            degistir={setOturumId}
            secenekler={oturumSorgu.data.map((o) => ({ deger: o.id, etiket: o.ad }))}
          />
        )}
      </div>

      <p className="hint" style={{ paddingLeft: 4 }}>
        Bir konuya tıkladığında kaynaklar, soru giriş alanı ve “tamamlandı” işareti açılıyor.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {dersler.isLoading && <div className="iskelet" />}
        {dersler.data?.map((d, i) => (
          <DersAkordeonu key={d.id} ders={d} ogrenciId={ogrenciId} varsayilanAcik={i === 0} />
        ))}
      </div>
    </div>
  );
}

function DersAkordeonu({ ders, ogrenciId, varsayilanAcik }: { ders: Ders; ogrenciId: string; varsayilanAcik: boolean }) {
  const oran = ders.toplamKonu ? ders.tamamlanan / ders.toplamKonu : 0;

  return (
    <Akordeon
      varsayilanAcik={varsayilanAcik}
      ozet={
        <>
          <Nokta renk={ders.renk} buyuk />
          <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: '1.02rem' }}>{ders.ad}</span>
          <Rozet>
            {ders.tamamlanan}/{ders.toplamKonu} konu
          </Rozet>
          <Bar oran={oran} className="hide-m" style={{ width: 120, marginLeft: 12 }} />
        </>
      }
    >
      <div style={{ borderTop: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column' }}>
        {ders.konular.length === 0 && (
          <div style={{ padding: '16px 24px' }} className="hint">
            Bu ders için konu listesi henüz eklenmedi.
          </div>
        )}
        {ders.konular.map((k) => (
          <KonuSatiri key={k.id} konu={k} ders={ders} ogrenciId={ogrenciId} />
        ))}
      </div>
    </Akordeon>
  );
}

/**
 * Konu satırı.
 *
 * Eskiden soru girişi yalnızca "bu hafta planında olan ve zaten devam eden"
 * konularda açılıyordu: başlanmamış bir konuya giriş yapılamadığı için konu
 * hiç "devam"a geçemiyor, yani kilitleniyordu. Artık her konu açılabiliyor ve
 * tamamlandı işareti elle de konulabiliyor.
 */
function KonuSatiri({ konu, ders, ogrenciId }: { konu: Konu; ders: Ders; ogrenciId: string }) {
  const qc = useQueryClient();
  const [dogru, setDogru] = useState('');
  const [yanlis, setYanlis] = useState('');
  const [bos, setBos] = useState('');
  const [islemde, setIslemde] = useState(false);

  const tamam = konu.durum === 'tamam';
  const buHafta = Boolean(konu.buHafta) && !tamam;

  const tazele = () =>
    Promise.all([
      qc.invalidateQueries({ queryKey: ['mufredat'] }),
      qc.invalidateQueries({ queryKey: ['girisler', ogrenciId] }),
      qc.invalidateQueries({ queryKey: ['haftalik-seri', ogrenciId] }),
      qc.invalidateQueries({ queryKey: ['ders-dagilimi', ogrenciId] }),
      qc.invalidateQueries({ queryKey: ['ders-ilerlemesi', ogrenciId] }),
      qc.invalidateQueries({ queryKey: ['mufredat-orani', ogrenciId] }),
      qc.invalidateQueries({ queryKey: ['giris-serisi', ogrenciId] }),
    ]);

  const kaydet = async () => {
    const d = parseInt(dogru) || 0;
    const y = parseInt(yanlis) || 0;
    const b = parseInt(bos) || 0;
    if (!d && !y && !b) return;

    setIslemde(true);
    try {
      await girisEkle(ogrenciId, { konuId: konu.id, konuAdi: konu.ad, dogru: d, yanlis: y, bos: b });
      await konuIlerlemesiArtir(ogrenciId, konu.id, d + y + b);
      setDogru('');
      setYanlis('');
      setBos('');
      await tazele();
    } finally {
      setIslemde(false);
    }
  };

  const durumuDegistir = async () => {
    setIslemde(true);
    try {
      await konuDurumuAyarla(ogrenciId, konu.id, tamam ? 'devam' : 'tamam');
      await tazele();
    } finally {
      setIslemde(false);
    }
  };

  return (
    <Akordeon
      kartMi={false}
      varsayilanAcik={buHafta}
      className="konu-akordeon"
      style={buHafta ? { background: 'var(--color-primary-soft)' } : undefined}
      ozetStyle={{ padding: '14px 24px' }}
      ozet={
        <div className="konu-satiri" style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', flex: 1 }}>
          {tamam ? (
            <Check size={16} strokeWidth={2.5} color="var(--color-success)" style={{ flex: 'none' }} />
          ) : (
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                border: '2px solid var(--color-border)',
                flex: 'none',
                ...(konu.durum === 'devam'
                  ? { background: 'var(--color-primary)', borderColor: 'var(--color-primary)' }
                  : {}),
                ...(buHafta ? { animation: 'pulseSoft 2s infinite' } : {}),
              }}
              aria-hidden="true"
            />
          )}
          <span
            className="konu-ad"
            style={{
              fontSize: '.92rem',
              fontWeight: buHafta ? 600 : undefined,
              color: tamam ? 'var(--color-text-muted)' : undefined,
              textDecoration: tamam ? 'line-through' : undefined,
            }}
          >
            {konu.ad}
          </span>
          <div className="konu-meta">
            {buHafta && <Rozet style={{ background: 'var(--color-surface)' }}>bu hafta</Rozet>}
            {/* Okul müfredatında "sınavda çıkan soru" diye bir sayı yok */}
            {konu.soruOrtalamasi > 0 && (
              <Rozet renk={buHafta ? ders.renk : undefined}>~{sayi(konu.soruOrtalamasi)} soru</Rozet>
            )}
            <span className="hint">{konuIlerlemesi(konu.cozulen, konu.hedef, konu.durum)}</span>
          </div>
        </div>
      }
    >
      <div style={{ padding: '4px 24px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        {(konu.cikmisSorularUrl || konu.kaynaklar.length > 0) && (
          <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap', fontSize: '.88rem', fontWeight: 600 }}>
            {konu.cikmisSorularUrl && (
              <a
                href={konu.cikmisSorularUrl}
                target="_blank"
                rel="noreferrer noopener"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
              >
                <FileText size={14} /> Çıkmış sorular
              </a>
            )}
            {konu.kaynaklar.map((k) => (
              <a
                key={k.url}
                href={k.url}
                target="_blank"
                rel="noreferrer noopener"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
              >
                <BookOpen size={14} /> {k.ad}
              </a>
            ))}
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Bar
            oran={konu.hedef ? Math.min(1, konu.cozulen / konu.hedef) : 0}
            style={{ flex: 1, background: 'var(--color-surface)' }}
          />
          <span className="hint" style={{ fontVariantNumeric: 'tabular-nums' }}>
            {konuIlerlemesi(konu.cozulen, konu.hedef, konu.durum)}
            {konu.cozulen >= konu.hedef && konu.hedef ? ` · hedef ${konu.hedef}` : ''}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, flexWrap: 'wrap' }}>
          <Alan etiket="Doğru" style={{ width: 76 }}>
            <input
              className="input"
              style={{ height: 38 }}
              inputMode="numeric"
              value={dogru}
              onChange={(e) => setDogru(e.target.value)}
            />
          </Alan>
          <Alan etiket="Yanlış" style={{ width: 76 }}>
            <input
              className="input"
              style={{ height: 38 }}
              inputMode="numeric"
              value={yanlis}
              onChange={(e) => setYanlis(e.target.value)}
            />
          </Alan>
          <Alan etiket="Boş" style={{ width: 76 }}>
            <input
              className="input"
              style={{ height: 38 }}
              inputMode="numeric"
              value={bos}
              onChange={(e) => setBos(e.target.value)}
            />
          </Alan>
          <Buton boy="sm" style={{ height: 38 }} onClick={kaydet} disabled={islemde}>
            Kaydet
          </Buton>
          <Buton
            tip="ghost"
            boy="sm"
            style={{ height: 38, marginLeft: 'auto' }}
            onClick={durumuDegistir}
            disabled={islemde}
          >
            {tamam ? (
              <>
                <RotateCcw size={14} /> Geri al
              </>
            ) : (
              <>
                <Check size={14} /> Konuyu tamamladım
              </>
            )}
          </Buton>
        </div>
      </div>
    </Akordeon>
  );
}
