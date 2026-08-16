import { useEffect, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Check, ChevronLeft, ChevronRight, MessagesSquare, Plus, Trash2 } from 'lucide-react';
import { Alan, Avatar, Bar, Buton, Halka, Kart, Rozet, Uyari, BosDurum } from '@/components/ui/temel';
import { degisim, goreliZaman, gunAdi, net as netBicim, saat, sayi, tarihKisa } from '@/lib/format';
import { DersOzetTablosu } from '@/components/DersOzetTablosu';
import { useOturum } from '@/auth/Oturum';
import {
  atanabilirKonular,
  denemeEkle,
  denemeSil,
  denemeler,
  dersBazliOzet,
  gorusmeDurumu,
  gorusmePlanla,
  gorusmeSil,
  haftaBasi,
  haftaKaydir,
  haftaPlani,
  haftalikSeri,
  kocGorusmeleri,
  konusmaAc,
  notEkle,
  notlar,
  ogrencilerim,
  profil as profilGetir,
  planKaydet,
  yerelGun,
  type PlanMaddesiGirdi,
} from '@/data/repo';
import type { Gorusme } from '@/data/tipler';

const GUN_ADLARI = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];

/** Haftanın yedi günü — plan satırındaki gün seçicisi için. */
function haftaGunleri(haftaBaslangic: string): Array<{ deger: string; etiket: string }> {
  return GUN_ADLARI.map((ad, i) => {
    const d = new Date(`${haftaBaslangic}T00:00:00`);
    d.setDate(d.getDate() + i);
    return { deger: yerelGun(d), etiket: `${ad} ${d.getDate()}` };
  });
}

function haftaEtiketi(haftaBaslangic: string): string {
  const bas = new Date(`${haftaBaslangic}T00:00:00`);
  const bit = new Date(bas);
  bit.setDate(bit.getDate() + 6);
  const bicim = new Intl.DateTimeFormat('tr-TR', { day: 'numeric', month: 'short' });
  return `${bicim.format(bas)} – ${bicim.format(bit)}`;
}

export default function KocOgrenciDetay() {
  const { ogrenciId = '' } = useParams();
  const { profil } = useOturum();
  const git = useNavigate();
  const kocId = profil?.id ?? '';

  const ogrenciProfili = useQuery({ queryKey: ['profil', ogrenciId], queryFn: () => profilGetir(ogrenciId) });
  const hedefi = ogrenciProfili.data?.hedef?.trim() || '';

  const ogrenciler = useQuery({ queryKey: ['ogrencilerim', kocId], queryFn: () => ogrencilerim(kocId) });
  const ogrenci = ogrenciler.data?.find((o) => o.id === ogrenciId);

  const dersOzet = useQuery({ queryKey: ['ders-ozet', ogrenciId], queryFn: () => dersBazliOzet(ogrenciId) });
  const konuToplam = (dersOzet.data ?? []).reduce((a, d) => a + d.konuToplam, 0);
  const konuTamam = (dersOzet.data ?? []).reduce((a, d) => a + d.konuTamam, 0);
  const oranDegeri = konuToplam ? konuTamam / konuToplam : 0;
  const seri = useQuery({ queryKey: ['haftalik-seri', ogrenciId], queryFn: () => haftalikSeri(ogrenciId) });
  const denemeSorgu = useQuery({ queryKey: ['denemeler', ogrenciId], queryFn: () => denemeler(ogrenciId) });

  const sonDeneme = denemeSorgu.data?.[denemeSorgu.data.length - 1];
  const aylikDegisim = denemeSorgu.data && denemeSorgu.data.length > 1 ? (sonDeneme?.degisim ?? 0) : 0;
  const sonHafta = seri.data?.[seri.data.length - 1];

  if (ogrenciler.isLoading) return <div className="iskelet" style={{ minHeight: 240 }} />;
  if (!ogrenci) {
    return (
      <Kart>
        <BosDurum baslik="Öğrenci bulunamadı" aciklama="Bu öğrenci sana atanmamış olabilir.">
          <Link to="/koc" className="btn btn-outline btn-sm">
            Listeye dön
          </Link>
        </BosDurum>
      </Kart>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
        <Link to="/koc" className="btn btn-ghost btn-sm">
          <ArrowLeft size={15} /> Liste
        </Link>
        <Avatar ad={ogrenci.adSoyad} renk={ogrenci.avatarRengi} foto={ogrenci.avatarUrl} boy="lg" />
        <div>
          <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 700 }}>{ogrenci.adSoyad}</div>
          <div className="hint" style={{ fontSize: '.75rem' }}>
            {ogrenci.sinav}
          </div>
        </div>
        <Rozet ton={ogrenci.durum === 'yolunda' ? 'success' : ogrenci.durum === 'riskli' ? 'error' : 'warning'}>
          {ogrenci.durum === 'yolunda'
            ? 'Yolunda'
            : ogrenci.durum === 'riskli'
              ? 'Riskli'
              : ogrenci.durum === 'yeni'
                ? 'Yeni'
                : 'Plan gecikti'}
        </Rozet>
        {/* Yazışma sistem dışındaydı; koç buradan doğrudan sohbete geçiyor */}
        <Buton
          tip="outline"
          boy="sm"
          style={{ marginLeft: 'auto' }}
          onClick={async () => {
            await konusmaAc(kocId, ogrenciId, 'ogrenci', ogrenciId);
            git('/koc/mesajlar');
          }}
        >
          <MessagesSquare size={15} /> Mesaj gönder
        </Buton>
      </div>

      {/* Sınava hazırlanmayan öğrencide plan tek yön göstericisi hedefi */}
      {hedefi && (
        <Kart style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', padding: '14px 18px' }}>
          <Rozet ton="primary">Hedefi</Rozet>
          <strong style={{ fontFamily: 'var(--font-heading)' }}>{hedefi}</strong>
        </Kart>
      )}

      <DersProgrami ogrenciId={ogrenciId} kocId={kocId} />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(320px,1fr))', gap: 24 }}>
        <GorusmePaneli ogrenciId={ogrenciId} kocId={kocId} />

        <Kart style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <h3 style={{ fontSize: '1.05rem' }}>İlerleme</h3>
          <div style={{ display: 'flex', gap: 18, alignItems: 'center' }}>
            <Halka oran={oranDegeri} boyut={88} />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10, fontSize: '.85rem' }}>
              {(dersOzet.data ?? []).map((d) => (
                <div key={d.dersId} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ width: 70 }} className="hint">
                    {d.ad}
                  </span>
                  <Bar oran={d.konuToplam ? d.konuTamam / d.konuToplam : 0} renk={d.renk} style={{ flex: 1 }} />
                </div>
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <div className="stat-tile">
              <div className="deger">{sonDeneme ? netBicim(sonDeneme.net) : '—'}</div>
              <div className="etiket">son net</div>
            </div>
            <div className="stat-tile">
              <div
                className="deger"
                style={{ color: aylikDegisim >= 0 ? 'var(--color-success-deep)' : 'var(--color-error-deep)' }}
              >
                {degisim(aylikDegisim)}
              </div>
              <div className="etiket">bu ay</div>
            </div>
            <div className="stat-tile">
              <div className="deger">{sonHafta ? sayi(sonHafta.cozulenSoru) : '—'}</div>
              <div className="etiket">soru/hafta</div>
            </div>
          </div>
        </Kart>
      </div>

      {/* Öğrencinin toplu verisi — koç panelinde hiç yoktu */}
      <DersOzetTablosu
        dersler={dersOzet.data ?? []}
        baslik="Öğrencinin ders bazlı toplamı"
        detayli
        ustEkstra={<span className="hint">başlangıçtan bugüne</span>}
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(320px,1fr))', gap: 24 }}>
        <DenemePaneli ogrenciId={ogrenciId} />
        <NotPaneli ogrenciId={ogrenciId} kocId={kocId} />
      </div>
    </div>
  );
}

// ============================================================
// Haftalık ders programı
// ============================================================

interface ProgramSatiri {
  /** Mevcut plan maddesi ise id taşınır — öğrencinin işareti korunur. */
  id?: string;
  baslik: string;
  konuId: string | null;
  /** Sınavda o konudan çıkan ortalama soru sayısı (koç programı buna göre kurar) */
  soruOrtalamasi: number | null;
  /** Öğrencinin o konuda şimdiye kadar çözdüğü soru */
  cozulen: number | null;
  gun: string;
  /** Koçun maddeye yazdığı yönerge — öğrenci panelinde görünür */
  not: string;
}

/**
 * Haftalık ders programı editörü.
 *
 * Eskiden koç yalnızca "gelecek haftaya konu ata" yapabiliyordu; gün ve saat
 * yazılmadığı için öğrencinin "Bugünün akışı" çizelgesi hep boş kalıyor, aynı
 * konu her gönderimde tekrar ekleniyordu. Artık hafta seçiliyor, her maddeye gün
 * ve saat veriliyor, kaydetme o haftanın tamamını değiştiriyor.
 */
function DersProgrami({ ogrenciId, kocId }: { ogrenciId: string; kocId: string }) {
  const qc = useQueryClient();
  const [hafta, setHafta] = useState(haftaBasi());
  const [satirlar, setSatirlar] = useState<ProgramSatiri[]>([]);
  const [secilenKonu, setSecilenKonu] = useState('');
  const [serbest, setSerbest] = useState('');
  const [islemde, setIslemde] = useState(false);
  const [durum, setDurum] = useState<{ tur: 'success' | 'error'; mesaj: string } | null>(null);

  const plan = useQuery({ queryKey: ['plan', ogrenciId, hafta], queryFn: () => haftaPlani(ogrenciId, hafta) });
  const konular = useQuery({ queryKey: ['atanabilir-konular', ogrenciId], queryFn: () => atanabilirKonular(ogrenciId) });

  // Hafta değiştiğinde ya da plan yüklendiğinde formu tazele.
  useEffect(() => {
    setSatirlar(
      (plan.data?.maddeler ?? []).map((m) => ({
        id: m.id,
        baslik: m.baslik,
        konuId: m.konuId,
        soruOrtalamasi: m.soruOrtalamasi,
        cozulen: konular.data?.find((k) => k.id === m.konuId)?.cozulen ?? null,
        gun: m.gun ?? '',
        not: m.not ?? '',
      })),
    );
    setDurum(null);
  }, [plan.data, hafta]);

  const gunler = useMemo(() => haftaGunleri(hafta), [hafta]);
  const konuGruplari = useMemo(() => {
    const harita = new Map<string, typeof konular.data>();
    for (const k of konular.data ?? []) harita.set(k.dersAdi, [...(harita.get(k.dersAdi) ?? []), k]);
    return [...harita.entries()];
  }, [konular.data]);

  const ekle = (
    baslik: string,
    konuId: string | null,
    soruOrtalamasi: number | null = null,
    cozulen: number | null = null,
  ) => {
    if (!baslik.trim()) return;
    setSatirlar((s) => [...s, { baslik: baslik.trim(), konuId, soruOrtalamasi, cozulen, gun: '', not: '' }]);
  };

  const guncelle = (i: number, degisim: Partial<ProgramSatiri>) =>
    setSatirlar((s) => s.map((satir, j) => (j === i ? { ...satir, ...degisim } : satir)));

  const kaydet = async () => {
    setIslemde(true);
    setDurum(null);
    try {
      const girdi: PlanMaddesiGirdi[] = satirlar.map((s) => ({
        id: s.id,
        baslik: s.baslik,
        konuId: s.konuId,
        gun: s.gun || null,
        not: s.not || null,
      }));
      await planKaydet(ogrenciId, kocId, hafta, girdi);
      await qc.invalidateQueries({ queryKey: ['plan'] });
      await qc.invalidateQueries({ queryKey: ['ogrencilerim'] });
      setDurum({ tur: 'success', mesaj: 'Program kaydedildi; öğrencinin panelinde görünüyor.' });
    } catch (h) {
      setDurum({ tur: 'error', mesaj: h instanceof Error ? h.message : 'Program kaydedilemedi.' });
    } finally {
      setIslemde(false);
    }
  };

  const buHaftaMi = hafta === haftaBasi();
  const tamamlanan = (plan.data?.maddeler ?? []).filter((m) => m.tamamlandi).length;

  return (
    <Kart style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <h3 style={{ fontSize: '1.05rem' }}>Haftalık ders programı</h3>
        {plan.data && (
          <Rozet ton="success">
            {tamamlanan}/{plan.data.maddeler.length} tamamlandı
          </Rozet>
        )}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
          <button
            type="button"
            className="icon-btn"
            aria-label="Önceki hafta"
            onClick={() => setHafta((h) => haftaKaydir(h, -1))}
          >
            <ChevronLeft size={17} />
          </button>
          <button
            type="button"
            className="chip"
            style={{ cursor: 'pointer', border: 'none', minWidth: 132, justifyContent: 'center' }}
            onClick={() => setHafta(haftaBasi())}
            title="Bu haftaya dön"
          >
            {haftaEtiketi(hafta)}
            {buHaftaMi ? ' · bu hafta' : ''}
          </button>
          <button
            type="button"
            className="icon-btn"
            aria-label="Sonraki hafta"
            onClick={() => setHafta((h) => haftaKaydir(h, 1))}
          >
            <ChevronRight size={17} />
          </button>
        </div>
      </div>

      {satirlar.length === 0 && (
        <p className="hint">Bu hafta için madde yok. Aşağıdan konu ekleyip gün ve saat verebilirsin.</p>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {satirlar.map((s, i) => {
          const tamamMi = plan.data?.maddeler.find((m) => m.id === s.id)?.tamamlandi;
          return (
            <div
              key={s.id ?? `yeni-${i}`}
              className="program-satiri"
              style={{
                display: 'flex',
                alignItems: 'flex-end',
                gap: 10,
                flexWrap: 'wrap',
                background: 'var(--color-bg)',
                borderRadius: 12,
                padding: '12px 14px',
              }}
            >
              <div style={{ flex: '1 1 180px', minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {tamamMi && <Check size={15} strokeWidth={2.5} color="var(--color-success)" />}
                  <strong
                    style={{
                      fontSize: '.92rem',
                      color: tamamMi ? 'var(--color-text-muted)' : undefined,
                      textDecoration: tamamMi ? 'line-through' : undefined,
                    }}
                  >
                    {s.baslik}
                  </strong>
                  {/* Koç, sınavda o konudan kaç soru çıktığını hiç görmüyordu */}
                  {(s.soruOrtalamasi ?? 0) > 0 && <Rozet>~{sayi(s.soruOrtalamasi ?? 0)} soru</Rozet>}
                  {/* Öğrencinin o konuda daha önce kaç soru çözdüğü */}
                  {s.cozulen !== null && (
                    <Rozet ton={s.cozulen > 0 ? 'success' : 'notr'}>çözdüğü {sayi(s.cozulen)}</Rozet>
                  )}
                </div>
              </div>

              <Alan etiket="Gün" style={{ flex: '0 1 150px' }}>
                <select className="input" value={s.gun} onChange={(e) => guncelle(i, { gun: e.target.value })}>
                  <option value="">Gün yok</option>
                  {gunler.map((g) => (
                    <option key={g.deger} value={g.deger}>
                      {g.etiket}
                    </option>
                  ))}
                </select>
              </Alan>
              {/* Saat aralığı kaldırıldı; yerine öğrencinin göreceği yönerge */}
              <Alan etiket="Not (öğrenci görür)" style={{ flex: '1 1 240px' }}>
                <input
                  className="input"
                  value={s.not}
                  onChange={(e) => guncelle(i, { not: e.target.value })}
                  placeholder="Örn: önce konu tekrarı, sonra 20 çıkmış soru"
                />
              </Alan>
              <button
                type="button"
                className="icon-btn"
                aria-label={`${s.baslik} maddesini kaldır`}
                onClick={() => setSatirlar((liste) => liste.filter((_, j) => j !== i))}
              >
                <Trash2 size={16} />
              </button>
            </div>
          );
        })}
      </div>

      <div
        style={{
          borderTop: '1px solid var(--color-border)',
          paddingTop: 14,
          display: 'flex',
          gap: 10,
          alignItems: 'flex-end',
          flexWrap: 'wrap',
        }}
      >
        <Alan etiket="Müfredattan konu ekle" style={{ flex: '1 1 220px' }}>
          <select
            className="input"
            value={secilenKonu}
            onChange={(e) => {
              const konu = (konular.data ?? []).find((k) => k.id === e.target.value);
              if (konu) ekle(konu.ad, konu.id, konu.soruOrtalamasi, konu.cozulen);
              setSecilenKonu('');
            }}
          >
            <option value="">Konu seç…</option>
            {konuGruplari.map(([ders, liste]) => (
              <optgroup key={ders} label={ders}>
                {(liste ?? []).map((k) => (
                  <option key={k.id} value={k.id}>
                    {k.ad}
                    {k.soruOrtalamasi > 0 ? ` · ~${sayi(k.soruOrtalamasi)} soru` : ''} · çözdüğü {sayi(k.cozulen)}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </Alan>
        <Alan etiket="Serbest madde" ipucu="Deneme, tekrar, ödev…" style={{ flex: '1 1 200px' }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              className="input"
              value={serbest}
              onChange={(e) => setSerbest(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  ekle(serbest, null);
                  setSerbest('');
                }
              }}
            />
            <Buton
              type="button"
              tip="secondary"
              onClick={() => {
                ekle(serbest, null);
                setSerbest('');
              }}
              disabled={!serbest.trim()}
              aria-label="Serbest madde ekle"
              style={{ width: 44, padding: 0, flex: 'none' }}
            >
              <Plus size={16} />
            </Buton>
          </div>
        </Alan>
      </div>

      {durum && <Uyari tur={durum.tur === 'success' ? 'success' : 'error'}>{durum.mesaj}</Uyari>}

      <Buton style={{ alignSelf: 'flex-start' }} onClick={kaydet} disabled={islemde}>
        {islemde ? 'Kaydediliyor…' : 'Programı kaydet'}
      </Buton>
    </Kart>
  );
}

// ============================================================
// Görüşmeler
// ============================================================

const TURLER: Array<{ deger: Gorusme['tur']; etiket: string }> = [
  { deger: 'goruntulu', etiket: 'Görüntülü' },
  { deger: 'yuz_yuze', etiket: 'Yüz yüze' },
  { deger: 'tanisma', etiket: 'Tanışma' },
];

/**
 * Görüşme planlama.
 *
 * Görüşmeler yalnızca okunuyordu — sisteme görüşme girecek hiçbir ekran yoktu,
 * bu yüzden koç takvimi ve öğrencinin "sonraki görüşme" kartı hep boştu.
 */
function GorusmePaneli({ ogrenciId, kocId }: { ogrenciId: string; kocId: string }) {
  const qc = useQueryClient();
  const gorusmeler = useQuery({ queryKey: ['koc-gorusmeleri', kocId], queryFn: () => kocGorusmeleri(kocId) });

  const [tarih, setTarih] = useState(yerelGun());
  const [saatDegeri, setSaatDegeri] = useState('19:00');
  const [sureDk, setSureDk] = useState('30');
  const [tur, setTur] = useState<Gorusme['tur']>('goruntulu');
  const [katilimUrl, setKatilimUrl] = useState('');
  const [islemde, setIslemde] = useState(false);
  const [hata, setHata] = useState<string | null>(null);

  const kendi = (gorusmeler.data ?? [])
    .filter((g) => g.ogrenciId === ogrenciId)
    .sort((a, b) => b.baslangic.localeCompare(a.baslangic));

  const planla = async () => {
    setHata(null);
    setIslemde(true);
    try {
      await gorusmePlanla(ogrenciId, kocId, {
        baslangic: new Date(`${tarih}T${saatDegeri}:00`).toISOString(),
        sureDk: parseInt(sureDk) || 30,
        tur,
        katilimUrl: katilimUrl.trim() || null,
      });
      setKatilimUrl('');
      await qc.invalidateQueries({ queryKey: ['koc-gorusmeleri'] });
      await qc.invalidateQueries({ queryKey: ['sonraki-gorusme', ogrenciId] });
      await qc.invalidateQueries({ queryKey: ['ogrencilerim'] });
    } catch (h) {
      setHata(h instanceof Error ? h.message : 'Görüşme planlanamadı.');
    } finally {
      setIslemde(false);
    }
  };

  const degistir = async (islem: () => Promise<void>) => {
    setIslemde(true);
    try {
      await islem();
      await qc.invalidateQueries({ queryKey: ['koc-gorusmeleri'] });
      await qc.invalidateQueries({ queryKey: ['sonraki-gorusme', ogrenciId] });
      await qc.invalidateQueries({ queryKey: ['ogrencilerim'] });
    } finally {
      setIslemde(false);
    }
  };

  return (
    <Kart style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <h3 style={{ fontSize: '1.05rem' }}>Görüşmeler</h3>

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <Alan etiket="Tarih" style={{ flex: '1 1 140px' }}>
          <input className="input" type="date" value={tarih} onChange={(e) => setTarih(e.target.value)} />
        </Alan>
        <Alan etiket="Saat" style={{ flex: '0 1 110px' }}>
          <input className="input" type="time" value={saatDegeri} onChange={(e) => setSaatDegeri(e.target.value)} />
        </Alan>
        <Alan etiket="Süre (dk)" style={{ flex: '0 1 96px' }}>
          <input
            className="input"
            type="number"
            min={10}
            step={5}
            value={sureDk}
            onChange={(e) => setSureDk(e.target.value)}
          />
        </Alan>
        <Alan etiket="Tür" style={{ flex: '1 1 130px' }}>
          <select className="input" value={tur} onChange={(e) => setTur(e.target.value as Gorusme['tur'])}>
            {TURLER.map((t) => (
              <option key={t.deger} value={t.deger}>
                {t.etiket}
              </option>
            ))}
          </select>
        </Alan>
        <Alan etiket="Katılım bağlantısı (isteğe bağlı)" style={{ flex: '1 1 100%' }}>
          <input
            className="input"
            value={katilimUrl}
            onChange={(e) => setKatilimUrl(e.target.value)}
            placeholder="https://meet.google.com/…"
            inputMode="url"
          />
        </Alan>
      </div>

      {hata && <Uyari tur="error">{hata}</Uyari>}

      <Buton style={{ alignSelf: 'flex-start' }} onClick={planla} disabled={islemde}>
        Görüşme planla
      </Buton>

      <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {kendi.length === 0 && <p className="hint">Henüz görüşme yok.</p>}
        {kendi.slice(0, 6).map((g) => (
          <div key={g.id} className="satir" style={{ flexWrap: 'wrap', gap: 8 }}>
            <span style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 600, fontSize: '.88rem' }}>
              {tarihKisa(g.baslangic)} {gunAdi(g.baslangic).slice(0, 3)} {saat(g.baslangic)}
            </span>
            <Rozet ton={g.durum === 'tamamlandi' ? 'success' : g.durum === 'iptal' ? 'error' : 'info'}>
              {g.durum === 'tamamlandi' ? 'Tamamlandı' : g.durum === 'iptal' ? 'İptal' : 'Planlandı'}
            </Rozet>
            {g.durum === 'planlandi' && (
              <div className="eylem-satiri" style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
                <Buton
                  tip="outline"
                  boy="sm"
                  disabled={islemde}
                  onClick={() => degistir(() => gorusmeDurumu(g.id, 'tamamlandi'))}
                >
                  Tamamlandı
                </Buton>
                <Buton tip="ghost" boy="sm" disabled={islemde} onClick={() => degistir(() => gorusmeDurumu(g.id, 'iptal'))}>
                  İptal
                </Buton>
              </div>
            )}
            {g.durum !== 'planlandi' && (
              <Buton
                tip="ghost"
                boy="sm"
                style={{ marginLeft: 'auto' }}
                disabled={islemde}
                onClick={() => degistir(() => gorusmeSil(g.id))}
                aria-label="Görüşme kaydını sil"
              >
                <Trash2 size={14} />
              </Buton>
            )}
          </div>
        ))}
      </div>
    </Kart>
  );
}

// ============================================================
// Denemeler
// ============================================================

/**
 * Deneme sonucu girişi.
 *
 * Net gelişimi grafikleri `mock_exams` tablosundan besleniyor ama tabloya kayıt
 * girecek ekran yoktu; grafikler kalıcı olarak boştu.
 */
function DenemePaneli({ ogrenciId }: { ogrenciId: string }) {
  const qc = useQueryClient();
  const liste = useQuery({ queryKey: ['denemeler', ogrenciId], queryFn: () => denemeler(ogrenciId) });

  const [ad, setAd] = useState('');
  const [tarih, setTarih] = useState(yerelGun());
  const [net, setNet] = useState('');
  const [islemde, setIslemde] = useState(false);
  const [hata, setHata] = useState<string | null>(null);

  const tazele = async () => {
    await qc.invalidateQueries({ queryKey: ['denemeler', ogrenciId] });
    await qc.invalidateQueries({ queryKey: ['ogrencilerim'] });
    await qc.invalidateQueries({ queryKey: ['tum-ogrenciler'] });
  };

  const ekle = async () => {
    const netDegeri = Number(net.replace(',', '.'));
    if (!ad.trim() || Number.isNaN(netDegeri)) {
      setHata('Deneme adı ve net bilgisi gerekiyor.');
      return;
    }
    setHata(null);
    setIslemde(true);
    try {
      await denemeEkle(ogrenciId, { ad: ad.trim(), tarih, net: netDegeri });
      setAd('');
      setNet('');
      await tazele();
    } catch (h) {
      setHata(h instanceof Error ? h.message : 'Deneme eklenemedi.');
    } finally {
      setIslemde(false);
    }
  };

  return (
    <Kart style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <h3 style={{ fontSize: '1.05rem' }}>Deneme sonuçları</h3>

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <Alan etiket="Deneme" style={{ flex: '1 1 150px' }}>
          <input className="input" value={ad} onChange={(e) => setAd(e.target.value)} placeholder="TYT D7" />
        </Alan>
        <Alan etiket="Tarih" style={{ flex: '1 1 140px' }}>
          <input className="input" type="date" value={tarih} onChange={(e) => setTarih(e.target.value)} />
        </Alan>
        <Alan etiket="Net" style={{ flex: '0 1 90px' }}>
          <input className="input" inputMode="decimal" value={net} onChange={(e) => setNet(e.target.value)} />
        </Alan>
        <Buton tip="secondary" onClick={ekle} disabled={islemde}>
          Ekle
        </Buton>
      </div>

      {hata && <Uyari tur="error">{hata}</Uyari>}

      <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {!liste.data?.length && <p className="hint">Henüz deneme kaydı yok.</p>}
        {[...(liste.data ?? [])].reverse().slice(0, 8).map((d) => (
          <div key={d.id} className="satir">
            <strong style={{ fontSize: '.9rem' }}>{d.ad}</strong>
            <span className="hint">{tarihKisa(d.tarih)}</span>
            <span style={{ marginLeft: 'auto', fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}>
              {netBicim(d.net)} net
            </span>
            {d.degisim !== null && (
              <Rozet ton={d.degisim >= 0 ? 'success' : 'error'}>{degisim(d.degisim)}</Rozet>
            )}
            <Buton
              tip="ghost"
              boy="sm"
              aria-label={`${d.ad} kaydını sil`}
              disabled={islemde}
              onClick={async () => {
                setIslemde(true);
                try {
                  await denemeSil(d.id);
                  await tazele();
                } finally {
                  setIslemde(false);
                }
              }}
            >
              <Trash2 size={14} />
            </Buton>
          </div>
        ))}
      </div>
    </Kart>
  );
}

// ============================================================
// Öğrenciye not
// ============================================================

/**
 * Öğrenciye not.
 *
 * Notlar öğrencinin panelinde "Koçundan notlar" başlığıyla görünüyor; veliyle
 * paylaşım ayrı bir seçenek.
 */
function NotPaneli({ ogrenciId, kocId }: { ogrenciId: string; kocId: string }) {
  const qc = useQueryClient();
  const notSorgu = useQuery({ queryKey: ['notlar', ogrenciId], queryFn: () => notlar(ogrenciId) });
  const gorusmeler = useQuery({ queryKey: ['koc-gorusmeleri', kocId], queryFn: () => kocGorusmeleri(kocId) });

  // Not bir görüşmeye bağlanmazsa öğrenci ve veli ekranlarındaki görüşme
  // kartlarında görünmüyor; varsayılan olarak en son geçmiş görüşmeyi seçiyoruz.
  const gecmisler = useMemo(
    () =>
      (gorusmeler.data ?? [])
        .filter(
          (g) =>
            g.ogrenciId === ogrenciId &&
            (g.durum === 'tamamlandi' || (g.durum === 'planlandi' && g.baslangic <= new Date().toISOString())),
        )
        .sort((a, b) => b.baslangic.localeCompare(a.baslangic)),
    [gorusmeler.data, ogrenciId],
  );

  const [not, setNot] = useState('');
  const [gorusmeId, setGorusmeId] = useState('');
  const [veliylePaylas, setVeliylePaylas] = useState(true);
  const [islemde, setIslemde] = useState(false);

  useEffect(() => {
    setGorusmeId((mevcut) => mevcut || gecmisler[0]?.id || '');
  }, [gecmisler]);

  const kaydet = async () => {
    const temiz = not.trim();
    if (!temiz) return;
    setIslemde(true);
    try {
      await notEkle(ogrenciId, kocId, temiz, veliylePaylas, gorusmeId || null);
      setNot('');
      await qc.invalidateQueries({ queryKey: ['notlar', ogrenciId] });
      await qc.invalidateQueries({ queryKey: ['veli-raporu', ogrenciId] });
      await qc.invalidateQueries({ queryKey: ['gecmis-gorusmeler', ogrenciId] });
    } finally {
      setIslemde(false);
    }
  };

  return (
    <Kart style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <h3 style={{ fontSize: '1.05rem' }}>Öğrenciye not</h3>
        <span className="hint">öğrencinin panelinde görünür</span>
      </div>
      <textarea
        className="input"
        rows={4}
        value={not}
        onChange={(e) => setNot(e.target.value)}
        placeholder="Bu hafta neye odaklanmasını istiyorsun?"
        aria-label="Görüşme notu"
      />
      {gecmisler.length > 0 && (
        <Alan etiket="Hangi görüşmenin notu?" ipucu="Öğrenci ve veli, notu bu görüşmenin altında görüyor.">
          <select className="input" value={gorusmeId} onChange={(e) => setGorusmeId(e.target.value)}>
            <option value="">Görüşmeye bağlama</option>
            {gecmisler.slice(0, 10).map((g) => (
              <option key={g.id} value={g.id}>
                {tarihKisa(g.baslangic)} {gunAdi(g.baslangic).slice(0, 3)} {saat(g.baslangic)}
              </option>
            ))}
          </select>
        </Alan>
      )}
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '.82rem', cursor: 'pointer' }}>
          <input type="checkbox" checked={veliylePaylas} onChange={(e) => setVeliylePaylas(e.target.checked)} />
          Veliyle paylaş
        </label>
        <Buton boy="sm" style={{ marginLeft: 'auto' }} onClick={kaydet} disabled={islemde || !not.trim()}>
          Notu kaydet
        </Buton>
      </div>

      <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {notSorgu.data?.length ? (
          notSorgu.data.slice(0, 6).map((n) => (
            <div
              key={n.id}
              style={{
                background: 'var(--color-bg)',
                borderRadius: 12,
                padding: '12px 16px',
                display: 'flex',
                flexDirection: 'column',
                gap: 6,
                animation: 'riseIn .3s ease both',
              }}
            >
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <Rozet>{tarihKisa(n.tarih)}</Rozet>
                <span className="hint" style={{ fontSize: '.72rem', marginLeft: 'auto' }}>
                  {n.veliylePaylasildi ? 'veliyle paylaşıldı' : 'veliyle paylaşılmadı'}
                </span>
              </div>
              <p style={{ fontSize: '.88rem', lineHeight: 1.55 }}>{n.metin}</p>
              <span className="hint" style={{ fontSize: '.7rem' }}>
                {goreliZaman(n.tarih)}
              </span>
            </div>
          ))
        ) : (
          <p className="hint">Henüz not yok.</p>
        )}
      </div>
    </Kart>
  );
}
