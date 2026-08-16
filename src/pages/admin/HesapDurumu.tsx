import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Trash2, TriangleAlert } from 'lucide-react';
import { Buton, Rozet, Uyari } from '@/components/ui/temel';
import { kullaniciSil, profilGuncelle } from '@/data/repo';

/**
 * Hesabı pasife alma ve kalıcı silme.
 *
 * Pasife alma tercih edilen yol: hesap kapanır, veri durur, istenirse geri
 * açılır. Silme cascade ile yayıldığı için geri dönüşü yok; ne sildiği butonun
 * yanında yazıyor.
 */
export function HesapDurumu({
  kisiId,
  aktif,
  tur,
  donusYolu,
  tazelenecek,
}: {
  kisiId: string;
  aktif: boolean;
  tur: 'ogrenci' | 'koc';
  /** Silme sonrası gidilecek liste */
  donusYolu: string;
  /** Silme/pasifleştirme sonrası yeniden çekilecek sorgu anahtarları */
  tazelenecek: string[];
}) {
  const qc = useQueryClient();
  const git = useNavigate();

  const [islemde, setIslemde] = useState(false);
  const [hata, setHata] = useState<string | null>(null);

  const etiket = tur === 'koc' ? 'Koç' : 'Öğrenci';

  const tazele = () => Promise.all(tazelenecek.map((k) => qc.invalidateQueries({ queryKey: [k] })));

  const aktiflikDegistir = async () => {
    setIslemde(true);
    setHata(null);
    try {
      await profilGuncelle(kisiId, { aktif: !aktif });
      await tazele();
    } catch (h) {
      setHata(h instanceof Error ? h.message : 'Değiştirilemedi.');
    } finally {
      setIslemde(false);
    }
  };

  const sil = async () => {
    setIslemde(true);
    setHata(null);
    try {
      await kullaniciSil(kisiId);
      await tazele();
      git(donusYolu, { replace: true });
    } catch (h) {
      setHata(h instanceof Error ? h.message : 'Hesap silinemedi.');
    } finally {
      setIslemde(false);
    }
  };

  return (
    <div
      style={{
        borderTop: '1px solid var(--color-border)',
        paddingTop: 16,
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
      }}
    >
      <div className="eylem-satiri" style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
        <Rozet ton={aktif ? 'success' : 'warning'}>{aktif ? 'Hesap açık' : 'Hesap kapalı'}</Rozet>
        <span className="hint" style={{ flex: '1 1 220px', lineHeight: 1.5 }}>
          {aktif
            ? 'Pasife alınan hesap giriş yapamaz; veriler durur, istediğinde geri açabilirsin.'
            : `${etiket} şu anda giriş yapamıyor. Verileri duruyor.`}
        </span>
        <Buton tip={aktif ? 'outline' : 'primary'} boy="sm" onClick={aktiflikDegistir} disabled={islemde}>
          {aktif ? 'Pasife al' : 'Hesabı yeniden aç'}
        </Buton>
      </div>

      {/* Ad soyad yazdırarak onaylatma kaldırıldı; uyarı metni yerinde duruyor. */}
      <div
        style={{
          background: 'var(--color-error-soft)',
          borderRadius: 14,
          padding: '14px 16px',
          display: 'flex',
          gap: 12,
          alignItems: 'center',
          flexWrap: 'wrap',
        }}
      >
        <TriangleAlert size={18} color="var(--color-error-deep)" style={{ flex: 'none' }} />
        <p style={{ fontSize: '.88rem', lineHeight: 1.5, flex: '1 1 240px' }}>
          {tur === 'koc'
            ? 'Silinince yaptığı görüşmeler ve notlar da gider — öğrencilerin geçmişi dahil.'
            : 'Silinince soru girişleri, denemeleri, planları ve görüşmeleri de gider.'}{' '}
          <strong>Geri alınamaz.</strong>
        </p>
        <Buton tip="primary" boy="sm" onClick={sil} disabled={islemde}>
          <Trash2 size={14} /> {islemde ? 'Siliniyor…' : 'Kalıcı olarak sil'}
        </Buton>
      </div>

      {hata && <Uyari tur="error">{hata}</Uyari>}
    </div>
  );
}
