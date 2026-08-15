import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Check } from 'lucide-react';
import { Avatar, Bar, Buton, Kart, Rozet, BosDurum } from '@/components/ui/temel';
import { TabloKart } from '@/components/ui/TabloKart';
import { NetAlanGrafigi } from '@/components/grafik';
import { GunSayisi } from '@/components/ui/Sayac';
import { degisim, gunAdi, net as netBicim, saat, tarihBlogu, tarihKisa, tarihUzun, yuzde } from '@/lib/format';
import { useOturum } from '@/auth/Oturum';
import { cocugum, denemeler, dersIlerlemesi, haftaPlani, sonrakiGorusme, veliRaporu } from '@/data/repo';

export default function VeliOzet() {
  const { profil } = useOturum();
  const git = useNavigate();
  const veliId = profil?.id ?? '';

  const bag = useQuery({ queryKey: ['cocugum', veliId], queryFn: () => cocugum(veliId) });
  const ogrenciId = bag.data?.ogrenci.id ?? '';
  const etkin = Boolean(ogrenciId);

  const plan = useQuery({ queryKey: ['plan', ogrenciId], queryFn: () => haftaPlani(ogrenciId), enabled: etkin });
  const denemeSorgu = useQuery({ queryKey: ['denemeler', ogrenciId], queryFn: () => denemeler(ogrenciId), enabled: etkin });
  const gorusme = useQuery({ queryKey: ['sonraki-gorusme', ogrenciId], queryFn: () => sonrakiGorusme(ogrenciId), enabled: etkin });
  const rapor = useQuery({ queryKey: ['veli-raporu', ogrenciId], queryFn: () => veliRaporu(ogrenciId), enabled: etkin });
  const dersler = useQuery({ queryKey: ['ders-ilerlemesi', ogrenciId], queryFn: () => dersIlerlemesi(ogrenciId), enabled: etkin });

  if (!bag.data) {
    return (
      <Kart>
        <BosDurum
          baslik="Bağlı öğrenci bulunamadı"
          aciklama="Hesabın henüz bir öğrenciye bağlanmamış. Koçunla iletişime geçebilirsin."
        />
      </Kart>
    );
  }

  const cocuk = bag.data.ogrenci;
  const tamDetay = bag.data.detaySeviyesi === 'tam';
  const sonDeneme = denemeSorgu.data?.[denemeSorgu.data.length - 1];
  const ayBasi = Date.now() - 30 * 86400000;
  const ayBasiNet = denemeSorgu.data?.find((d) => new Date(d.tarih).getTime() >= ayBasi)?.net;
  const ayDegisimi = sonDeneme && ayBasiNet !== undefined ? sonDeneme.net - ayBasiNet : null;

  return (
    <>
      {/* Çocuk kimlik kartı */}
      <Kart style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
        <Avatar ad={cocuk.adSoyad} renk={cocuk.avatarRengi} boy="lg" />
        <div>
          <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '1.1rem' }}>{cocuk.adSoyad}</div>
          <div className="hint">
            {[cocuk.sinif, cocuk.hedefAlan && `YKS ${cocuk.hedefAlan}`, `Koç: ${bag.data.kocAdi}`]
              .filter(Boolean)
              .join(' · ')}
          </div>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'baseline', gap: 8 }}>
          <span
            style={{
              fontFamily: 'var(--font-heading)',
              fontWeight: 700,
              fontSize: '1.9rem',
              color: 'var(--color-primary)',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            <GunSayisi sinav="yks" />
          </span>
          <span className="hint">gün kaldı · YKS 2027</span>
        </div>
      </Kart>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: 24 }}>
        {/* Haftalık plan */}
        <Kart style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <h3 style={{ fontSize: '1.05rem' }}>Bu haftanın planı</h3>
            <Rozet ton="success" style={{ marginLeft: 'auto' }}>
              {yuzde(plan.data?.oran ?? 0)} — {plan.data?.maddeler.filter((m) => !m.tamamlandi).length ?? 0} konu kaldı
            </Rozet>
          </div>
          <Bar oran={plan.data?.oran ?? 0} />
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
                  <strong>{m.baslik}{m.bugun ? ' — bugün' : ''}</strong>
                )}
                {m.dersAdi && (
                  <Rozet renk={m.renk} style={{ marginLeft: 'auto' }}>
                    {m.dersAdi}
                  </Rozet>
                )}
              </div>
            ))}
          </div>
        </Kart>

        {/* Net gelişimi */}
        <Kart style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
            <h3 style={{ fontSize: '1.05rem' }}>Net gelişimi</h3>
            <span className="hint" style={{ marginLeft: 'auto' }}>
              son {denemeSorgu.data?.length ?? 0} deneme
            </span>
          </div>
          {denemeSorgu.data && denemeSorgu.data.length > 1 ? (
            <>
              <NetAlanGrafigi denemeler={denemeSorgu.data.slice(-6)} />
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '1.2rem' }}>
                  {sonDeneme ? `${netBicim(sonDeneme.net)} net` : '—'}
                </span>
                {ayDegisimi !== null && (
                  <Rozet ton={ayDegisimi >= 0 ? 'success' : 'error'}>{degisim(ayDegisimi)} bu ay</Rozet>
                )}
              </div>
            </>
          ) : (
            <p className="hint">Henüz yeterli deneme yok.</p>
          )}
        </Kart>

        {/* Sonraki görüşme */}
        <Kart style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <h3 style={{ fontSize: '1.05rem' }}>Sonraki görüşme</h3>
          {gorusme.data ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div className="date-block date-block-sm">
                <span className="gun">{tarihBlogu(gorusme.data.baslangic).gun}</span>
                <span className="ay">{tarihBlogu(gorusme.data.baslangic).ay}</span>
              </div>
              <div>
                <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: '.95rem' }}>
                  {gunAdi(gorusme.data.baslangic)} · {saat(gorusme.data.baslangic)}
                </div>
                <div className="hint">
                  {cocuk.adSoyad.split(' ')[0]} + {gorusme.data.kocAdi} · {gorusme.data.sureDk} dk
                </div>
              </div>
            </div>
          ) : (
            <p className="hint">Planlanmış görüşme yok.</p>
          )}
          <p className="hint" style={{ lineHeight: 1.55 }}>
            Görüşme öğrenciyle yapılır; özet rapor görüşme sonrası burada yayınlanır.
          </p>
          <Buton
            tip="secondary"
            boy="sm"
            style={{ alignSelf: 'flex-start' }}
            onClick={() => git('/veli/gorusmeler')}
          >
            Koça mesaj bırak
          </Buton>
        </Kart>
      </div>

      {/* Koçun haftalık raporu — yalnızca koç paylaştıysa */}
      {rapor.data && (
        <Kart style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <h3 style={{ fontSize: '1.05rem' }}>Koçun haftalık raporu</h3>
            <span className="hint">{tarihUzun(rapor.data.tarih).replace(/ \d{4}$/, '')}</span>
            <Rozet style={{ marginLeft: 'auto' }}>Detay seviyesini koç belirler</Rozet>
          </div>
          <p style={{ lineHeight: 1.65, fontSize: '.95rem', maxWidth: '70ch' }}>{rapor.data.metin}</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Avatar ad={rapor.data.kocAdi} renk="var(--ders-fen)" boy="md" />
            <span style={{ fontSize: '.85rem', fontWeight: 600 }}>{rapor.data.kocAdi}</span>
            <span className="hint">Koç</span>
          </div>
        </Kart>
      )}

      {/* Detay bölümü — koçun açtığı detay seviyesine bağlı */}
      {tamDetay && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: 24 }}>
          <Kart style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <h3 style={{ fontSize: '1.05rem' }}>Ders bazlı ilerleme</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: '.88rem' }}>
              {dersler.data?.map((d) => (
                <div key={d.ad} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ width: 82, fontWeight: 600 }}>{d.ad}</span>
                  <Bar oran={d.oran} renk={d.renk} style={{ flex: 1 }} />
                  <span className="hint" style={{ width: 36, textAlign: 'right' }}>
                    {yuzde(d.oran)}
                  </span>
                </div>
              ))}
            </div>
          </Kart>

          <TabloKart style={{ paddingBottom: 12 }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Deneme</th>
                  <th>Tarih</th>
                  <th className="num">Net</th>
                  <th className="num">Değişim</th>
                </tr>
              </thead>
              <tbody>
                {[...(denemeSorgu.data ?? [])].reverse().slice(0, 6).map((d) => (
                  <tr key={d.id}>
                    <td style={{ fontWeight: 600 }}>{d.ad}</td>
                    <td className="hint">{tarihKisa(d.tarih)}</td>
                    <td className="num">{netBicim(d.net)}</td>
                    <td
                      className="num"
                      style={{
                        color:
                          d.degisim === null
                            ? 'var(--color-text-muted)'
                            : d.degisim >= 0
                              ? 'var(--color-success-deep)'
                              : 'var(--color-error-deep)',
                      }}
                    >
                      {d.degisim === null ? '—' : degisim(d.degisim)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TabloKart>
        </div>
      )}
    </>
  );
}
