import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Lock, Minus, Plus, RotateCcw } from 'lucide-react';
import { Buton, Kart, Rozet, Segment, Uyari } from '@/components/ui/temel';
import {
  degistir,
  hedefePuanDagit,
  netlerdenPuan,
  puandanSiralama,
  siralamaAraligi,
  siralamadanPuan,
  ulasilabilirEnYuksekPuan,
  yerlestirmePuani,
  type DersNeti,
  type PuanModeli,
} from '@/lib/netDenge';
import { net as netBicim, sayi } from '@/lib/format';
import { puanModeli, puanTuruDersleri } from '@/data/repo';
import type { HedefTipi } from '@/data/tipler';

const VARSAYILAN_HEDEF = 100000;

/** Ziyaretçinin seçebileceği puan türleri. */
const PUAN_TURLERI = [
  { deger: 'say', etiket: 'Sayısal' },
  { deger: 'ea', etiket: 'Eşit Ağırlık' },
  { deger: 'soz', etiket: 'Sözel' },
  { deger: 'dil', etiket: 'Dil' },
  { deger: 'lgs', etiket: 'LGS' },
];

/**
 * Herkese açık Net Denge denemesi (landing).
 *
 * Panel sürümüyle aynı hesabı kullanır ama hiçbir şey kaydetmez. Sayılar gerçek
 * sınav verisinden gelir: net → puan ilgili yılın katsayılarıyla, puan → sıralama
 * ÖSYM/MEB'in yayımladığı yığınsal dağılımdan.
 */
export function NetDengeDeneme() {
  const [puanTuru, setPuanTuru] = useState('say');

  const modelSorgu = useQuery({
    queryKey: ['puan-modeli', puanTuru],
    queryFn: () => puanModeli(puanTuru),
  });
  const dersSorgu = useQuery({
    queryKey: ['puan-turu-dersleri', puanTuru],
    queryFn: () => puanTuruDersleri(puanTuru),
  });

  const [tip, setTip] = useState<HedefTipi>('siralama');
  const [hedefSiralama, setHedefSiralama] = useState(VARSAYILAN_HEDEF);
  const [hedefPuan, setHedefPuan] = useState<number | null>(null);
  const [netler, setNetler] = useState<Record<string, number>>({});
  const [kilit, setKilit] = useState<Record<string, boolean>>({});
  const [diplomaNotu, setDiplomaNotu] = useState<number | null>(null);

  const model = modelSorgu.data ?? null;
  const dersSatirlari = useMemo(() => dersSorgu.data ?? [], [dersSorgu.data]);

  const dersler: DersNeti[] = useMemo(
    () =>
      dersSatirlari.map((d) => ({
        dersId: d.id,
        oturumKod: d.oturumKod,
        dersAd: d.ad,
        net: netler[d.id] ?? 0,
        maxNet: d.maxNet,
      })),
    [dersSatirlari, netler],
  );

  const obp = diplomaNotu === null ? null : diplomaNotu * 5;
  // OBP girildiyse yerleştirme puanı dağılımı, girilmediyse sınav puanı dağılımı.
  const dagilim = useMemo(() => {
    if (!model) return [];
    const yerlestirme = obp !== null && model.obpKatsayi > 0 && model.yerlestirmeDagilimi.length;
    return yerlestirme ? model.yerlestirmeDagilimi : model.sinavDagilimi;
  }, [model, obp]);

  /** Hedefin gerektirdiği SINAV puanı (OBP katkısı düşülmüş). */
  const gerekenSinavPuani = useMemo(() => {
    if (!model) return null;
    const hedefTamPuan =
      tip === 'siralama' ? siralamadanPuan(hedefSiralama, dagilim) : (hedefPuan ?? null);
    if (hedefTamPuan === null) return null;
    const katki = obp === null ? 0 : obp * model.obpKatsayi;
    return Number((hedefTamPuan - katki).toFixed(1));
  }, [model, tip, hedefSiralama, hedefPuan, dagilim, obp]);

  // Puan türü değişince dersler ve kilitler baştan kurulur.
  useEffect(() => {
    setKilit({});
    setNetler({});
  }, [puanTuru]);

  /* Dağılımı hedef belirler; hedef, ders listesi ya da kilit değişince yenilenir. */
  useEffect(() => {
    if (!model || !dersSatirlari.length || gerekenSinavPuani === null) return;
    setNetler((mevcut) => {
      const tamam = dersSatirlari.every((d) => d.id in mevcut);
      const temel: DersNeti[] = dersSatirlari.map((d) => ({
        dersId: d.id,
        oturumKod: d.oturumKod,
        dersAd: d.ad,
        net: tamam ? (mevcut[d.id] ?? 0) : 0,
        maxNet: d.maxNet,
      }));
      return hedefePuanDagit(model, temel, kilit, gerekenSinavPuani);
    });
    // `netler` bilerek bağımlılık değil: kendi yazdığı değeri tekrar tetiklemesin.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [model, dersSatirlari, gerekenSinavPuani, kilit]);

  if (modelSorgu.isLoading || dersSorgu.isLoading || !model || !dersSatirlari.length) {
    return <div className="iskelet" style={{ minHeight: 320, borderRadius: 'var(--radius-card)' }} />;
  }

  const sinavPuani = netlerdenPuan(model, dersler);
  const tamPuan = obp === null ? sinavPuani : yerlestirmePuani(model, sinavPuani, obp);
  const siralama = puandanSiralama(tamPuan, dagilim);
  const enYuksek = ulasilabilirEnYuksekPuan(model, dersler);
  const aralik = siralamaAraligi(dagilim);
  const obpVar = model.obpKatsayi > 0;

  const hedefeGoreDagit = () => {
    if (gerekenSinavPuani === null) return;
    setNetler(hedefePuanDagit(model, dersler, kilit, gerekenSinavPuani));
  };

  const siralamaYaz = (v: number) =>
    setHedefSiralama(Math.round(Math.max(aralik?.enIyi ?? 1, Math.min(aralik?.enKotu ?? v, v))));

  const puanYaz = (v: number) =>
    setHedefPuan(Number(Math.max(model.tabanPuan, Math.min(model.tavanPuan + 60, v)).toFixed(1)));

  const tipYaz = (yeni: HedefTipi) => {
    if (yeni === 'puan' && hedefPuan === null) setHedefPuan(tamPuan);
    setTip(yeni);
  };

  const netDegistir = (dersId: string, delta: number) =>
    setNetler(degistir(model, dersler, kilit, dersId, delta));

  // Hedefin gerektirdiği puan bu derslerle ulaşılabilir mi?
  const ulasilmaz = gerekenSinavPuani !== null && gerekenSinavPuani > enYuksek + 0.5;
  const fark = gerekenSinavPuani === null ? 0 : Number((sinavPuani - gerekenSinavPuani).toFixed(1));

  return (
    <Kart style={{ boxShadow: 'var(--shadow-lift)', display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <HedefGirdisi
          tip={tip}
          siralama={hedefSiralama}
          puan={hedefPuan ?? 0}
          siralamaYaz={siralamaYaz}
          puanYaz={puanYaz}
        />
        <Rozet ton="warning" style={{ marginLeft: 'auto' }}>
          tahmini
        </Rozet>
      </div>

      <Segment
        etiket="Puan türü"
        deger={puanTuru}
        degistir={setPuanTuru}
        secenekler={PUAN_TURLERI}
      />

      <Segment
        etiket="Hedef tipi"
        deger={tip}
        degistir={tipYaz}
        secenekler={[
          { deger: 'siralama' as HedefTipi, etiket: 'Sıralama' },
          { deger: 'puan' as HedefTipi, etiket: 'Puan' },
        ]}
      />

      {obpVar && <DiplomaNotu deger={diplomaNotu} degistir={setDiplomaNotu} />}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {dersSatirlari.map((d, i) => (
          <div key={d.id}>
            {/* Oturum değiştiğinde ince bir başlık — TYT ile AYT karışmasın */}
            {(i === 0 || dersSatirlari[i - 1].oturumKod !== d.oturumKod) && (
              <div className="hint" style={{ fontWeight: 600, margin: '6px 0 2px' }}>
                {d.oturumAd}
              </div>
            )}
            <div className="satir" style={{ gap: 10, flexWrap: 'wrap' }}>
              <span className="dot" style={{ background: d.renk, width: 11, height: 11 }} aria-hidden="true" />
              <span style={{ fontSize: '.9rem', fontWeight: 600, flex: '1 1 90px', minWidth: 0 }}>{d.ad}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Buton
                  tip="secondary"
                  style={{ width: 32, height: 32, padding: 0, borderRadius: 9 }}
                  disabled={kilit[d.id]}
                  aria-label={`${d.ad} netini azalt`}
                  onClick={() => netDegistir(d.id, -1)}
                >
                  <Minus size={13} strokeWidth={2.5} />
                </Buton>
                <strong
                  style={{
                    fontFamily: 'var(--font-heading)',
                    minWidth: 30,
                    textAlign: 'center',
                    fontVariantNumeric: 'tabular-nums',
                  }}
                  aria-live="polite"
                >
                  {netler[d.id] ?? 0}
                </strong>
                <Buton
                  tip="secondary"
                  style={{ width: 32, height: 32, padding: 0, borderRadius: 9 }}
                  disabled={kilit[d.id]}
                  aria-label={`${d.ad} netini artır`}
                  onClick={() => netDegistir(d.id, 1)}
                >
                  <Plus size={13} strokeWidth={2.5} />
                </Buton>
                <span className="hint">/ {d.maxNet}</span>
              </div>
              <label className="badge kilit-etiketi" style={{ cursor: 'pointer', gap: 6, marginLeft: 'auto' }}>
                <input
                  type="checkbox"
                  checked={Boolean(kilit[d.id])}
                  onChange={() => setKilit((k) => ({ ...k, [d.id]: !k[d.id] }))}
                />
                <Lock size={12} />
                sabitle
              </label>
            </div>
          </div>
        ))}
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          borderTop: '1.5px dashed var(--color-border)',
          paddingTop: 14,
          flexWrap: 'wrap',
        }}
      >
        <Sonuc
          etiket={obp === null ? 'Sınav puanı' : 'Yerleştirme puanı'}
          deger={`~${netBicim(tamPuan)}`}
        />
        {siralama !== null && <Sonuc etiket="Tahmini sıralama" deger={`~${sayi(siralama)}`} vurgu />}
        <Buton
          tip="ghost"
          boy="sm"
          style={{ marginLeft: 'auto' }}
          onClick={hedefeGoreDagit}
          aria-label="Dağılımı hedefe göre yeniden kur"
        >
          <RotateCcw size={14} /> Hedefe göre dağıt
        </Buton>
      </div>

      {ulasilmaz ? (
        <Uyari tur="warning">
          Bu hedef {netBicim(gerekenSinavPuani!)} sınav puanı istiyor; bu derslerin tamamı tam çekildiğinde
          ulaşılabilecek en yüksek puan {netBicim(enYuksek)}.
          {obpVar && obp === null ? ' Diploma notunu girersen yerleştirme puanın da hesaba katılır.' : ''}
        </Uyari>
      ) : (
        Math.abs(fark) >= 1 && (
          <Uyari tur={fark > 0 ? 'success' : 'warning'}>
            {fark > 0
              ? `Dağılımın hedefinin ${netBicim(fark)} puan üstünde.`
              : `Dağılımın hedefinin ${netBicim(-fark)} puan altında. Sabitlediğin dersleri açıp “Hedefe göre dağıt”a basabilirsin.`}
          </Uyari>
        )
      )}

      <VeriNotu model={model} />
    </Kart>
  );
}

function Sonuc({ etiket, deger, vurgu }: { etiket: string; deger: string; vurgu?: boolean }) {
  return (
    <div>
      <span className="hint">{etiket}</span>
      <div
        style={{
          fontFamily: 'var(--font-heading)',
          fontWeight: 700,
          fontSize: '1.3rem',
          color: vurgu ? 'var(--color-primary)' : undefined,
        }}
      >
        {deger}
      </div>
    </div>
  );
}

/**
 * Verinin kaynağı — hesabın nereden geldiği ekranda yazsın.
 * "Tahmini" demek yetmiyor; hangi yılın hangi verisi olduğu görünmeli.
 */
export function VeriNotu({ model }: { model: PuanModeli }) {
  const govde = `${model.yil} ${model.sinavKod === 'lgs' ? 'LGS' : 'YKS'} verisi · ${model.kaynak}`;
  return (
    <p className="hint" style={{ lineHeight: 1.5 }}>
      {model.guven === 'turetilmis' && (
        <strong>Not: bu puan türünde resmî dağılım tablosu sınırlı. </strong>
      )}
      {model.kaynakUrl ? (
        <a href={model.kaynakUrl} target="_blank" rel="noopener noreferrer">
          {govde}
        </a>
      ) : (
        govde
      )}
      . Sıralama, sınavın gerçekleştiği yılın koşullarına göre hesaplanır; gelecek yılın barajı farklı olabilir.
    </p>
  );
}

/** Diploma notu → OBP. Yerleştirme puanına katkısı OBP × 0,12. */
export function DiplomaNotu({
  deger,
  degistir,
}: {
  deger: number | null;
  degistir: (v: number | null) => void;
}) {
  return (
    <label className="field" style={{ gap: 4 }}>
      <span style={{ fontSize: '.85rem', fontWeight: 600 }}>Diploma notu (isteğe bağlı)</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <input
          className="input"
          type="number"
          min={0}
          max={100}
          step={0.01}
          style={{ width: 120, height: 38 }}
          value={deger ?? ''}
          placeholder="85"
          onChange={(e) => {
            const ham = e.target.value.trim();
            if (!ham) return degistir(null);
            const v = Number(ham);
            degistir(Number.isFinite(v) ? Math.max(0, Math.min(100, v)) : null);
          }}
        />
        <span className="hint">
          {deger === null
            ? 'Girersen yerleştirme puanın da hesaplanır (OBP = not × 5).'
            : `OBP ${sayi(deger * 5)} · yerleştirme puanına +${netBicim(deger * 5 * 0.12)}`}
        </span>
      </div>
    </label>
  );
}

/** Hedef değeri — tıklanınca satır içi düzenlemeye döner. */
function HedefGirdisi({
  tip,
  siralama,
  puan,
  siralamaYaz,
  puanYaz,
}: {
  tip: HedefTipi;
  siralama: number;
  puan: number;
  siralamaYaz: (v: number) => void;
  puanYaz: (v: number) => void;
}) {
  const [duzenle, setDuzenle] = useState(false);
  const puanMi = tip === 'puan';
  const deger = puanMi ? puan : siralama;

  if (duzenle) {
    return (
      <input
        className="input"
        type="number"
        autoFocus
        style={{ width: 160, height: 36 }}
        defaultValue={deger}
        aria-label={puanMi ? 'Hedef puan' : 'Hedef sıralama'}
        onBlur={(e) => {
          const v = Number(e.target.value.trim());
          if (Number.isFinite(v)) (puanMi ? puanYaz : siralamaYaz)(v);
          setDuzenle(false);
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
          if (e.key === 'Escape') setDuzenle(false);
        }}
      />
    );
  }

  return (
    <button
      type="button"
      className="chip chip-hedef"
      style={{ fontSize: '.95rem', border: 'none', cursor: 'pointer' }}
      onClick={() => setDuzenle(true)}
      title="Hedefini değiştir"
    >
      {puanMi ? `Hedef: ${sayi(puan)} puan` : `Hedef: ilk ${sayi(siralama)}`}
    </button>
  );
}
