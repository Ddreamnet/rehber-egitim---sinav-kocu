import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { StickyNote } from 'lucide-react';
import { Bar, Buton, Halka, Kart, Nokta, Rozet } from '@/components/ui/temel';
import { KompaktSayac } from '@/components/ui/Sayac';
import { DERS_RENKLERI, ogrenciProgrami } from '@/config/site';
import { gorusmeTuru, gunAdi, net as netBicim, sayi, saat, tarihBlogu, tarihKisa, yuzde } from '@/lib/format';
import { useOturum } from '@/auth/Oturum';
import { takvimeEkle } from '@/lib/takvim';
import {
  dersBazliOzet,
  girisSerisi,
  notlar,
  haftaPlani,
  haftalikSeri,
  mufredatOrani,
  ogrenciOturumu,
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
  const gunSerisi = useQuery({ queryKey: ['giris-serisi', ogrenciId], queryFn: () => girisSerisi(ogrenciId) });
  // Oturum listesinin ilki (TYT) yazılıyordu; LGS ve okul müfredatı
  // öğrencisinde başlık yanlış oturumun adını gösteriyordu.
  const oturum = useQuery({ queryKey: ['ogrenci-oturumu', ogrenciId], queryFn: () => ogrenciOturumu(ogrenciId) });
  const program = ogrenciProgrami(profil);
  const dersOzet = useQuery({ queryKey: ['ders-ozet', ogrenciId], queryFn: () => dersBazliOzet(ogrenciId) });
  const toplamSoru = (dersOzet.data ?? []).reduce((a, d) => a + d.toplam, 0);
  const toplamNet = (dersOzet.data ?? []).reduce((a, d) => a + d.net, 0);
  const notSorgu = useQuery({ queryKey: ['notlar', ogrenciId], queryFn: () => notlar(ogrenciId) });

  const bugunKalanlar = plan.data?.maddeler.filter((m) => m.bugun && !m.tamamlandi) ?? [];
  const bugunkuKonu = bugunKalanlar[0] ?? plan.data?.maddeler.find((m) => !m.tamamlandi);
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
            {/* Programda bugün birden fazla madde olabiliyor; "tek konu" sabit
                metni o durumda yanlış oluyordu. */}
            {/* Plan hiç yokken de "planı tamam" yazıyordu; alttaki açıklamayla
                çelişiyordu. Üç durum ayrıldı: madde var / hepsi bitti / plan yok. */}
            {bugunkuKonu ? (
              <>
                {bugunKalanlar.length > 1 ? `bugün ${bugunKalanlar.length} başlık var, ilki: ` : 'bugün tek konu: '}
                <span style={{ color: 'var(--color-primary)' }}>{bugunkuKonu.baslik}</span>.
              </>
            ) : plan.data?.maddeler.length ? (
              <>bu haftanın planı tamam.</>
            ) : (
              <>bu hafta için henüz plan yok.</>
            )}
          </h2>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '.95rem' }}>
            {plan.data?.maddeler.length
              ? kalan > 0
                ? `Bu haftanın planında ${kalan} madde kaldı; ${yuzde(plan.data.oran)} tamamlandı.`
                : 'Bu haftanın planındaki her madde tamam. İstersen ileri konulara geçebilirsin.'
              : 'Koçun bu hafta için henüz program göndermedi. Müfredattan çalışmaya devam edebilirsin.'}
          </p>
          <Buton style={{ alignSelf: 'flex-start' }} onClick={() => git('/panel/mufredat')}>
            Konuya devam et
          </Buton>
        </div>

        {/* Sınav adayına geri sayım, değilse kendi hedefi */}
        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
          {program.tur === 'sinav' ? (
            <KompaktSayac
              sinav={program.sinav}
              chipRenk={program.sinav === 'lgs' ? DERS_RENKLERI.fen : undefined}
            />
          ) : (
            <Kart style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: 20, minWidth: 240 }}>
              <div className="hint">Hedefin</div>
              <strong style={{ fontFamily: 'var(--font-heading)', fontSize: '1.05rem', lineHeight: 1.4 }}>
                {profil?.hedef?.trim() || 'Düzenli çalışma alışkanlığı'}
              </strong>
              <span className="hint">{program.ad} · geri sayım yok, tempo var</span>
            </Kart>
          )}
        </div>
      </div>

      {/* ---------- Üç kart ---------- */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: 24 }}>
        {/* Bu hafta */}
        <Kart style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <h3 style={{ fontSize: '1.05rem' }}>Bu hafta</h3>
            {plan.data?.maddeler.length ? (
              <Rozet ton="success" style={{ marginLeft: 'auto' }}>
                {yuzde(plan.data.oran)} tamam — {kalan} konu kaldı
              </Rozet>
            ) : (
              <Rozet style={{ marginLeft: 'auto' }}>plan bekleniyor</Rozet>
            )}
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
              {/* Koçun o maddeye yazdığı yönerge */}
              {m.not && (
                <p className="plan-notu">
                  <StickyNote size={13} aria-hidden="true" />
                  {m.not}
                </p>
              )}
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
                    {gorusme.data.kocAdi} ile · {gorusme.data.sureDk} dk · {gorusmeTuru(gorusme.data.tur)}
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
              <div className="eylem-satiri" style={{ display: 'flex', gap: 10, marginTop: 'auto', flexWrap: 'wrap' }}>
                <Buton boy="sm" onClick={() => takvimeEkle(gorusme.data!)}>
                  Takvime ekle
                </Buton>
                <Buton tip="ghost" boy="sm" onClick={() => git('/panel/gorusmeler')}>
                  Tüm görüşmeler
                </Buton>
              </div>
            </>
          ) : (
            <p className="hint">Planlanmış görüşme yok. Koçun yeni görüşme oluşturduğunda burada görünecek.</p>
          )}
        </Kart>

      </div>

      {/* ---------- İlerleme (tam genişlik) ---------- */}
      <Kart style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <h3 style={{ fontSize: '1.05rem' }}>İlerleme özeti</h3>
          <span className="hint">{oturum.data?.ad ?? ''} · başlangıçtan bugüne</span>
          <Buton tip="ghost" boy="sm" style={{ marginLeft: 'auto' }} onClick={() => git('/panel/ilerleme')}>
            Soru gir
          </Buton>
        </div>

        <div style={{ display: 'flex', gap: 24, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <Halka oran={oran.data ?? 0} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <span style={{ fontWeight: 600, fontSize: '.92rem' }}>Müfredat</span>
              <span className="hint">{yuzde(oran.data ?? 0)} tamamlandı</span>
            </div>
          </div>

          <div className="ozet-kutulari">
            <div className="stat-tile">
              <div className="deger">{sayi(toplamSoru)}</div>
              <div className="etiket">toplam soru</div>
            </div>
            <div className="stat-tile">
              <div className="deger">{netBicim(toplamNet)}</div>
              <div className="etiket">toplam net</div>
            </div>
            <div className="stat-tile">
              <div className="deger">{sonHafta ? sayi(sonHafta.cozulenSoru) : '—'}</div>
              <div className="etiket">bu hafta</div>
            </div>
            <div className="stat-tile">
              <div className="deger">{gunSerisi.data ?? 0} gün</div>
              <div className="etiket">seri</div>
            </div>
          </div>
        </div>
      </Kart>

      {/* Koçun öğrenciye yazdığı notlar */}
      <Kart style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <h3 style={{ fontSize: '1.05rem' }}>Koçundan notlar</h3>
          {(notSorgu.data?.length ?? 0) > 0 && <Rozet>{notSorgu.data?.length}</Rozet>}
          <Buton tip="ghost" boy="sm" style={{ marginLeft: 'auto' }} onClick={() => git('/panel/gorusmeler')}>
            Tümü
          </Buton>
        </div>
        {notSorgu.data?.length ? (
          notSorgu.data.slice(0, 4).map((n) => (
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
              </div>
              <p style={{ fontSize: '.92rem', lineHeight: 1.6 }}>{n.metin}</p>
            </div>
          ))
        ) : (
          <p className="hint">Koçun henüz not yazmadı. Görüşmelerden sonra notlar burada görünür.</p>
        )}
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
