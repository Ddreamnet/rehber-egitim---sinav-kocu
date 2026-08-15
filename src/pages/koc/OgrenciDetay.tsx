import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Check } from 'lucide-react';
import { Avatar, Bar, Buton, Halka, Kart, Rozet, BosDurum } from '@/components/ui/temel';
import { degisim, goreliZaman, net as netBicim, sayi, tarihKisa, yuzde } from '@/lib/format';
import { useOturum } from '@/auth/Oturum';
import {
  atanabilirKonular,
  denemeler,
  dersIlerlemesi,
  haftaPlani,
  haftalikSeri,
  konuAta,
  notEkle,
  notlar,
  ogrencilerim,
  sonrakiGorusme,
} from '@/data/repo';

/** Gelecek haftanın pazartesi tarihi (YYYY-MM-DD). */
function gelecekPazartesi(): string {
  const d = new Date();
  const gun = d.getDay() || 7; // pazar = 7
  d.setDate(d.getDate() + (8 - gun));
  return d.toISOString().slice(0, 10);
}

export default function KocOgrenciDetay() {
  const { ogrenciId = '' } = useParams();
  const { profil } = useOturum();
  const kocId = profil?.id ?? '';
  const qc = useQueryClient();

  const ogrenciler = useQuery({ queryKey: ['ogrencilerim', kocId], queryFn: () => ogrencilerim(kocId) });
  const ogrenci = ogrenciler.data?.find((o) => o.id === ogrenciId);

  const plan = useQuery({ queryKey: ['plan', ogrenciId], queryFn: () => haftaPlani(ogrenciId) });
  const dersler = useQuery({ queryKey: ['ders-ilerlemesi', ogrenciId], queryFn: () => dersIlerlemesi(ogrenciId) });
  const onerilenKonular = useQuery({
    queryKey: ['atanabilir-konular', ogrenciId],
    queryFn: () => atanabilirKonular(ogrenciId),
  });

  // Halka, ders barlarının ortalamasıdır — ayrı bir müfredat sorgusu gerekmez.
  const oranDegeri = dersler.data?.length
    ? dersler.data.reduce((a, d) => a + d.oran, 0) / dersler.data.length
    : 0;
  const seri = useQuery({ queryKey: ['haftalik-seri', ogrenciId], queryFn: () => haftalikSeri(ogrenciId) });
  const denemeSorgu = useQuery({ queryKey: ['denemeler', ogrenciId], queryFn: () => denemeler(ogrenciId) });
  const notSorgu = useQuery({ queryKey: ['notlar', ogrenciId], queryFn: () => notlar(ogrenciId) });
  const sonraki = useQuery({ queryKey: ['sonraki-gorusme', ogrenciId], queryFn: () => sonrakiGorusme(ogrenciId) });
  const sonrakiGorusmeUrl = sonraki.data?.katilimUrl ?? null;

  const [secili, setSecili] = useState<string[]>([]);
  const [not, setNot] = useState('');
  const [veliylePaylas, setVeliylePaylas] = useState(true);
  const [islemde, setIslemde] = useState(false);

  const sonDeneme = denemeSorgu.data?.[denemeSorgu.data.length - 1];
  const aylikDegisim = denemeSorgu.data && denemeSorgu.data.length > 1 ? (sonDeneme?.degisim ?? 0) : 0;
  const sonHafta = seri.data?.[seri.data.length - 1];

  const planiGonder = async () => {
    if (!secili.length) return;
    setIslemde(true);
    try {
      const maddeler = (onerilenKonular.data ?? [])
        .filter((o) => secili.includes(o.id))
        .map((o) => ({ baslik: o.ad, konuId: o.id }));
      await konuAta(ogrenciId, kocId, gelecekPazartesi(), maddeler);
      setSecili([]);
      await qc.invalidateQueries({ queryKey: ['plan', ogrenciId] });
    } finally {
      setIslemde(false);
    }
  };

  const notuKaydet = async () => {
    const temiz = not.trim();
    if (!temiz) return;
    setIslemde(true);
    try {
      await notEkle(ogrenciId, kocId, temiz, veliylePaylas);
      setNot('');
      await qc.invalidateQueries({ queryKey: ['notlar', ogrenciId] });
    } finally {
      setIslemde(false);
    }
  };

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
        <Avatar ad={ogrenci.adSoyad} renk={ogrenci.avatarRengi} boy="lg" />
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
        <Buton
          boy="sm"
          style={{ marginLeft: 'auto' }}
          disabled={!sonrakiGorusmeUrl}
          title={sonrakiGorusmeUrl ? 'Planlanmış görüşmeyi aç' : 'Planlanmış görüşme bağlantısı yok'}
          onClick={() => sonrakiGorusmeUrl && window.open(sonrakiGorusmeUrl, '_blank', 'noopener')}
        >
          Görüşme başlat
        </Buton>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: 24 }}>
        {/* Haftalık plan + atama */}
        <Kart style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h3 style={{ fontSize: '1.05rem' }}>Bu haftanın planı</h3>
            <Rozet ton="success" style={{ marginLeft: 'auto' }}>
              {yuzde(plan.data?.oran ?? 0)}
            </Rozet>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: '.9rem' }}>
            {plan.data?.maddeler.map((m) => (
              <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {m.tamamlandi ? (
                  <Check size={15} strokeWidth={2.5} color="var(--color-success)" />
                ) : (
                  <span style={{ width: 15, textAlign: 'center', color: 'var(--color-primary)', fontWeight: 700 }}>•</span>
                )}
                {m.tamamlandi ? (
                  <span style={{ color: 'var(--color-text-muted)' }}>{m.baslik}</span>
                ) : (
                  <>
                    <strong>{m.baslik}</strong>
                    <span className="hint" style={{ marginLeft: 'auto' }}>
                      devam
                    </span>
                  </>
                )}
              </div>
            ))}
          </div>

          <div
            style={{
              borderTop: '1px solid var(--color-border)',
              paddingTop: 14,
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
            }}
          >
            <span style={{ fontSize: '.85rem', fontWeight: 600 }}>Gelecek haftaya ata</span>
            {!onerilenKonular.data?.length && (
              <span className="hint">Atanabilecek açık konu kalmadı.</span>
            )}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {(onerilenKonular.data ?? []).map((o) => {
                const acik = secili.includes(o.id);
                return (
                  <button
                    key={o.id}
                    type="button"
                    className="chip"
                    style={{
                      cursor: 'pointer',
                      border: acik ? '1.5px solid var(--color-primary)' : '1.5px solid transparent',
                      background: o.renk,
                      color: 'var(--on-pastel)',
                    }}
                    aria-pressed={acik}
                    onClick={() =>
                      setSecili((s) => (s.includes(o.id) ? s.filter((x) => x !== o.id) : [...s, o.id]))
                    }
                  >
                    {acik ? '✓' : '+'} {o.ad}
                  </button>
                );
              })}
            </div>
            <Buton
              tip="secondary"
              boy="sm"
              style={{ alignSelf: 'flex-start' }}
              onClick={planiGonder}
              disabled={islemde || !secili.length}
            >
              Planı gönder
            </Buton>
          </div>
        </Kart>

        {/* İlerleme */}
        <Kart style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <h3 style={{ fontSize: '1.05rem' }}>İlerleme</h3>
          <div style={{ display: 'flex', gap: 18, alignItems: 'center' }}>
            <Halka oran={oranDegeri} boyut={88} />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10, fontSize: '.85rem' }}>
              {dersler.data?.map((d) => (
                <div key={d.ad} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ width: 70 }} className="hint">
                    {d.ad}
                  </span>
                  <Bar oran={d.oran} renk={d.renk} style={{ flex: 1 }} />
                </div>
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <div className="stat-tile">
              <div className="deger">{sonDeneme ? netBicim(sonDeneme.net) : '—'}</div>
              <div className="etiket">son net</div>
            </div>
            <div className="stat-tile">
              <div className="deger" style={{ color: aylikDegisim >= 0 ? 'var(--color-success-deep)' : 'var(--color-error-deep)' }}>
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

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: 24 }}>
        {/* Görüşme notu */}
        <Kart style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <h3 style={{ fontSize: '1.05rem' }}>Görüşme notu yaz</h3>
          <textarea
            className="input"
            rows={4}
            value={not}
            onChange={(e) => setNot(e.target.value)}
            placeholder="Bugünkü görüşmede…"
            aria-label="Görüşme notu"
          />
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '.82rem', cursor: 'pointer' }}>
              <input
                type="checkbox"
                style={{ width: 15, height: 15 }}
                checked={veliylePaylas}
                onChange={(e) => setVeliylePaylas(e.target.checked)}
              />
              Veliyle paylaş
            </label>
            <Buton boy="sm" style={{ marginLeft: 'auto' }} onClick={notuKaydet} disabled={islemde || !not.trim()}>
              Notu kaydet
            </Buton>
          </div>
        </Kart>

        {/* Geçmiş notlar */}
        <Kart style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <h3 style={{ fontSize: '1.05rem' }}>Geçmiş notlar</h3>
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
                  animation: 'riseIn .3s ease both',
                }}
              >
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <Rozet>{tarihKisa(n.tarih)}</Rozet>
                  <span className="hint" style={{ fontSize: '.72rem', marginLeft: 'auto' }}>
                    {n.veliylePaylasildi ? 'veliyle paylaşıldı' : 'yalnız koç'}
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
        </Kart>
      </div>
    </div>
  );
}
