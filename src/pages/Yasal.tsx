import { SiteSayfasi } from '@/components/layout/SiteKabugu';
import { ILETISIM, iletisimVar, MARKA, YASAL_GUNCELLEME } from '@/config/site';
import { useSayfaBilgisi } from '@/lib/sayfaBasligi';

const METINLER = {
  gizlilik: {
    baslik: 'Gizlilik Politikası',
    giris:
      `Bu politika, ${MARKA.tamAd} hizmetini kullandığında hangi verileri topladığımızı, neden topladığımızı ve nasıl sakladığımızı açıklar.`,
    bolumler: [
      {
        baslik: 'Topladığımız veriler',
        maddeler: [
          'Hesap bilgileri: ad soyad, e-posta, telefon, rol (öğrenci, veli, koç, admin).',
          'Çalışma verileri: konu ilerlemesi, doğru/yanlış/boş girişleri, deneme netleri, haftalık plan.',
          'Görüşme kayıtları: görüşme tarihi, süresi ve koçun yazdığı notlar.',
        ],
      },
      {
        baslik: 'Neden topluyoruz',
        maddeler: [
          'Haftalık planı kurmak ve ilerlemeni görünür kılmak için.',
          'Koçunun sana doğru konuyu önerebilmesi için.',
          'Velinin, koçun paylaşmayı seçtiği özeti görebilmesi için.',
        ],
      },
      {
        baslik: 'Kimler görebilir',
        maddeler: [
          'Öğrenci yalnızca kendi verisini görür.',
          'Koç yalnızca kendi öğrencilerinin verisini görür.',
          'Veli, bağlı olduğu öğrencinin özetini salt-okunur görür; koç notu yalnızca koç “veliyle paylaş” dediğinde görünür.',
          'Bu kurallar veritabanı seviyesinde satır bazlı güvenlik (RLS) ile uygulanır.',
        ],
      },
      {
        baslik: 'Saklama ve silme',
        maddeler: [
          'Verilerini hesabın aktif olduğu sürece saklarız.',
          'Hesabını kapatmak istediğinde verilerin 30 gün içinde silinir.',
          'Silme talebi için bize başvuru sayfasındaki iletişim bilgilerinden ulaşabilirsin.',
        ],
      },
    ],
  },
  kvkk: {
    baslik: 'KVKK Aydınlatma Metni',
    giris:
      '6698 sayılı Kişisel Verilerin Korunması Kanunu (KVKK) kapsamında veri sorumlusu sıfatıyla hazırlanmıştır.',
    bolumler: [
      {
        baslik: 'Veri sorumlusu',
        maddeler: [
          `${MARKA.tamAd} (${MARKA.alanAdi}), çevrimiçi sınav koçluğu hizmeti kapsamında kişisel verilerini veri sorumlusu sıfatıyla işler.`,
        ],
      },
      {
        baslik: 'İşleme amaçları',
        maddeler: [
          'Koçluk hizmetinin sunulması ve haftalık planın oluşturulması.',
          'Başvuru taleplerinin değerlendirilmesi ve ilk görüşmenin planlanması.',
          'Hizmet kalitesinin ölçülmesi ve iyileştirilmesi.',
        ],
      },
      {
        baslik: 'Hukuki sebep',
        maddeler: [
          'Sözleşmenin kurulması ve ifası (KVKK m.5/2-c).',
          'Meşru menfaat (KVKK m.5/2-f) — hizmet kalitesinin ölçülmesi.',
          '18 yaş altı öğrencilerde veli onayı esas alınır.',
        ],
      },
      {
        baslik: 'Hakların',
        maddeler: [
          'Kişisel verilerinin işlenip işlenmediğini öğrenme.',
          'İşlenmişse buna ilişkin bilgi talep etme.',
          'Eksik veya yanlış işlenmişse düzeltilmesini isteme.',
          'Silinmesini veya yok edilmesini isteme.',
          'Talepler en geç 30 gün içinde sonuçlandırılır.',
        ],
      },
    ],
  },
} as const;

export default function Yasal({ tur }: { tur: 'gizlilik' | 'kvkk' }) {
  const metin = METINLER[tur];

  useSayfaBilgisi({
    baslik: metin.baslik,
    aciklama: metin.giris,
    yol: tur === 'kvkk' ? '/kvkk' : '/gizlilik',
  });

  return (
    <SiteSayfasi>
      <main style={{ padding: '104px 0 96px' }}>
        <article
          className="article"
          style={{ width: 'min(720px,92vw)', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24 }}
        >
          <div className="kicker kicker-wide">Yasal</div>
          <h1 style={{ fontSize: 'clamp(1.9rem,4.4vw,2.6rem)', fontWeight: 700 }}>{metin.baslik}</h1>
          <p style={{ fontSize: '1.15rem', lineHeight: 1.7, color: 'var(--color-text-muted)' }}>{metin.giris}</p>

          {metin.bolumler.map((b) => (
            <section key={b.baslik} style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 8 }}>
              <h2 style={{ fontSize: '1.35rem' }}>{b.baslik}</h2>
              <ul style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingLeft: 20, margin: 0 }}>
                {b.maddeler.map((m) => (
                  <li key={m} style={{ lineHeight: 1.65 }}>
                    {m}
                  </li>
                ))}
              </ul>
            </section>
          ))}

          {iletisimVar() && (
            <section style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 8 }}>
              <h2 style={{ fontSize: '1.35rem' }}>Bize ulaşın</h2>
              <ul style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingLeft: 20, margin: 0 }}>
                {ILETISIM.unvan && <li style={{ lineHeight: 1.65 }}>{ILETISIM.unvan}</li>}
                {ILETISIM.eposta && (
                  <li style={{ lineHeight: 1.65 }}>
                    E-posta: <a href={`mailto:${ILETISIM.eposta}`}>{ILETISIM.eposta}</a>
                  </li>
                )}
                {ILETISIM.telefon && (
                  <li style={{ lineHeight: 1.65 }}>
                    Telefon: <a href={`tel:${ILETISIM.telefon.replace(/\s/g, '')}`}>{ILETISIM.telefon}</a>
                  </li>
                )}
                {ILETISIM.adres && <li style={{ lineHeight: 1.65 }}>{ILETISIM.adres}</li>}
                {ILETISIM.vergi && <li style={{ lineHeight: 1.65 }}>{ILETISIM.vergi}</li>}
              </ul>
            </section>
          )}

          <p className="hint" style={{ marginTop: 16 }}>
            Son güncelleme:{' '}
            {new Date(YASAL_GUNCELLEME).toLocaleDateString('tr-TR', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </p>
        </article>
      </main>
    </SiteSayfasi>
  );
}
