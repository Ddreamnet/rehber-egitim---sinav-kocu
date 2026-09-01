/**
 * Rota başına sayfa başlığı, açıklaması ve canonical adresi.
 *
 * Bütün etiketler `index.html`de sabitti: on dört sayfanın hepsi aynı başlığı
 * taşıyor ve hepsi canonical olarak ANA SAYFAYI gösteriyordu. Bu, arama
 * motoruna "blog yazılarım ana sayfanın kopyası" demek anlamına geliyor ve
 * yazıların ayrı sayfa olarak indekslenmesini engelliyordu.
 *
 * SSR gerekmez: Google istemci tarafında güncellenen meta etiketlerini okuyor.
 */

import { useEffect } from 'react';
import { MARKA } from '@/config/site';

const VARSAYILAN_ACIKLAMA =
  'Rehber Eğitim & Sınav Koçu: YKS ve LGS için birebir online koçluk. Haftada bir koç görüşmesi, her gün konu ve soru takibi, Net Denge hesaplayıcı.';

/** Paylaşım görseli — WhatsApp/Instagram önizlemelerinde görünen kart. */
export const PAYLASIM_GORSELI = `${MARKA.site}/og-kapak.png`;

function etiketYaz(secici: string, nitelik: 'name' | 'property', ad: string, icerik: string) {
  let el = document.head.querySelector<HTMLMetaElement>(secici);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(nitelik, ad);
    document.head.appendChild(el);
  }
  el.setAttribute('content', icerik);
}

function baglantiYaz(rel: string, href: string) {
  let el = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', rel);
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
}

export interface SayfaBilgisi {
  /** Sekmede ve arama sonucunda görünen başlık. Marka adı sonuna eklenir. */
  baslik?: string;
  aciklama?: string;
  /** Varsayılan olarak o anki yol kullanılır. */
  yol?: string;
  gorsel?: string;
  /** Blog yazılarında 'article' */
  tur?: 'website' | 'article';
  /** Yükleniyor durumunda etiketleri yazma — yarım başlık basılmasın. */
  hazir?: boolean;
}

/**
 * Sayfa meta etiketlerini yazar.
 *
 * `hazir` false verilirse (veri henüz gelmediyse) etiketlere dokunulmaz;
 * böylece blog yazısında bir an "undefined" başlık görünmez.
 */
export function useSayfaBilgisi({
  baslik,
  aciklama = VARSAYILAN_ACIKLAMA,
  yol,
  gorsel = PAYLASIM_GORSELI,
  tur = 'website',
  hazir = true,
}: SayfaBilgisi) {
  useEffect(() => {
    if (!hazir) return;

    const tamBaslik = baslik ? `${baslik} — ${MARKA.tamAd}` : `${MARKA.tamAd} — YKS ve LGS koçluğu`;
    const adres = `${MARKA.site}${yol ?? window.location.pathname}`;

    document.title = tamBaslik;
    etiketYaz('meta[name="description"]', 'name', 'description', aciklama);
    baglantiYaz('canonical', adres);

    etiketYaz('meta[property="og:title"]', 'property', 'og:title', tamBaslik);
    etiketYaz('meta[property="og:description"]', 'property', 'og:description', aciklama);
    etiketYaz('meta[property="og:url"]', 'property', 'og:url', adres);
    etiketYaz('meta[property="og:type"]', 'property', 'og:type', tur);
    etiketYaz('meta[property="og:image"]', 'property', 'og:image', gorsel);
    etiketYaz('meta[name="twitter:title"]', 'name', 'twitter:title', tamBaslik);
    etiketYaz('meta[name="twitter:description"]', 'name', 'twitter:description', aciklama);
    etiketYaz('meta[name="twitter:image"]', 'name', 'twitter:image', gorsel);
  }, [baslik, aciklama, yol, gorsel, tur, hazir]);
}
