import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Search } from 'lucide-react';
import { Rozet, Segment, Uyari, BosDurum } from '@/components/ui/temel';
import { TabloKart } from '@/components/ui/TabloKart';
import { tarihUzun, telefonGoster } from '@/lib/format';
import {
  BASVURU_ALANLARI,
  BASVURU_PROGRAMLARI,
  BASVURU_SINIFLARI,
  basvuruEtiketi,
  basvuruPaketSecenekleri,
} from '@/config/site';
import { basvurular, basvuruDurumu } from '@/data/repo';
import type { BasvuruKaydi } from '@/data/repo';

const DURUMLAR = [
  { deger: 'hepsi', etiket: 'Hepsi' },
  { deger: 'yeni', etiket: 'Yeni' },
  { deger: 'arandi', etiket: 'Arandı' },
  { deger: 'kaydoldu', etiket: 'Kaydoldu' },
  { deger: 'kapandi', etiket: 'Kapandı' },
];

const DURUM_TONU: Record<BasvuruKaydi['durum'], 'primary' | 'info' | 'success' | 'notr'> = {
  yeni: 'primary',
  arandi: 'info',
  kaydoldu: 'success',
  kapandi: 'notr',
};

const DURUM_ADI: Record<BasvuruKaydi['durum'], string> = {
  yeni: 'Yeni',
  arandi: 'Arandı',
  kaydoldu: 'Kaydoldu',
  kapandi: 'Kapandı',
};

/**
 * Gelen başvurular.
 *
 * Başvurular yalnızca e-postaya ve tabloya düşüyordu; panelde görecek bir yer
 * yoktu ve `applications.durum` sütunu hiç kullanılmıyordu — takip gelen
 * kutusunda yapılıyordu.
 */
export default function AdminBasvurular() {
  const istemci = useQueryClient();
  const liste = useQuery({ queryKey: ['basvurular'], queryFn: basvurular });
  const [arama, setArama] = useState('');
  const [durum, setDurum] = useState('hepsi');
  const [hata, setHata] = useState<string | null>(null);

  const guncelle = useMutation({
    mutationFn: ({ id, yeni }: { id: string; yeni: BasvuruKaydi['durum'] }) => basvuruDurumu(id, yeni),
    onSuccess: () => istemci.invalidateQueries({ queryKey: ['basvurular'] }),
    onError: (h) => setHata(h instanceof Error ? h.message : 'Durum güncellenemedi.'),
  });

  const paketler = useMemo(() => basvuruPaketSecenekleri(), []);

  const suzulmus = useMemo(() => {
    const hepsi = liste.data ?? [];
    const q = arama.trim().toLocaleLowerCase('tr-TR');
    return hepsi.filter((b) => {
      if (durum !== 'hepsi' && b.durum !== durum) return false;
      if (!q) return true;
      return (
        `${b.ad} ${b.soyad}`.toLocaleLowerCase('tr-TR').includes(q) ||
        b.telefon.includes(q.replace(/\D/g, '')) ||
        (b.eposta ?? '').toLocaleLowerCase('tr-TR').includes(q)
      );
    });
  }, [liste.data, arama, durum]);

  const yeniSayisi = (liste.data ?? []).filter((b) => b.durum === 'yeni').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {hata && <Uyari tur="error">{hata}</Uyari>}

      <TabloKart>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 0 8px', flexWrap: 'wrap' }}>
          <h3 style={{ fontSize: '1.05rem' }}>Gelen başvurular</h3>
          {yeniSayisi > 0 && <Rozet ton="primary">{yeniSayisi} yeni</Rozet>}
          <Segment
            etiket="Duruma göre süz"
            style={{ marginLeft: 'auto' }}
            deger={durum}
            degistir={setDurum}
            secenekler={DURUMLAR}
          />
          <div className="search-wrap">
            <Search size={16} aria-hidden="true" />
            <input
              className="input"
              placeholder="Ad, telefon veya e-posta…"
              aria-label="Başvurularda ara"
              value={arama}
              onChange={(e) => setArama(e.target.value)}
              style={{ width: 220 }}
            />
          </div>
        </div>

        {liste.isLoading ? (
          <div className="iskelet" style={{ minHeight: 220 }} />
        ) : !suzulmus.length ? (
          <BosDurum
            baslik={arama || durum !== 'hepsi' ? 'Bu süzgeçle eşleşen başvuru yok' : 'Henüz başvuru yok'}
            aciklama="Siteden gelen başvurular buraya düşer ve aynı anda e-posta olarak da gönderilir."
          />
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Öğrenci</th>
                <th>İletişim</th>
                <th>Sınıf / alan</th>
                <th className="hide-m">Program / paket</th>
                <th className="hide-m">Tarih</th>
                <th>Durum</th>
              </tr>
            </thead>
            <tbody>
              {suzulmus.map((b) => (
                <tr key={b.id}>
                  <td>
                    <strong>
                      {b.ad} {b.soyad}
                    </strong>
                    {b.veliOnayi === false && (
                      <div>
                        <Rozet ton="warning">veli onayı yok</Rozet>
                      </div>
                    )}
                    {b.not && (
                      <div className="hint" style={{ fontSize: '.75rem', maxWidth: '30ch' }}>
                        {b.not}
                      </div>
                    )}
                  </td>
                  <td>
                    <a href={`tel:${b.telefon}`} style={{ fontWeight: 600 }}>
                      {telefonGoster(b.telefon)}
                    </a>
                    {b.eposta && (
                      <div className="hint" style={{ fontSize: '.75rem' }}>
                        <a href={`mailto:${b.eposta}`}>{b.eposta}</a>
                      </div>
                    )}
                  </td>
                  <td>
                    {basvuruEtiketi(BASVURU_SINIFLARI, b.sinif)}
                    {b.alan && (
                      <div className="hint" style={{ fontSize: '.75rem' }}>
                        {basvuruEtiketi(BASVURU_ALANLARI, b.alan)}
                      </div>
                    )}
                  </td>
                  <td className="hide-m">
                    {basvuruEtiketi(BASVURU_PROGRAMLARI, b.program)}
                    {b.paket && (
                      <div className="hint" style={{ fontSize: '.75rem' }}>
                        {basvuruEtiketi(paketler, b.paket)}
                      </div>
                    )}
                  </td>
                  <td className="hide-m">{tarihUzun(b.olusturmaTarihi)}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <Rozet ton={DURUM_TONU[b.durum]}>{DURUM_ADI[b.durum]}</Rozet>
                      <select
                        className="input"
                        aria-label={`${b.ad} ${b.soyad} başvurusunun durumu`}
                        style={{ height: 34, width: 128, fontSize: '.85rem' }}
                        value={b.durum}
                        disabled={guncelle.isPending}
                        onChange={(e) => {
                          setHata(null);
                          guncelle.mutate({ id: b.id, yeni: e.target.value as BasvuruKaydi['durum'] });
                        }}
                      >
                        {(['yeni', 'arandi', 'kaydoldu', 'kapandi'] as const).map((d) => (
                          <option key={d} value={d}>
                            {DURUM_ADI[d]}
                          </option>
                        ))}
                      </select>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </TabloKart>
    </div>
  );
}
