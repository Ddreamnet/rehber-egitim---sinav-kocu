import { useEffect, useMemo, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Info, Lock, Minus, Plus } from 'lucide-react';
import { Bar, Buton, Kart, Rozet, Segment, Uyari, BosDurum } from '@/components/ui/temel';
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
import { useOturum } from '@/auth/Oturum';
import { netHedefi, netHedefiKaydet, netHedefiOlustur, oturumlar, siralamaTablosu } from '@/data/repo';
import { oturumSuz } from '@/config/site';
import type { SiralamaTablosu } from '@/lib/netDenge';
import type { HedefTipi, NetHedefi } from '@/data/tipler';

export default function NetDenge() {
  const { profil } = useOturum();
  const ogrenciId = profil?.id ?? '';

  // Hedef yalnız varsayılan oturumda (YKS'de TYT) kurulabiliyordu; Eşit Ağırlık
  // ya da Sözel öğrencisi kendi AYT'si için hedef koyamıyordu.
  const oturumSorgu = useQuery({
    queryKey: ['oturumlar'],
    queryFn: oturumlar,
    select: (hepsi) => oturumSuz(hepsi, profil),
  });
  const [secilenOturum, setSecilenOturum] = useState('');
  const oturumId = secilenOturum || oturumSorgu.data?.[0]?.id || '';

  const sorgu = useQuery({
    queryKey: ['net-hedefi', ogrenciId, oturumId],
    queryFn: () => netHedefi(ogrenciId, oturumId),
    enabled: Boolean(oturumId),
  });
  // Çapa tablosu sınava göre değişir; sabit 'yks' okunuyordu.
  const sinavKodu = sorgu.data?.sinavKodu ?? 'yks';
  const tablo = useQuery({
    queryKey: ['siralama-tablosu', sinavKodu],
    queryFn: () => siralamaTablosu(sinavKodu),
    enabled: Boolean(sorgu.data),
  });
  const capalar = tablo.data ?? VARSAYILAN_SIRALAMA_TABLOSU;

  const [hedef, setHedef] = useState<NetHedefi | null>(null);
  const [olusturuluyor, setOlusturuluyor] = useState(false);
  const [hata, setHata] = useState<string | null>(null);
  const ilkYukleme = useRef(true);

  const olustur = async () => {
    setOlusturuluyor(true);
    setHata(null);
    try {
      const yeni = await netHedefiOlustur(ogrenciId, oturumId);
      if (!yeni) {
        setHata('Bu sınav oturumu için ders listesi tanımlı değil. Koçunla iletişime geçebilirsin.');
        return;
      }
      ilkYukleme.current = true; // yeni hedef anında geri yazılmasın
      setHedef(structuredClone(yeni));
      await sorgu.refetch();
    } catch (h) {
      setHata(h instanceof Error ? h.message : 'Hedef oluşturulamadı.');
    } finally {
      setOlusturuluyor(false);
    }
  };

  useEffect(() => {
    // Oturum değişince eski oturumun hedefi ekranda kalıyordu.
    if (hedef && hedef.oturumId !== oturumId) {
      setHedef(null);
      ilkYukleme.current = true;
      return;
    }
    if (sorgu.data && !hedef) setHedef(structuredClone(sorgu.data));
  }, [sorgu.data, hedef, oturumId]);

  // Değişiklikleri geciktirerek kaydet
  useEffect(() => {
    if (!hedef) return;
    if (ilkYukleme.current) {
      ilkYukleme.current = false;
      return;
    }
    const t = setTimeout(() => {
      // Yazma hatası sessizce yutuluyordu; kullanıcı kaydedildi sanıyordu.
      netHedefiKaydet(hedef).catch((h) =>
        setHata(h instanceof Error ? h.message : 'Hedef kaydedilemedi.'),
      );
    }, 600);
    return () => clearTimeout(t);
  }, [hedef]);

  const maxlar = useMemo(
    () => Object.fromEntries((hedef?.dagilim ?? []).map((d) => [d.dersId, d.maxNet])),
    [hedef],
  );
  const netler = useMemo(
    () => Object.fromEntries((hedef?.dagilim ?? []).map((d) => [d.dersId, d.net])),
    [hedef],
  );
  const kilit = useMemo(
    () => Object.fromEntries((hedef?.dagilim ?? []).map((d) => [d.dersId, d.kilitli])),
    [hedef],
  );

  const oturumlarim = oturumSorgu.data ?? [];
  const oturumAdi = oturumlarim.find((o) => o.id === oturumId)?.ad ?? '';

  /** Birden fazla oturuma giren öğrenci için oturum sekmeleri. */
  const oturumSecici =
    oturumlarim.length > 1 ? (
      <Segment
        etiket="Sınav oturumu"
        deger={oturumId}
        degistir={setSecilenOturum}
        secenekler={oturumlarim.map((o) => ({ deger: o.id, etiket: o.ad }))}
      />
    ) : null;

  // Hedef kaydı olmayan öğrencide ekran sonsuz iskelet gösteriyordu.
  // Oturum değiştirirken seçici kaybolmasın diye iskeletin üstünde duruyor.
  if (sorgu.isLoading || !oturumId) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {oturumSecici}
        <div className="iskelet" style={{ minHeight: 320 }} />
      </div>
    );
  }

  if (!hedef) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {oturumSecici}
        <Kart style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <BosDurum
            baslik={`${oturumAdi} için Net Denge hedefin henüz kurulmadı`}
            aciklama="Hedef puanını ya da sıralamanı seçtiğinde, ders başına kaç net gerektiğini sistem hesaplar. Başlangıç dağılımını şimdi oluşturup üzerinde oynayabilirsin."
          >
            <Buton onClick={olustur} disabled={olusturuluyor}>
              {olusturuluyor ? 'Hazırlanıyor…' : 'Hedefi oluştur'}
            </Buton>
          </BosDurum>
          {hata && <Uyari tur="error">{hata}</Uyari>}
        </Kart>
      </div>
    );
  }

  const toplam = toplamNet(netler);
  const tumMax = Object.values(maxlar).reduce((a: number, b: number) => a + b, 0);
  const siralama = tahminiSiralama(toplam, capalar);
  const puan = tahminiPuan(toplam, capalar);
  const puanVar = puanDestekli(capalar);

  /**
   * Hedefin gerektirdiği toplam net.
   *
   * Asıl düzeltme burası: hedef yalnızca etiket olarak duruyordu, hiçbir hesabı
   * beslemiyordu. Artık hedef → gereken toplam → derslere dağılım zinciri var.
   */
  const gerekenToplam =
    hedef.tip === 'siralama'
      ? siralamadanNet(hedef.hedefSiralama ?? 0, capalar)
      : (puandanNet(hedef.hedefPuan ?? 0, capalar) ?? toplam);

  const dagilimUygula = (yeniNetler: Record<string, number>, ustDeger?: Partial<NetHedefi>) =>
    setHedef({
      ...hedef,
      ...ustDeger,
      dagilim: hedef.dagilim.map((d) => ({ ...d, net: yeniNetler[d.dersId] ?? d.net })),
    });

  const netDegistir = (dersId: string, delta: number) =>
    dagilimUygula(degistir(netler, maxlar, kilit, dersId, delta));

  const kilitDegistir = (dersId: string) => {
    setHedef({
      ...hedef,
      dagilim: hedef.dagilim.map((d) => (d.dersId === dersId ? { ...d, kilitli: !d.kilitli } : d)),
    });
  };

  /** Hedef değişince dağılımı yeni gereken toplama göre yeniden kur. */
  const hedefiDegistir = (girdi: NetHedefi) => {
    // Çapa tablosunun dışına çıkan değerler hem anlamsız hem de `hedef_puan`
    // numeric(5,1) olduğu için yazmada taşma hatası veriyordu.
    const yeni = { ...girdi, ...hedefiKis(girdi, capalar) };
    const yeniGereken =
      yeni.tip === 'siralama'
        ? siralamadanNet(yeni.hedefSiralama ?? 0, capalar)
        : puandanNet(yeni.hedefPuan ?? 0, capalar);
    if (yeniGereken === null) {
      setHedef(yeni);
      return;
    }
    const dagitilmis = hedefeDagit(netler, maxlar, kilit, yeniGereken);
    setHedef({
      ...yeni,
      dagilim: yeni.dagilim.map((d) => ({ ...d, net: dagitilmis[d.dersId] ?? d.net })),
    });
  };

  const tipDegistir = (tip: HedefTipi) => {
    // Puan moduna ilk geçişte hedef puan boş oluyordu ve ekran "0 puan" gösteriyordu.
    if (tip === 'puan' && hedef.hedefPuan === null) {
      hedefiDegistir({ ...hedef, tip, hedefPuan: tahminiPuan(toplam, capalar) ?? 0 });
      return;
    }
    if (tip === 'siralama' && hedef.hedefSiralama === null) {
      hedefiDegistir({ ...hedef, tip, hedefSiralama: tahminiSiralama(toplam, capalar) });
      return;
    }
    hedefiDegistir({ ...hedef, tip });
  };

  /** Dağılımı hedefe göre baştan kur (kilitler korunur). */
  const hedefeGoreDagit = () => dagilimUygula(hedefeDagit(netler, maxlar, kilit, gerekenToplam));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {oturumSecici}
      <Kart style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
          <div>
            <h3 style={{ fontSize: '1.05rem' }}>{oturumAdi} hedefin</h3>
            <p className="hint" style={{ marginTop: 4 }}>
              Hedefini seçtiğinde ders başına gereken netleri sistem dağıtıyor. Her oturum için ayrı hedef
              kurabilirsin.
            </p>
          </div>
          <Segment
            etiket="Hedef tipi"
            style={{ marginLeft: 'auto' }}
            deger={hedef.tip}
            degistir={tipDegistir}
            secenekler={
              puanVar
                ? [
                    { deger: 'puan' as HedefTipi, etiket: 'Hedef puan' },
                    { deger: 'siralama' as HedefTipi, etiket: 'Hedef sıralama' },
                  ]
                : [{ deger: 'siralama' as HedefTipi, etiket: 'Hedef sıralama' }]
            }
          />
          <HedefChipi hedef={hedef} degistir={hedefiDegistir} capalar={capalar} />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {hedef.dagilim.map((d) => (
            <div
              key={d.dersId}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                background: 'var(--color-bg)',
                borderRadius: 14,
                padding: '12px 16px',
                flexWrap: 'wrap',
              }}
            >
              <span className="dot" style={{ background: d.renk, width: 11, height: 11 }} aria-hidden="true" />
              <span style={{ fontWeight: 600, fontSize: '.92rem', width: 92 }}>{d.ad}</span>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Buton
                  tip="secondary"
                  style={{ width: 34, height: 34, padding: 0, borderRadius: 10 }}
                  disabled={d.kilitli}
                  onClick={() => netDegistir(d.dersId, -1)}
                  aria-label={`${d.ad} netini azalt`}
                >
                  <Minus size={14} strokeWidth={2.5} />
                </Buton>
                <span
                  style={{
                    fontFamily: 'var(--font-heading)',
                    fontWeight: 700,
                    fontSize: '1.15rem',
                    minWidth: 36,
                    textAlign: 'center',
                    fontVariantNumeric: 'tabular-nums',
                  }}
                  aria-live="polite"
                >
                  {d.net}
                </span>
                <Buton
                  tip="secondary"
                  style={{ width: 34, height: 34, padding: 0, borderRadius: 10 }}
                  disabled={d.kilitli}
                  onClick={() => netDegistir(d.dersId, 1)}
                  aria-label={`${d.ad} netini artır`}
                >
                  <Plus size={14} strokeWidth={2.5} />
                </Buton>
                <span className="hint">/ {d.maxNet}</span>
              </div>

              <Bar oran={d.maxNet ? d.net / d.maxNet : 0} renk={d.renk} className="hide-m" style={{ flex: 1, minWidth: 80 }} />

              <label className="badge kilit-etiketi" style={{ cursor: 'pointer', gap: 6, marginLeft: 'auto' }}>
                <input
                  type="checkbox"
                  checked={d.kilitli}
                  onChange={() => kilitDegistir(d.dersId)}
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
            gap: 20,
            borderTop: '1.5px dashed var(--color-border)',
            paddingTop: 18,
            flexWrap: 'wrap',
          }}
        >
          <OzetDeger etiket="Hedefin için gereken" deger={`${gerekenToplam} net`} />
          <OzetDeger
            etiket="Şu anki dağılımın"
            deger={`${toplam} net`}
            renk={toplam === gerekenToplam ? undefined : 'var(--color-urgent-deep)'}
          />
          <OzetDeger etiket="Tahmini sıralama" deger={`~${sayi(siralama)}`} renk="var(--color-primary)" />
          {puan !== null && <OzetDeger etiket="Tahmini puan" deger={`~${netBicim(puan)}`} renk="var(--color-primary)" />}
          <Rozet ton="warning">tahmini — garanti değil</Rozet>
          <Buton tip="outline" boy="sm" style={{ marginLeft: 'auto' }} onClick={hedefeGoreDagit}>
            Hedefe göre dağıt
          </Buton>
        </div>
      </Kart>

      {toplam !== gerekenToplam && (
        <Uyari tur="warning">
          {toplam > gerekenToplam
            ? `Dağılımın hedefin ${toplam - gerekenToplam} net üstünde — hedefinden daha iyisini planlamışsın.`
            : gerekenToplam > tumMax
              ? `Bu hedef için ${gerekenToplam} net gerekiyor ama bu oturumdaki toplam soru sayısı ${tumMax}. Hedefi biraz aşağı çekmen ya da diğer oturumları da hesaba katman gerekiyor.`
              : `Dağılımın hedefin ${gerekenToplam - toplam} net altında. Sabitlediğin dersleri açarsan fark oralara dağıtılır.`}
        </Uyari>
      )}

      <Uyari tur="info" ikon={<Info size={18} style={{ flex: 'none' }} />} style={{ alignItems: 'center' }}>
        Hedefini değiştirdiğinde gereken toplam net yeniden hesaplanıp derslere dağıtılıyor. Bir dersi azalttığında
        fark kilitsiz derslere gidiyor, toplam sabit kalıyor. Sıralama ve puan karşılıkları geçen yılın yerleştirme
        verisine göre <strong>tahmindir</strong>.
      </Uyari>
    </div>
  );
}

/**
 * Hedefi çapa tablosunun anlamlı aralığına çeker.
 * Aralık dışı puan `hedef_puan numeric(5,1)` sınırını aşıp yazmayı düşürüyordu.
 */
function hedefiKis(hedef: NetHedefi, capalar: SiralamaTablosu): Partial<NetHedefi> {
  const enIyi = capalar[0];
  const enKotu = capalar[capalar.length - 1];
  if (hedef.tip === 'siralama') {
    const v = hedef.hedefSiralama ?? 0;
    return { hedefSiralama: Math.round(Math.max(1, Math.min(enKotu?.siralama ?? v, v))) };
  }
  const v = hedef.hedefPuan ?? 0;
  const alt = enKotu?.puan ?? 0;
  const ust = enIyi?.puan ?? v;
  return { hedefPuan: Number(Math.max(alt, Math.min(ust, v)).toFixed(1)) };
}

function OzetDeger({ etiket, deger, renk }: { etiket: string; deger: string; renk?: string }) {
  return (
    <div>
      <div className="hint">{etiket}</div>
      <div
        style={{
          fontFamily: 'var(--font-heading)',
          fontWeight: 700,
          fontSize: '1.5rem',
          color: renk,
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {deger}
      </div>
    </div>
  );
}

/** Hedef değerini gösteren chip; tıklanınca satır içi düzenlemeye döner. */
function HedefChipi({
  hedef,
  degistir,
  capalar,
}: {
  hedef: NetHedefi;
  degistir: (h: NetHedefi) => void;
  capalar: SiralamaTablosu;
}) {
  const [duzenle, setDuzenle] = useState(false);
  const puanMi = hedef.tip === 'puan';
  const deger = puanMi ? (hedef.hedefPuan ?? 0) : (hedef.hedefSiralama ?? 0);
  const enIyi = capalar[0];
  const enKotu = capalar[capalar.length - 1];

  if (duzenle) {
    return (
      <input
        className="input"
        type="number"
        autoFocus
        min={puanMi ? (enKotu?.puan ?? 0) : 1}
        max={puanMi ? (enIyi?.puan ?? undefined) : (enKotu?.siralama ?? undefined)}
        style={{ width: 150, height: 34 }}
        defaultValue={deger}
        aria-label={puanMi ? 'Hedef puan' : 'Hedef sıralama'}
        onBlur={(e) => {
          // `|| deger` sıfır girişini yutuyordu; boş/geçersizde eski değere dön.
          const ham = e.target.value.trim();
          const sayisal = ham === '' ? Number.NaN : Number(ham);
          const v = Number.isFinite(sayisal) ? sayisal : deger;
          degistir(puanMi ? { ...hedef, hedefPuan: Math.max(0, v) } : { ...hedef, hedefSiralama: Math.max(1, Math.round(v)) });
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
      style={{ fontSize: '.9rem', border: 'none', cursor: 'pointer' }}
      onClick={() => setDuzenle(true)}
      title="Hedefi değiştir"
    >
      {puanMi ? `Hedef: ${sayi(hedef.hedefPuan ?? 0)} puan` : `Hedef: ilk ${sayi(hedef.hedefSiralama ?? 0)}`}
    </button>
  );
}
