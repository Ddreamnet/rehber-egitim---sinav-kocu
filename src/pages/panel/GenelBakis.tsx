import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Bar, Buton, Halka, Kart, Nokta, Rozet } from '@/components/ui/temel';
import { KompaktSayac } from '@/components/ui/Sayac';
import { SaatCizelgesi } from '@/components/ui/SaatCizelgesi';
import { DERS_RENKLERI } from '@/config/site';
import { gunAdi, net as netBicim, sayi, saat, tarihBlogu, tarihUzun, yuzde } from '@/lib/format';
import { useOturum } from '@/auth/Oturum';
import {
  bugununAkisi,
  girisSerisi,
  haftaPlani,
  haftalikSeri,
  mufredatOrani,
  planMaddesiIsaretle,
  sonrakiGorusme,
} from '@/data/repo';
import type { HaftalikPlan } from '@/data/tipler';

export default function GenelBakis() {
  const { profil } = useOturum();
  const git = useNavigate();
  const qc = useQueryClient();
  const ogrenciId = profil?.id ?? '';

  const plan = useQuery({ queryKey: ['plan', ogrenciId], queryFn: () => haftaPlani(ogrenciId) });
  const gorusme = useQuery({ queryKey: ['sonraki-gorusme', ogrenciId], queryFn: () => sonrakiGorusme(ogrenciId) });
  const oran = useQuery({ queryKey: ['mufredat-orani', ogrenciId], queryFn: () => mufredatOrani(ogrenciId) });
  const seri = useQuery({ queryKey: ['haftalik-seri', ogrenciId], queryFn: () => haftalikSeri(ogrenciId) });
  const akis = useQuery({ queryKey: ['bugun-akis', ogrenciId], queryFn: () => bugununAkisi(ogrenciId) });
  const gunSerisi = useQuery({ queryKey: ['giris-serisi', ogrenciId], queryFn: () => girisSerisi(ogrenciId) });

  const bugunkuKonu = plan.data?.maddeler.find((m) => m.bugun && !m.tamamlandi) ?? plan.data?.maddeler.find((m) => !m.tamamlandi);
  const kalan = plan.data ? plan.data.maddeler.filter((m) => !m.tamamlandi).length : 0;
  const sonHafta = seri.data?.[seri.data.length - 1];

  /** İyimser güncelleme: kutu anında dolar, yazma arkada tamamlanır. */
  const isaretle = async (id: string, deger: boolean) => {
    const anahtar = ['plan', ogrenciId];
    const onceki = qc.getQueryData<HaftalikPlan | null>(anahtar);

    qc.setQueryData<HaftalikPlan | null>(anahtar, (mevcut) => {
      if (!mevcut) return mevcut;
      const maddeler = mevcut.maddeler.map((m) => (m.id === id ? { ...m, tamamlandi: deger } : m));
      return { ...mevcut, maddeler, oran: maddeler.filter((m) => m.tamamlandi).length / maddeler.length };
    });

    try {
      await planMaddesiIsaretle(id, deger);
      await qc.invalidateQueries({ queryKey: anahtar });
    } catch {
      qc.setQueryData(anahtar, onceki); // yazma başarısızsa geri al
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* ---------- Selamlama + sayaçlar ---------- */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))',
          gap: 24,
          alignItems: 'center',
          padding: '6px 4px 2px',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <h2 style={{ fontSize: 'clamp(1.6rem,3vw,2.2rem)', maxWidth: '20ch', lineHeight: 1.22 }}>
            Merhaba {profil?.adSoyad.split(' ')[0]} 👋
            <br />
            {bugunkuKonu ? (
              <>
                bugün tek konu: <span style={{ color: 'var(--color-primary)' }}>{bugunkuKonu.baslik}</span>.
              </>
            ) : (
              <>bu haftanın planı tamam.</>
            )}
          </h2>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '.95rem' }}>
            Geçen görüşmede bu haftayı eksik kapamaya ayırmıştık. Plan yolunda.
          </p>
          <Buton style={{ alignSelf: 'flex-start' }} onClick={() => git('/panel/mufredat')}>
            Konuya devam et
          </Buton>
        </div>

        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
          <KompaktSayac sinav="yks" />
          <KompaktSayac sinav="lgs" chipRenk={DERS_RENKLERI.fen} />
        </div>
      </div>

      {/* ---------- Üç kart ---------- */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: 24 }}>
        {/* Bu hafta */}
        <Kart style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <h3 style={{ fontSize: '1.05rem' }}>Bu hafta</h3>
            <Rozet ton="success" style={{ marginLeft: 'auto' }}>
              {yuzde(plan.data?.oran ?? 0)} tamam — {kalan} konu kaldı
            </Rozet>
          </div>
          <Bar oran={plan.data?.oran ?? 0} />
          {plan.data?.maddeler.map((m) => (
            <label
              key={m.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                background: m.bugun && !m.tamamlandi ? 'var(--color-primary-soft)' : 'var(--color-bg)',
                borderRadius: 12,
                padding: '12px 14px',
                cursor: 'pointer',
              }}
            >
              <input type="checkbox" checked={m.tamamlandi} onChange={(e) => isaretle(m.id, e.target.checked)} />
              <Nokta renk={m.renk} />
              <span
                style={{
                  fontSize: '.92rem',
                  fontWeight: 600,
                  textDecoration: m.tamamlandi ? 'line-through' : undefined,
                  color: m.tamamlandi ? 'var(--color-text-muted)' : undefined,
                }}
              >
                {m.baslik}
              </span>
              <Rozet
                style={{
                  marginLeft: 'auto',
                  ...(m.bugun && !m.tamamlandi ? { background: 'var(--color-surface)' } : {}),
                }}
              >
                {m.soruOrtalamasi ? `~${m.soruOrtalamasi} soru` : 'plan'}
                {m.bugun && !m.tamamlandi ? ' · bugün' : ''}
              </Rozet>
            </label>
          ))}
        </Kart>

        {/* Sonraki görüşme */}
        <Kart style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <h3 style={{ fontSize: '1.05rem' }}>Sonraki görüşme</h3>
          {gorusme.data ? (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <TarihBlogu tarih={gorusme.data.baslangic} />
                <div>
                  <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 600 }}>
                    {gunAdi(gorusme.data.baslangic)} · {saat(gorusme.data.baslangic)}
                  </div>
                  <div className="hint">
                    {gorusme.data.kocAdi} ile · {gorusme.data.sureDk} dk · {gorusme.data.tur}
                  </div>
                </div>
              </div>
              {gorusme.data.gundem.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <span className="hint" style={{ fontWeight: 600 }}>
                    Konuşacaklarınız
                  </span>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {gorusme.data.gundem.map((g, i) => (
                      <Rozet key={g} renk={i === 0 ? DERS_RENKLERI.matematik : undefined}>
                        {g}
                      </Rozet>
                    ))}
                  </div>
                </div>
              )}
              <div style={{ display: 'flex', gap: 10, marginTop: 'auto' }}>
                <Buton boy="sm" onClick={() => takvimeEkle(gorusme.data!)}>
                  Takvime ekle
                </Buton>
                <Buton tip="ghost" boy="sm" onClick={() => git('/panel/gorusmeler')}>
                  Yeniden planla
                </Buton>
              </div>
            </>
          ) : (
            <p className="hint">Planlanmış görüşme yok. Koçun yeni görüşme oluşturduğunda burada görünecek.</p>
          )}
        </Kart>

        {/* İlerleme özeti */}
        <Kart style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h3 style={{ fontSize: '1.05rem' }}>İlerleme özeti</h3>
            <Buton tip="ghost" boy="sm" style={{ marginLeft: 'auto' }} onClick={() => git('/panel/ilerleme')}>
              Detay
            </Buton>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
            <Halka oran={oran.data ?? 0} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div style={{ fontWeight: 600, fontSize: '.92rem' }}>TYT müfredatı</div>
              <p className="hint" style={{ lineHeight: 1.5 }}>
                Sayısal hedefi için bu tempoda Nisan’da biter — planın önündesin.
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <div className="stat-tile">
              <div className="deger">{sonHafta ? sayi(sonHafta.cozulenSoru) : '—'}</div>
              <div className="etiket">soru / hafta</div>
            </div>
            <div className="stat-tile">
              <div className="deger">{sonHafta ? netBicim(sonHafta.ortalamaNet) : '—'}</div>
              <div className="etiket">ort. net</div>
            </div>
            <div className="stat-tile">
              <div className="deger">{gunSerisi.data ?? 0} gün</div>
              <div className="etiket">seri</div>
            </div>
          </div>
        </Kart>
      </div>

      {/* ---------- Bugünün akışı ---------- */}
      <Kart style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <h3 style={{ fontSize: '1.05rem' }}>Bugünün akışı</h3>
          <span className="hint" style={{ marginLeft: 'auto' }}>
            {gunAdi(new Date())} · {tarihUzun(new Date()).replace(/ \d{4}$/, '')}
          </span>
        </div>
        <SaatCizelgesi bloklar={akis.data ?? []} />
      </Kart>
    </div>
  );
}

function TarihBlogu({ tarih, boy }: { tarih: string; boy?: 'lg' | 'sm' }) {
  const t = tarihBlogu(tarih);
  return (
    <div className={['date-block', boy === 'lg' ? 'date-block-lg' : boy === 'sm' ? 'date-block-sm' : ''].join(' ')}>
      <span className="gun">{t.gun}</span>
      <span className="ay">{t.ay}</span>
    </div>
  );
}

/** Görüşmeyi .ics olarak indirir — takvim uygulamasına eklenir. */
function takvimeEkle(g: { baslangic: string; sureDk: number; kocAdi: string }) {
  const bas = new Date(g.baslangic);
  const bit = new Date(bas.getTime() + g.sureDk * 60000);
  const bicim = (d: Date) => d.toISOString().replace(/[-:]|\.\d{3}/g, '');
  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Rehber Egitim Sinav Kocu//TR',
    'BEGIN:VEVENT',
    `UID:${crypto.randomUUID()}`,
    `DTSTAMP:${bicim(new Date())}`,
    `DTSTART:${bicim(bas)}`,
    `DTEND:${bicim(bit)}`,
    `SUMMARY:Koç görüşmesi — ${g.kocAdi}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');

  const url = URL.createObjectURL(new Blob([ics], { type: 'text/calendar' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = 'rehber-gorusme.ics';
  a.click();
  URL.revokeObjectURL(url);
}
