import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Lock, Minus, Plus, RotateCcw } from 'lucide-react';
import { Buton, Kart, Rozet, Segment, Uyari } from '@/components/ui/temel';
import {
  degistir,
  hedefeDagit,
  puanDestekli,
  puandanNet,
  siralamadanNet,
  tahminiPuan,
  tahminiSiralama,
  toplamNet,
  VARSAYILAN_SIRALAMA_TABLOSU,
} from '@/lib/netDenge';
import { net as netBicim, sayi } from '@/lib/format';
import { dersListesi, oturumlar, siralamaTablosu } from '@/data/repo';
import type { HedefTipi } from '@/data/tipler';

const VARSAYILAN_HEDEF = 100000;

/**
 * Herkese açık Net Denge denemesi (landing).
 *
 * Panel sürümüyle aynı hesabı kullanır ama hiçbir şey kaydetmez: ziyaretçi
 * hedefini girer, gereken netleri görür. Dersler ve çapa tablosu gerçek veriden
 * gelir (`subjects` ve `net_siralama_tablosu` anonim okumaya açık).
 */
export function NetDengeDeneme() {
  // Sınıf düzeyi müfredatlarında "sınavda çıkan soru" kavramı yok; net
  // hesabına yalnız gerçek sınav oturumları giriyor.
  const oturumSorgu = useQuery({
    queryKey: ['oturumlar'],
    queryFn: oturumlar,
    select: (hepsi) => hepsi.filter((o) => o.tur === 'sinav'),
  });
  const [oturumId, setOturumId] = useState('');
  const aktifOturum = oturumId || oturumSorgu.data?.[0]?.id || '';
  const sinavKodu = oturumSorgu.data?.find((o) => o.id === aktifOturum)?.sinavKodu ?? 'yks';

  const dersSorgu = useQuery({
    queryKey: ['ders-listesi', aktifOturum],
    queryFn: () => dersListesi(aktifOturum),
    enabled: Boolean(aktifOturum),
  });
  const tabloSorgu = useQuery({
    queryKey: ['siralama-tablosu', sinavKodu],
    queryFn: () => siralamaTablosu(sinavKodu),
    enabled: Boolean(aktifOturum),
  });
  const capalar = tabloSorgu.data ?? VARSAYILAN_SIRALAMA_TABLOSU;

  const [tip, setTip] = useState<HedefTipi>('siralama');
  const [hedefSiralama, setHedefSiralama] = useState(VARSAYILAN_HEDEF);
  const [hedefPuan, setHedefPuan] = useState<number | null>(null);
  const [netler, setNetler] = useState<Record<string, number>>({});
  const [kilit, setKilit] = useState<Record<string, boolean>>({});

  const dersler = useMemo(() => dersSorgu.data ?? [], [dersSorgu.data]);
  const maxlar = useMemo(() => Object.fromEntries(dersler.map((d) => [d.id, d.maxNet])), [dersler]);

  const gereken = useMemo(
    () =>
      tip === 'siralama'
        ? siralamadanNet(hedefSiralama, capalar)
        : (puandanNet(hedefPuan ?? 0, capalar) ?? 0),
    [tip, hedefSiralama, hedefPuan, capalar],
  );

  // Oturum değişince kilitler sıfırlanır (dersler de değişmiştir).
  useEffect(() => {
    setKilit({});
  }, [aktifOturum]);

  /*
   * Dağılımı hedef belirler.
   *
   * Önce dağıtım yalnız `dersler` değişince yapılıyordu; hedef değiştiğinde ayrı
   * bir çağrı gerekiyordu ve oturum değişiminde çapa tablosu sonradan geldiği
   * için "gereken" ile "dağılım" birbirini tutmuyordu. Artık hedef, ders listesi
   * ve kilitler bağımlılık: tablo yerine oturunca dağılım kendiliğinden düzeliyor,
   * bir dersi sabitleyince fark diğerlerine gidiyor, kilidi açınca geri toparlıyor.
   */
  useEffect(() => {
    if (!dersler.length) return;
    setNetler((mevcut) => {
      const tamam = dersler.every((d) => d.id in mevcut);
      const temel = tamam ? mevcut : Object.fromEntries(dersler.map((d) => [d.id, 0]));
      return hedefeDagit(temel, maxlar, kilit, gereken);
    });
  }, [dersler, maxlar, gereken, kilit]);

  const toplam = toplamNet(netler);
  const tumMax = dersler.reduce((a, d) => a + d.maxNet, 0);
  const siralama = tahminiSiralama(toplam, capalar);
  const puan = tahminiPuan(toplam, capalar);
  const puanVar = puanDestekli(capalar);

  /** Dağılımı hedefe göre yeniden kur (kilitler korunur). */
  const hedefeGoreDagit = () => setNetler((mevcut) => hedefeDagit(mevcut, maxlar, kilit, gereken));

  const siralamaYaz = (v: number) => {
    const enKotu = capalar[capalar.length - 1];
    setHedefSiralama(Math.round(Math.max(1, Math.min(enKotu?.siralama ?? v, v))));
  };

  const puanYaz = (v: number) => {
    const enIyi = capalar[0];
    const enKotu = capalar[capalar.length - 1];
    setHedefPuan(Number(Math.max(enKotu?.puan ?? 0, Math.min(enIyi?.puan ?? v, v)).toFixed(1)));
  };

  const tipYaz = (yeni: HedefTipi) => {
    // Puan moduna ilk geçişte hedef boştu ve "0 puan" görünüyordu.
    if (yeni === 'puan' && hedefPuan === null) setHedefPuan(tahminiPuan(toplam, capalar) ?? 0);
    setTip(yeni);
  };

  if (dersSorgu.isLoading || !dersler.length) {
    return <div className="iskelet" style={{ minHeight: 320, borderRadius: 'var(--radius-card)' }} />;
  }

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

      {(oturumSorgu.data?.length ?? 0) > 1 && (
        <Segment
          etiket="Sınav oturumu"
          deger={aktifOturum}
          degistir={setOturumId}
          secenekler={(oturumSorgu.data ?? []).map((o) => ({ deger: o.id, etiket: o.ad }))}
        />
      )}

      {puanVar && (
        <Segment
          etiket="Hedef tipi"
          deger={tip}
          degistir={tipYaz}
          secenekler={[
            { deger: 'siralama' as HedefTipi, etiket: 'Sıralama' },
            { deger: 'puan' as HedefTipi, etiket: 'Puan' },
          ]}
        />
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {dersler.map((d) => (
          <div key={d.id} className="satir" style={{ gap: 10, flexWrap: 'wrap' }}>
            <span className="dot" style={{ background: d.renk, width: 11, height: 11 }} aria-hidden="true" />
            <span style={{ fontSize: '.9rem', fontWeight: 600, flex: '1 1 90px', minWidth: 0 }}>{d.ad}</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Buton
                tip="secondary"
                style={{ width: 32, height: 32, padding: 0, borderRadius: 9 }}
                disabled={kilit[d.id]}
                aria-label={`${d.ad} netini azalt`}
                onClick={() => setNetler((n) => degistir(n, maxlar, kilit, d.id, -1))}
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
                onClick={() => setNetler((n) => degistir(n, maxlar, kilit, d.id, 1))}
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
        <div>
          <span className="hint">Gereken toplam</span>
          <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '1.3rem' }}>{gereken} net</div>
        </div>
        <div>
          <span className="hint">Tahmini sıralama</span>
          <div
            style={{
              fontFamily: 'var(--font-heading)',
              fontWeight: 700,
              fontSize: '1.3rem',
              color: 'var(--color-primary)',
            }}
          >
            ~{sayi(siralama)}
          </div>
        </div>
        {puan !== null && (
          <div>
            <span className="hint">Tahmini puan</span>
            <div
              style={{
                fontFamily: 'var(--font-heading)',
                fontWeight: 700,
                fontSize: '1.3rem',
                color: 'var(--color-primary)',
              }}
            >
              ~{netBicim(puan)}
            </div>
          </div>
        )}
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

      {/* Kilitler yüzünden hedef tutmuyorsa sessiz kalmak yerine söyle */}
      {toplam !== gereken && (
        <Uyari tur="warning">
          {toplam > gereken
            ? `Dağılımın hedefin ${toplam - gereken} net üstünde — hedefinden iyisini planlamışsın.`
            : gereken > tumMax
              ? `Bu hedef ${gereken} net istiyor ama bu oturumda toplam ${tumMax} soru var. Hedefi biraz aşağı çekmen ya da diğer oturumları da hesaba katman gerekiyor.`
              : `Dağılımın hedefin ${gereken - toplam} net altında. Sabitlediğin dersleri açıp “Hedefe göre dağıt”a basabilirsin.`}
        </Uyari>
      )}
    </Kart>
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
