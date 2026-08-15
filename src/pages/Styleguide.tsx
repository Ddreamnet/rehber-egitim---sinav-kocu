import { useState } from 'react';
import { Info, Lock, Minus, Plus } from 'lucide-react';
import type { ReactNode } from 'react';
import { SiteSayfasi } from '@/components/layout/SiteKabugu';
import { Akordeon } from '@/components/ui/Akordeon';
import { SayacKarti } from '@/components/ui/Sayac';
import { SaatCizelgesi } from '@/components/ui/SaatCizelgesi';
import { DersDonutu, SoruNetGrafigi, Sparkline } from '@/components/grafik';
import {
  Alan,
  Anahtar,
  Avatar,
  Bar,
  Buton,
  Chip,
  Halka,
  Kart,
  Nokta,
  Rozet,
  Segment,
  Uyari,
  type ButonTipi,
} from '@/components/ui/temel';
import { DERS_RENKLERI } from '@/config/site';
import { BUGUN_AKISI, DERS_DAGILIMI, HAFTALIK_SERI } from '@/data/demo';

const PRIMITIF_RENKLER: Array<[string, string]> = [
  ['--brand-red-600', 'Primary'],
  ['--brand-red-700', 'Primary hover'],
  ['--brand-red-800', 'Primary active'],
  ['--brand-red-100', 'Primary soft'],
  ['--sage-600', 'Accent (zeytin)'],
  ['--sage-700', 'Accent strong'],
  ['--sage-100', 'Accent soft'],
  ['--sage-50', 'Zemin'],
];

const DERSLER: Array<[string, string]> = [
  ['--ders-turkce', 'Türkçe'],
  ['--ders-matematik', 'Matematik'],
  ['--ders-fen', 'Fen'],
  ['--ders-sosyal', 'Sosyal'],
  ['--ders-dil', 'Yabancı Dil'],
];

const DURUMLAR: Array<[string, string]> = [
  ['--color-success', 'success'],
  ['--color-urgent', 'warning / aciliyet'],
  ['--color-error', 'error'],
  ['--color-info', 'info'],
];

const BUTON_TIPLERI: ButonTipi[] = ['primary', 'secondary', 'outline', 'ghost', 'accent'];

export default function Styleguide() {
  const [seg, setSeg] = useState<'tyt' | 'ayt'>('tyt');
  const [anahtar, setAnahtar] = useState(true);
  const [net, setNet] = useState(23);

  return (
    <SiteSayfasi>
      <div className="container" style={{ padding: '104px 0 96px', display: 'flex', flexDirection: 'column', gap: 56 }}>
        <header style={{ display: 'flex', alignItems: 'flex-end', gap: 16, flexWrap: 'wrap' }}>
          <div>
            <div className="kicker kicker-wide">Dahili referans</div>
            <h1 style={{ fontSize: 'clamp(2rem,4.4vw,2.8rem)', marginTop: 8 }}>Tasarım sistemi</h1>
            <p style={{ color: 'var(--color-text-muted)', maxWidth: '56ch', lineHeight: 1.6, marginTop: 8 }}>
              Tüm değerler <code>src/styles/tokens.css</code> dosyasından gelir (primitive → semantic → component).
              Bileşenlerde hex yazılmaz; token değişince her ekran birlikte değişir. Uygulama tek temalıdır —
              koyu mod yoktur.
            </p>
          </div>
        </header>

        <Bolum baslik="Renk token'ları" aciklama="Semantic katman; bileşenler yalnızca bunlara bağlanır.">
          <RenkIzgarasi renkler={PRIMITIF_RENKLER} />
          <h3 style={{ fontSize: '1rem', marginTop: 8 }}>Ders renkleri (her yerde sabit)</h3>
          <RenkIzgarasi renkler={DERSLER} />
          <h3 style={{ fontSize: '1rem', marginTop: 8 }}>Durum renkleri</h3>
          <RenkIzgarasi renkler={DURUMLAR} />
        </Bolum>

        <Bolum baslik="Tipografi" aciklama="Başlık Poppins, gövde Inter. Gövde en fazla 65ch, sola yaslı.">
          <Kart style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '3rem', lineHeight: 1.1 }}>
              Display 3rem / 700
            </div>
            <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '2.25rem' }}>
              H1 2.25rem / 700
            </div>
            <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: '1.75rem' }}>
              H2 1.75rem / 600
            </div>
            <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: '1.375rem' }}>
              H3 1.375rem / 600
            </div>
            <p style={{ fontSize: '1.125rem', lineHeight: 1.6, maxWidth: '65ch' }}>
              Body L 1.125rem — Yanlış konuya harcanan her hafta, geri gelmeyen nettir.
            </p>
            <p style={{ maxWidth: '65ch' }}>Body 1rem — Koçunla haftalık planını kur, her hafta doğru yerden ilerle.</p>
            <p className="hint">Small 0.875rem — 20 dakika · kart bilgisi istemez</p>
          </Kart>
        </Bolum>

        <Bolum baslik="Buton" aciklama="5 varyant × 3 boyut × disabled. Metin eylemi söyler.">
          <Kart style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {BUTON_TIPLERI.map((t) => (
              <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                <span className="hint" style={{ width: 90 }}>
                  {t}
                </span>
                <Buton tip={t} boy="sm">
                  Küçük
                </Buton>
                <Buton tip={t}>Varsayılan</Buton>
                <Buton tip={t} boy="lg">
                  Büyük
                </Buton>
                <Buton tip={t} disabled>
                  Pasif
                </Buton>
              </div>
            ))}
          </Kart>
        </Bolum>

        <Bolum baslik="Kart, chip ve rozet">
          <div className="grid-auto">
            <Kart style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <h3 style={{ fontSize: '1.05rem' }}>Kart</h3>
              <p className="hint">Radius 20, yumuşak gölge, 24px iç boşluk.</p>
            </Kart>
            <Kart etkilesimli style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <h3 style={{ fontSize: '1.05rem' }}>Etkileşimli kart</h3>
              <p className="hint">Hover’da −3px yükselir, gölge büyür.</p>
            </Kart>
            <Kart style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
              <Chip>Chip</Chip>
              <Chip renk={DERS_RENKLERI.matematik}>Matematik</Chip>
              <Rozet>~3 soru</Rozet>
              <Rozet ton="success">Yolunda</Rozet>
              <Rozet ton="warning">tahmini</Rozet>
              <Rozet ton="error">Riskli</Rozet>
              <Rozet ton="info">Yeni</Rozet>
              <Avatar ad="Elif Kaya" renk={DERS_RENKLERI.turkce} />
            </Kart>
          </div>
        </Bolum>

        <Bolum baslik="Form" aciklama="Odakta 2px kırmızı ring; hata durumunda kenarlık ve yardım metni kırmızı.">
          <Kart style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))', gap: 20 }}>
            <Alan etiket="Metin alanı" ipucu="Yardımcı metin">
              <input className="input" placeholder="Konu ara…" />
            </Alan>
            <Alan etiket="Hatalı alan" hata="Telefon numaran eksik görünüyor.">
              <input className="input input-err" defaultValue="05" />
            </Alan>
            <Alan etiket="Seçim">
              <select className="input" defaultValue="koklu">
                <option value="koklu">Köklü Sayılar</option>
                <option value="paragraf">Paragrafta Anlam</option>
              </select>
            </Alan>
            <div className="field">
              <span style={{ fontSize: '.85rem', fontWeight: 600 }}>Segment</span>
              <Segment
                etiket="Oturum"
                deger={seg}
                degistir={setSeg}
                secenekler={[
                  { deger: 'tyt', etiket: 'TYT' },
                  { deger: 'ayt', etiket: 'AYT · Sayısal' },
                ]}
              />
            </div>
            <div className="field">
              <span style={{ fontSize: '.85rem', fontWeight: 600 }}>Onay kutusu</span>
              <label style={{ display: 'flex', gap: 10, alignItems: 'center', fontSize: '.9rem' }}>
                <input type="checkbox" defaultChecked /> Veliyle paylaş
              </label>
            </div>
            <div className="field">
              <span style={{ fontSize: '.85rem', fontWeight: 600 }}>Anahtar</span>
              <Anahtar acik={anahtar} degistir={setAnahtar} etiket="Bildirimler" />
            </div>
          </Kart>
        </Bolum>

        <Bolum baslik="Uyarı">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <Uyari tur="info" ikon={<Info size={18} />}>
              Sıralama karşılığı geçen yılın verisine göre <strong>tahmindir</strong>.
            </Uyari>
            <Uyari tur="success">Girişin kaydedildi.</Uyari>
            <Uyari tur="warning">Sınava 30 günden az kaldı.</Uyari>
            <Uyari tur="error">Bağlantı kurulamadı.</Uyari>
          </div>
        </Bolum>

        <Bolum baslik="Tablo">
          <Kart style={{ padding: '8px 24px 16px', overflowX: 'auto' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Öğrenci</th>
                  <th>Plan</th>
                  <th>Trend</th>
                  <th className="num">Son net</th>
                  <th>Durum</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <Avatar ad="Elif Kaya" renk={DERS_RENKLERI.turkce} boy="md" />
                      <strong>Elif Kaya</strong>
                    </div>
                  </td>
                  <td>
                    <Bar oran={0.66} style={{ width: 110 }} />
                  </td>
                  <td>
                    <Sparkline noktalar={[62, 63, 62.6, 65, 67, 68.4]} renk="var(--color-success)" />
                  </td>
                  <td className="num">68,4</td>
                  <td>
                    <Rozet ton="success">Yolunda</Rozet>
                  </td>
                </tr>
                <tr>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <Avatar ad="Can Koç" renk={DERS_RENKLERI.dil} boy="md" />
                      <strong>Can Koç</strong>
                    </div>
                  </td>
                  <td>
                    <Bar oran={0.12} renk="var(--color-error)" style={{ width: 110 }} />
                  </td>
                  <td>
                    <Sparkline noktalar={[55, 54, 52.5, 51, 49.6, 48.5]} renk="var(--color-error)" />
                  </td>
                  <td className="num">48,5</td>
                  <td>
                    <Rozet ton="error">Riskli</Rozet>
                  </td>
                </tr>
              </tbody>
            </table>
          </Kart>
        </Bolum>

        <Bolum baslik="Alana özgü bileşenler">
          <div className="grid-auto">
            <SayacKarti sinav="yks" />
            <Kart style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
              <Halka oran={0.38} />
              <div>
                <div style={{ fontWeight: 600, fontSize: '.92rem' }}>Ring progress</div>
                <p className="hint">Müfredat tamamlanma oranı</p>
              </div>
            </Kart>
            <Kart style={{ display: 'flex', gap: 10 }}>
              <div className="stat-tile">
                <div className="deger">214</div>
                <div className="etiket">soru / hafta</div>
              </div>
              <div className="stat-tile">
                <div className="deger">68,4</div>
                <div className="etiket">ort. net</div>
              </div>
              <div className="stat-tile">
                <div className="deger">12 gün</div>
                <div className="etiket">seri</div>
              </div>
            </Kart>
          </div>

          <Kart style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <h3 style={{ fontSize: '1.05rem' }}>Net Denge stepper</h3>
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
              <Nokta renk={DERS_RENKLERI.matematik} />
              <span style={{ fontWeight: 600, fontSize: '.92rem', width: 92 }}>Matematik</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Buton
                  tip="secondary"
                  style={{ width: 34, height: 34, padding: 0, borderRadius: 10 }}
                  onClick={() => setNet((n) => Math.max(0, n - 1))}
                  aria-label="Azalt"
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
                >
                  {net}
                </span>
                <Buton
                  tip="secondary"
                  style={{ width: 34, height: 34, padding: 0, borderRadius: 10 }}
                  onClick={() => setNet((n) => Math.min(40, n + 1))}
                  aria-label="Artır"
                >
                  <Plus size={14} strokeWidth={2.5} />
                </Buton>
                <span className="hint">/ 40</span>
              </div>
              <Bar oran={net / 40} renk={DERS_RENKLERI.matematik} className="hide-m" style={{ flex: 1, minWidth: 80 }} />
              <label className="badge" style={{ cursor: 'pointer', gap: 6, height: 28, marginLeft: 'auto' }}>
                <input type="checkbox" style={{ width: 14, height: 14 }} />
                <Lock size={12} /> sabitle
              </label>
            </div>
          </Kart>

          <Kart style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <h3 style={{ fontSize: '1.05rem' }}>Activity timeline</h3>
            <SaatCizelgesi bloklar={BUGUN_AKISI} />
          </Kart>

          <Akordeon
            varsayilanAcik
            ozet={
              <>
                <Nokta renk={DERS_RENKLERI.matematik} buyuk />
                <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: '1.02rem' }}>
                  Müfredat akordeonu
                </span>
                <Rozet>14/32 konu</Rozet>
                <Bar oran={0.44} className="hide-m" style={{ width: 120, marginLeft: 12 }} />
              </>
            }
          >
            <div style={{ borderTop: '1px solid var(--color-border)', padding: '14px 24px' }} className="hint">
              Konu satırları burada listelenir: durum ikonu, “~X soru” rozeti, çıkmış sorular ve ilerleme.
            </div>
          </Akordeon>
        </Bolum>

        <Bolum baslik="Grafikler" aciklama="Chart.js; renkler ders token'larından, ızgara açık, eksen muted.">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: 24 }}>
            <Kart style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <h3 style={{ fontSize: '1.05rem' }}>Bar + çizgi kombosu</h3>
              <SoruNetGrafigi seri={HAFTALIK_SERI} />
            </Kart>
            <Kart style={{ display: 'flex', gap: 20, alignItems: 'center', flexWrap: 'wrap' }}>
              <DersDonutu dagilim={DERS_DAGILIMI} />
              <div style={{ flex: 1, minWidth: 140, display: 'flex', flexDirection: 'column', gap: 8, fontSize: '.85rem' }}>
                {DERS_DAGILIMI.map((d) => (
                  <div key={d.ad} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ width: 10, height: 10, borderRadius: 3, background: d.renk }} />
                    {d.ad}
                    <span className="hint" style={{ marginLeft: 'auto' }}>
                      %{Math.round(d.oran * 100)}
                    </span>
                  </div>
                ))}
              </div>
            </Kart>
          </div>
        </Bolum>
      </div>
    </SiteSayfasi>
  );
}

function Bolum({ baslik, aciklama, children }: { baslik: string; aciklama?: string; children: ReactNode }) {
  return (
    <section style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <h2 style={{ fontSize: '1.6rem' }}>{baslik}</h2>
        {aciklama && (
          <p className="hint" style={{ marginTop: 6, maxWidth: '60ch', lineHeight: 1.55 }}>
            {aciklama}
          </p>
        )}
      </div>
      {children}
    </section>
  );
}

function RenkIzgarasi({ renkler }: { renkler: Array<[string, string]> }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(160px,1fr))', gap: 16 }}>
      {renkler.map(([token, etiket]) => (
        <Kart key={token} style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ height: 64, background: `var(${token})` }} />
          <div style={{ padding: '12px 14px' }}>
            <div style={{ fontSize: '.85rem', fontWeight: 600 }}>{etiket}</div>
            <code className="hint" style={{ fontSize: '.72rem' }}>
              {token}
            </code>
          </div>
        </Kart>
      ))}
    </div>
  );
}
