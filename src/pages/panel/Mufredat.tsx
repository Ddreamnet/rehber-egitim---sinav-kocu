import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { BookOpen, Check, ChevronRight, FileText } from 'lucide-react';
import { Akordeon } from '@/components/ui/Akordeon';
import { Alan, Bar, Buton, Nokta, Rozet, Segment } from '@/components/ui/temel';
import { sayi } from '@/lib/format';
import { girisEkle, konuIlerlemesiArtir, mufredat, oturumlar } from '@/data/repo';
import { useOturum } from '@/auth/Oturum';
import type { Ders, Konu } from '@/data/tipler';

export default function Mufredat() {
  const { profil } = useOturum();
  const ogrenciId = profil?.id ?? '';
  const [oturumId, setOturumId] = useState<string>('');

  const oturumSorgu = useQuery({ queryKey: ['oturumlar'], queryFn: oturumlar });
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
        {ders.konular.map((k, i) =>
          k.durum === 'devam' && k.buHafta ? (
            <AktifKonu key={k.id} konu={k} ders={ders} ogrenciId={ogrenciId} />
          ) : (
            <KonuSatiri key={k.id} konu={k} sonMu={i === ders.konular.length - 1} />
          ),
        )}
      </div>
    </Akordeon>
  );
}

function KonuSatiri({ konu, sonMu }: { konu: Konu; sonMu: boolean }) {
  const tamam = konu.durum === 'tamam';
  return (
    <div
      className="konu-satiri"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '14px 24px',
        borderBottom: sonMu ? undefined : '1px solid var(--color-border)',
        flexWrap: 'wrap',
      }}
    >
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
          }}
          aria-hidden="true"
        />
      )}
      <span
        className="konu-ad"
        style={{
          fontSize: '.92rem',
          color: tamam ? 'var(--color-text-muted)' : undefined,
          textDecoration: tamam ? 'line-through' : undefined,
        }}
      >
        {konu.ad}
      </span>
      <div className="konu-meta">
        <Rozet>~{sayi(konu.soruOrtalamasi)} soru</Rozet>
        <span className="hint">
          {konu.durum === 'baslanmadi' ? 'başlanmadı' : `${konu.cozulen}/${konu.hedef} soru`}
        </span>
      </div>
    </div>
  );
}

/** Bu haftanın konusu — açık akordeon, kaynaklar ve hızlı D/Y/B girişi. */
function AktifKonu({ konu, ders, ogrenciId }: { konu: Konu; ders: Ders; ogrenciId: string }) {
  const qc = useQueryClient();
  const [dogru, setDogru] = useState('');
  const [yanlis, setYanlis] = useState('');
  const [bos, setBos] = useState('');
  const [kaydediliyor, setKaydediliyor] = useState(false);

  const kaydet = async () => {
    const d = parseInt(dogru) || 0;
    const y = parseInt(yanlis) || 0;
    const b = parseInt(bos) || 0;
    if (!d && !y && !b) return;

    setKaydediliyor(true);
    try {
      await girisEkle(ogrenciId, { konuId: konu.id, konuAdi: konu.ad, dogru: d, yanlis: y, bos: b });
      await konuIlerlemesiArtir(ogrenciId, konu.id, d + y + b);
      setDogru('');
      setYanlis('');
      setBos('');
      await qc.invalidateQueries();
    } finally {
      setKaydediliyor(false);
    }
  };

  return (
    <Akordeon
      kartMi={false}
      varsayilanAcik
      style={{ background: 'var(--color-primary-soft)' }}
      ozetStyle={{ padding: '14px 24px' }}
      ozet={
        <>
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: 'var(--color-primary)',
              flex: 'none',
              animation: 'pulseSoft 2s infinite',
            }}
            aria-hidden="true"
          />
          <span style={{ fontSize: '.92rem', fontWeight: 600 }}>{konu.ad}</span>
          <Rozet renk={ders.renk}>~{sayi(konu.soruOrtalamasi)} soru</Rozet>
          <Rozet style={{ background: 'var(--color-surface)' }}>bu hafta</Rozet>
        </>
      }
    >
      <div style={{ padding: '4px 24px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
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

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Bar oran={konu.hedef ? konu.cozulen / konu.hedef : 0} style={{ flex: 1, background: 'var(--color-surface)' }} />
          <span className="hint" style={{ fontVariantNumeric: 'tabular-nums' }}>
            {konu.cozulen}/{konu.hedef} soru
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
          <Buton boy="sm" style={{ height: 38 }} onClick={kaydet} disabled={kaydediliyor}>
            Kaydet
          </Buton>
        </div>
      </div>
    </Akordeon>
  );
}
