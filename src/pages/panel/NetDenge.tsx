import { useEffect, useMemo, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Info, Lock, Minus, Plus } from 'lucide-react';
import { Bar, Buton, Kart, Rozet, Segment, Uyari, BosDurum } from '@/components/ui/temel';
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
import { DiplomaNotu, VeriNotu } from '@/components/NetDengeDeneme';
import { net as netBicim, sayi } from '@/lib/format';
import { useOturum } from '@/auth/Oturum';
import { netHedefi, netHedefiKaydet, netHedefiOlustur, puanModeli } from '@/data/repo';
import { ogrenciPuanTuru } from '@/config/site';
import type { HedefTipi, NetHedefi } from '@/data/tipler';

export default function NetDenge() {
  const { profil } = useOturum();
  const ogrenciId = profil?.id ?? '';

  /**
   * Hesap puan türü başına yapılır.
   *
   * Eskiden hedef tek sınav oturumuna bağlıydı ve AYT netlerinden sıralama
   * üretmeye çalışıyorduk; sıralama TYT ile AYT'nin birlikte hesabından çıkar.
   */
  const puanTuru = ogrenciPuanTuru(profil);

  const sorgu = useQuery({
    queryKey: ['net-hedefi', ogrenciId, puanTuru],
    queryFn: () => netHedefi(ogrenciId, puanTuru!),
    enabled: Boolean(ogrenciId && puanTuru),
  });
  const modelSorgu = useQuery({
    queryKey: ['puan-modeli', puanTuru],
    queryFn: () => puanModeli(puanTuru!),
    enabled: Boolean(puanTuru),
  });

  const [hedef, setHedef] = useState<NetHedefi | null>(null);
  const [olusturuluyor, setOlusturuluyor] = useState(false);
  const [hata, setHata] = useState<string | null>(null);
  const ilkYukleme = useRef(true);

  const model = modelSorgu.data ?? null;

  const olustur = async () => {
    if (!puanTuru) return;
    setOlusturuluyor(true);
    setHata(null);
    try {
      const yeni = await netHedefiOlustur(ogrenciId, puanTuru);
      if (!yeni) {
        setHata('Bu puan türü için ders listesi tanımlı değil. Koçunla iletişime geçebilirsin.');
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

  // Puan türü değişince eldeki hedef geçersiz. Bu iki etki bilerek ayrı:
  // tek etkide "türü tutmuyorsa sıfırla" ile "boşsa sorgudan doldur" birbirini
  // tetikleyip sonsuz döngüye giriyordu (demo öğrencisinin hedefi 'tyt', profili
  // Sayısal olduğunda ekran kilitleniyordu).
  useEffect(() => {
    setHedef(null);
    ilkYukleme.current = true;
  }, [puanTuru]);

  useEffect(() => {
    if (sorgu.data && !hedef) setHedef(structuredClone(sorgu.data));
  }, [sorgu.data, hedef]);

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

  const dersler: DersNeti[] = useMemo(
    () =>
      (hedef?.dagilim ?? []).map((d) => ({
        dersId: d.dersId,
        oturumKod: d.oturumKod,
        dersAd: d.ad,
        net: d.net,
        maxNet: d.maxNet,
      })),
    [hedef],
  );
  const kilit = useMemo(
    () => Object.fromEntries((hedef?.dagilim ?? []).map((d) => [d.dersId, d.kilitli])),
    [hedef],
  );

  // Sınava hazırlanmayan öğrencide (ara sınıf, okul müfredatı) sıralama tahmini
  // anlamsız; eskiden bu öğrenciye de YKS eğrisi gösteriliyordu.
  if (!puanTuru) {
    return (
      <Kart>
        <BosDurum
          baslik="Net Denge sınav adayları için"
          aciklama="Hedef alanın seçildiğinde (Sayısal, Eşit Ağırlık, Sözel, Dil ya da LGS) sıralama tahmini burada açılıyor. Koçun bu bilgiyi profiline ekleyebilir."
        />
      </Kart>
    );
  }

  if (sorgu.isLoading || modelSorgu.isLoading) {
    return <div className="iskelet" style={{ minHeight: 320 }} />;
  }

  if (!model) {
    return (
      <Kart>
        <Uyari tur="error">
          Bu puan türü için sınav verisi yüklenemedi. Yönetici <code>puan_modeli</code> tablosunu kontrol etmeli.
        </Uyari>
      </Kart>
    );
  }

  if (!hedef) {
    return (
      <Kart style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <BosDurum
          baslik={`${model.ad} için Net Denge hedefin henüz kurulmadı`}
          aciklama="Hedef sıralamanı ya da puanını seçtiğinde, ders başına kaç net gerektiğini sistem gerçek sınav verisinden hesaplar. Başlangıç dağılımını şimdi oluşturup üzerinde oynayabilirsin."
        >
          <Buton onClick={olustur} disabled={olusturuluyor}>
            {olusturuluyor ? 'Hazırlanıyor…' : 'Hedefi oluştur'}
          </Buton>
        </BosDurum>
        {hata && <Uyari tur="error">{hata}</Uyari>}
      </Kart>
    );
  }

  const obp = hedef.obp;
  const obpVar = model.obpKatsayi > 0;
  const yerlestirmeModu = obp !== null && obpVar && model.yerlestirmeDagilimi.length > 0;
  const dagilim = yerlestirmeModu ? model.yerlestirmeDagilimi : model.sinavDagilimi;

  const sinavPuani = netlerdenPuan(model, dersler);
  const tamPuan = obp === null ? sinavPuani : yerlestirmePuani(model, sinavPuani, obp);
  const siralama = puandanSiralama(tamPuan, dagilim);
  const enYuksek = ulasilabilirEnYuksekPuan(model, dersler);

  /** Hedefin gerektirdiği SINAV puanı — OBP katkısı düşülmüş hâli. */
  const hedefTamPuan =
    hedef.tip === 'siralama'
      ? siralamadanPuan(hedef.hedefSiralama ?? 0, dagilim)
      : (hedef.hedefPuan ?? null);
  const obpKatki = obp === null ? 0 : obp * model.obpKatsayi;
  const gerekenSinavPuani =
    hedefTamPuan === null ? null : Number((hedefTamPuan - obpKatki).toFixed(1));

  const dagilimUygula = (yeniNetler: Record<string, number>, ustDeger?: Partial<NetHedefi>) =>
    setHedef({
      ...hedef,
      ...ustDeger,
      dagilim: hedef.dagilim.map((d) => ({ ...d, net: yeniNetler[d.dersId] ?? d.net })),
    });

  const netDegistir = (dersId: string, delta: number) =>
    dagilimUygula(degistir(model, dersler, kilit, dersId, delta));

  const kilitDegistir = (dersId: string) =>
    setHedef({
      ...hedef,
      dagilim: hedef.dagilim.map((d) => (d.dersId === dersId ? { ...d, kilitli: !d.kilitli } : d)),
    });

  /** Hedef değişince dağılımı yeni gereken puana göre yeniden kur. */
  const hedefiDegistir = (girdi: NetHedefi) => {
    const yeni = { ...girdi, ...hedefiKis(girdi, model, dagilim) };
    const yeniHedefPuan =
      yeni.tip === 'siralama'
        ? siralamadanPuan(yeni.hedefSiralama ?? 0, dagilim)
        : (yeni.hedefPuan ?? null);
    if (yeniHedefPuan === null) {
      setHedef(yeni);
      return;
    }
    const yeniObpKatki = yeni.obp === null ? 0 : yeni.obp * model.obpKatsayi;
    const dagitilmis = hedefePuanDagit(model, dersler, kilit, yeniHedefPuan - yeniObpKatki);
    setHedef({
      ...yeni,
      dagilim: yeni.dagilim.map((d) => ({ ...d, net: dagitilmis[d.dersId] ?? d.net })),
    });
  };

  const tipDegistir = (tip: HedefTipi) => {
    // Puan moduna ilk geçişte hedef boş oluyordu ve ekran "0 puan" gösteriyordu.
    if (tip === 'puan' && hedef.hedefPuan === null) {
      hedefiDegistir({ ...hedef, tip, hedefPuan: tamPuan });
      return;
    }
    if (tip === 'siralama' && hedef.hedefSiralama === null) {
      hedefiDegistir({ ...hedef, tip, hedefSiralama: siralama ?? 100000 });
      return;
    }
    hedefiDegistir({ ...hedef, tip });
  };

  const hedefeGoreDagit = () => {
    if (gerekenSinavPuani === null) return;
    dagilimUygula(hedefePuanDagit(model, dersler, kilit, gerekenSinavPuani));
  };

  const ulasilmaz = gerekenSinavPuani !== null && gerekenSinavPuani > enYuksek + 0.5;
  const fark = gerekenSinavPuani === null ? 0 : Number((sinavPuani - gerekenSinavPuani).toFixed(1));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <Kart style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
          <div>
            <h3 style={{ fontSize: '1.05rem' }}>{model.ad} hedefin</h3>
            <p className="hint" style={{ marginTop: 4 }}>
              Hedefini seçtiğinde ders başına gereken netleri {model.yil} sınav verisinden hesaplıyoruz.
            </p>
          </div>
          <Segment
            etiket="Hedef tipi"
            style={{ marginLeft: 'auto' }}
            deger={hedef.tip}
            degistir={tipDegistir}
            secenekler={[
              { deger: 'puan' as HedefTipi, etiket: 'Hedef puan' },
              { deger: 'siralama' as HedefTipi, etiket: 'Hedef sıralama' },
            ]}
          />
          <HedefChipi hedef={hedef} degistir={hedefiDegistir} model={model} dagilim={dagilim} />
        </div>

        {obpVar && (
          <DiplomaNotu
            deger={obp === null ? null : Number((obp / 5).toFixed(2))}
            degistir={(v) => hedefiDegistir({ ...hedef, obp: v === null ? null : v * 5 })}
          />
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {hedef.dagilim.map((d, i) => (
            <div key={d.dersId}>
              {/* TYT ile AYT tek listede; oturum başlığı ikisini ayırıyor */}
              {(i === 0 || hedef.dagilim[i - 1].oturumKod !== d.oturumKod) && d.oturumAd && (
                <div className="hint" style={{ fontWeight: 600, margin: '8px 0 4px' }}>
                  {d.oturumAd}
                </div>
              )}
              <div
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

                <Bar
                  oran={d.maxNet ? d.net / d.maxNet : 0}
                  renk={d.renk}
                  className="hide-m"
                  style={{ flex: 1, minWidth: 80 }}
                />

                <label className="badge kilit-etiketi" style={{ cursor: 'pointer', gap: 6, marginLeft: 'auto' }}>
                  <input type="checkbox" checked={d.kilitli} onChange={() => kilitDegistir(d.dersId)} />
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
            gap: 20,
            borderTop: '1.5px dashed var(--color-border)',
            paddingTop: 18,
            flexWrap: 'wrap',
          }}
        >
          {gerekenSinavPuani !== null && (
            <OzetDeger etiket="Hedefin için gereken sınav puanı" deger={netBicim(gerekenSinavPuani)} />
          )}
          <OzetDeger
            etiket="Şu anki dağılımın"
            deger={netBicim(sinavPuani)}
            renk={Math.abs(fark) < 1 ? undefined : 'var(--color-urgent-deep)'}
          />
          {yerlestirmeModu && (
            <OzetDeger etiket="Yerleştirme puanın" deger={netBicim(tamPuan)} renk="var(--color-primary)" />
          )}
          {siralama !== null && (
            <OzetDeger etiket="Tahmini sıralama" deger={`~${sayi(siralama)}`} renk="var(--color-primary)" />
          )}
          <Rozet ton="warning">tahmini — garanti değil</Rozet>
          <Buton tip="outline" boy="sm" style={{ marginLeft: 'auto' }} onClick={hedefeGoreDagit}>
            Hedefe göre dağıt
          </Buton>
        </div>
      </Kart>

      {ulasilmaz ? (
        <Uyari tur="warning">
          Bu hedef {netBicim(gerekenSinavPuani!)} sınav puanı istiyor; tüm dersler tam çekildiğinde ulaşılabilecek
          en yüksek puan {netBicim(enYuksek)}.
          {obpVar && obp === null
            ? ' Diploma notunu girersen yerleştirme puanın hesaba katılır ve gereken sınav puanı düşer.'
            : ' Hedefi biraz aşağı çekmen gerekiyor.'}
        </Uyari>
      ) : (
        Math.abs(fark) >= 1 && (
          <Uyari tur={fark > 0 ? 'success' : 'warning'}>
            {fark > 0
              ? `Dağılımın hedefinin ${netBicim(fark)} puan üstünde — hedefinden iyisini planlamışsın.`
              : `Dağılımın hedefinin ${netBicim(-fark)} puan altında. Sabitlediğin dersleri açarsan fark oralara dağıtılır.`}
          </Uyari>
        )
      )}

      {hata && <Uyari tur="error">{hata}</Uyari>}

      <Uyari tur="info" ikon={<Info size={18} style={{ flex: 'none' }} />} style={{ alignItems: 'center' }}>
        Puanın, her dersin netinin o yılın katsayısıyla çarpılıp toplanmasıyla çıkıyor; sıralama ise ÖSYM/MEB'in
        yayımladığı yığınsal dağılımdan okunuyor. Bir dersi azalttığında fark kilitsiz derslere gidiyor ve{' '}
        <strong>puan sabit kalıyor</strong> — ağırlığı yüksek ders daha çok net alıyor.
      </Uyari>

      <VeriNotu model={model} />
    </div>
  );
}

/**
 * Hedefi verinin anlamlı aralığına çeker.
 * Aralık dışı puan `hedef_puan numeric(5,1)` sınırını aşıp yazmayı düşürüyordu.
 */
function hedefiKis(
  hedef: NetHedefi,
  model: PuanModeli,
  dagilim: PuanModeli['sinavDagilimi'],
): Partial<NetHedefi> {
  if (hedef.tip === 'siralama') {
    const aralik = siralamaAraligi(dagilim);
    const v = hedef.hedefSiralama ?? 0;
    return {
      hedefSiralama: Math.round(Math.max(aralik?.enIyi ?? 1, Math.min(aralik?.enKotu ?? v, v))),
    };
  }
  const v = hedef.hedefPuan ?? 0;
  // Yerleştirme puanı OBP ile 500'ün üstüne çıkabiliyor (2026'da tavan 560).
  const ust = model.tavanPuan + 60;
  return { hedefPuan: Number(Math.max(model.tabanPuan, Math.min(ust, v)).toFixed(1)) };
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
  model,
  dagilim,
}: {
  hedef: NetHedefi;
  degistir: (h: NetHedefi) => void;
  model: PuanModeli;
  dagilim: PuanModeli['sinavDagilimi'];
}) {
  const [duzenle, setDuzenle] = useState(false);
  const puanMi = hedef.tip === 'puan';
  const deger = puanMi ? (hedef.hedefPuan ?? 0) : (hedef.hedefSiralama ?? 0);
  const aralik = siralamaAraligi(dagilim);

  if (duzenle) {
    return (
      <input
        className="input"
        type="number"
        autoFocus
        min={puanMi ? model.tabanPuan : (aralik?.enIyi ?? 1)}
        max={puanMi ? model.tavanPuan + 60 : (aralik?.enKotu ?? undefined)}
        style={{ width: 150, height: 34 }}
        defaultValue={deger}
        aria-label={puanMi ? 'Hedef puan' : 'Hedef sıralama'}
        onBlur={(e) => {
          // `|| deger` sıfır girişini yutuyordu; boş/geçersizde eski değere dön.
          const ham = e.target.value.trim();
          const sayisal = ham === '' ? Number.NaN : Number(ham);
          const v = Number.isFinite(sayisal) ? sayisal : deger;
          degistir(
            puanMi
              ? { ...hedef, hedefPuan: Math.max(0, v) }
              : { ...hedef, hedefSiralama: Math.max(1, Math.round(v)) },
          );
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
