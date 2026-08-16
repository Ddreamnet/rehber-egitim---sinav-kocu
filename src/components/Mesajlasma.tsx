import { useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, Pencil, Plus, Send, Trash2, X } from 'lucide-react';
import { Avatar, BosDurum, Buton, Kart, Rozet, Uyari } from '@/components/ui/temel';
import { useOturum } from '@/auth/Oturum';
import { saat, tarihKisa } from '@/lib/format';
import {
  konusmaAc,
  konusmalar,
  mesajDuzenle,
  mesajGonder,
  mesajSil,
  mesajlar as mesajlariGetir,
  okunduIsaretle,
  yazisilabilirler,
  type Konusma,
} from '@/data/repo';

/**
 * Koç ↔ öğrenci / veli yazışması.
 *
 * Dört panelde de aynı bileşen: RLS kimin hangi konuşmayı göreceğini zaten
 * belirliyor, tek fark koçun yeni konuşma açabilmesi ve adminin her mesajı
 * düzenleyip silebilmesi.
 */
export function Mesajlasma({
  /** Koç paneli: yeni konuşma açma listesi bu koçun öğrenci/velilerinden gelir */
  kocId,
  /** Admin: her mesajı düzenleyebilir ve silebilir */
  yetkili = false,
}: {
  kocId?: string;
  yetkili?: boolean;
}) {
  const { profil } = useOturum();
  const qc = useQueryClient();
  const benId = profil?.id ?? '';

  const liste = useQuery({ queryKey: ['konusmalar'], queryFn: konusmalar, refetchInterval: 20000 });
  const [secili, setSecili] = useState<string | null>(null);
  const [yeniAcik, setYeniAcik] = useState(false);
  // Koç kendi öğrenci/velileriyle, admin sistemdeki herkesle konuşma açabilir.
  const acabilir = Boolean(kocId) || yetkili;

  // Tek konuşması olan (öğrenci, veli) doğrudan sohbete düşsün.
  useEffect(() => {
    if (!secili && liste.data?.length) setSecili(liste.data[0].id);
  }, [liste.data, secili]);

  const aktif = liste.data?.find((k) => k.id === secili) ?? null;

  return (
    <div className="mesaj-duzen">
      <Kart className="mesaj-yan" style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <h3 style={{ fontSize: '1rem' }}>Konuşmalar</h3>
          {acabilir && (
            <Buton
              tip="ghost"
              boy="sm"
              style={{ marginLeft: 'auto' }}
              onClick={() => setYeniAcik((a) => !a)}
              aria-label="Yeni konuşma"
            >
              {yeniAcik ? <X size={15} /> : <Plus size={15} />}
            </Buton>
          )}
        </div>

        {yeniAcik && acabilir && (
          <YeniKonusma
            kocId={kocId}
            mevcut={liste.data ?? []}
            secildi={(id) => {
              setSecili(id);
              setYeniAcik(false);
            }}
          />
        )}

        <div className="mesaj-liste">
          {liste.data?.map((k) => (
            <button
              key={k.id}
              type="button"
              className={`mesaj-satir${k.id === secili ? ' aktif' : ''}`}
              onClick={() => setSecili(k.id)}
            >
              <Avatar ad={k.kisiAdi} renk={k.kisiAvatarRengi} foto={k.kisiAvatarUrl} boy="md" />
              <span className="mesaj-satir-govde">
                <span className="mesaj-satir-ust">
                  <strong>{k.kisiAdi}</strong>
                  {k.okunmamis > 0 && <Rozet ton="primary">{k.okunmamis}</Rozet>}
                </span>
                <span className="hint">
                  {k.tur === 'veli' ? `${k.ogrenciAdi ?? '—'} velisi` : 'öğrenci'}
                  {k.sonMesaj ? ` · ${k.sonMesaj.slice(0, 34)}${k.sonMesaj.length > 34 ? '…' : ''}` : ''}
                </span>
              </span>
            </button>
          ))}

          {!liste.isLoading && !liste.data?.length && (
            <p className="hint" style={{ padding: '8px 2px' }}>
              {acabilir
                ? 'Henüz konuşma yok. Artı butonuyla öğrenciye ya da velisine yazabilirsin.'
                : 'Henüz mesaj yok. Koçun yazdığında burada görünecek.'}
            </p>
          )}
        </div>
      </Kart>

      {aktif ? (
        <Sohbet konusma={aktif} benId={benId} yetkili={yetkili} tazele={() => qc.invalidateQueries({ queryKey: ['konusmalar'] })} />
      ) : (
        <Kart className="mesaj-ana">
          <BosDurum baslik="Konuşma seçilmedi" aciklama="Soldan bir konuşma seçtiğinde yazışma burada açılır." />
        </Kart>
      )}
    </div>
  );
}

function YeniKonusma({
  kocId,
  mevcut,
  secildi,
}: {
  /** Admin panelinde yok: liste bütün koçların öğrenci ve velilerini kapsar */
  kocId?: string;
  mevcut: Konusma[];
  secildi: (id: string) => void;
}) {
  const kisiler = useQuery({
    queryKey: ['yazisilabilirler', kocId ?? 'hepsi'],
    queryFn: () => yazisilabilirler(kocId),
  });
  const qc = useQueryClient();
  const [hata, setHata] = useState<string | null>(null);

  // Konuşması olan kişiyi tekrar listelemek yeni bir satır açmıyor ama
  // kullanıcıya "işe yaramadı" hissi veriyordu.
  const acilabilir = useMemo(
    () => (kisiler.data ?? []).filter((k) => !mevcut.some((m) => m.kisiId === k.kisiId)),
    [kisiler.data, mevcut],
  );

  const ac = async (kisi: (typeof acilabilir)[number]) => {
    setHata(null);
    try {
      const id = await konusmaAc(kisi.kocId, kisi.kisiId, kisi.tur, kisi.ogrenciId);
      await qc.invalidateQueries({ queryKey: ['konusmalar'] });
      secildi(id);
    } catch (h) {
      setHata(h instanceof Error ? h.message : 'Konuşma açılamadı.');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingBottom: 8 }}>
      {hata && <Uyari tur="error">{hata}</Uyari>}
      {acilabilir.map((k) => (
        <button
          key={`${k.kisiId}-${k.tur}`}
          type="button"
          className="mesaj-satir"
          onClick={() => ac(k)}
        >
          <Avatar ad={k.adSoyad} renk={k.avatarRengi} foto={k.avatarUrl} boy="md" />
          <span className="mesaj-satir-govde">
            <strong>{k.adSoyad}</strong>
            <span className="hint">
              {k.tur === 'veli' ? `${k.ogrenciAdi} velisi` : 'öğrenci'}
              {!kocId && ` · koç ${k.kocAdi}`}
            </span>
          </span>
        </button>
      ))}
      {!kisiler.isLoading && !acilabilir.length && (
        <p className="hint">Yazışılabilecek herkesle konuşma zaten açık.</p>
      )}
    </div>
  );
}

function Sohbet({
  konusma,
  benId,
  yetkili,
  tazele,
}: {
  konusma: Konusma;
  benId: string;
  yetkili: boolean;
  tazele: () => void;
}) {
  const qc = useQueryClient();
  const [metin, setMetin] = useState('');
  const [duzenlenen, setDuzenlenen] = useState<{ id: string; metin: string } | null>(null);
  const [hata, setHata] = useState<string | null>(null);
  const dip = useRef<HTMLDivElement>(null);

  const anahtar = ['mesajlar', konusma.id];
  const sorgu = useQuery({ queryKey: anahtar, queryFn: () => mesajlariGetir(konusma.id), refetchInterval: 15000 });

  // Açılınca ve yeni mesaj geldikçe okundu yaz; rozet takılı kalmasın.
  useEffect(() => {
    if (!sorgu.data?.length) return;
    void okunduIsaretle(konusma.id).then(tazele);
    dip.current?.scrollIntoView({ block: 'end' });
  }, [sorgu.data, konusma.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const gonder = useMutation({
    mutationFn: () => mesajGonder(konusma.id, metin),
    onSuccess: async () => {
      setMetin('');
      setHata(null);
      await qc.invalidateQueries({ queryKey: anahtar });
      tazele();
    },
    onError: (h) => setHata(h instanceof Error ? h.message : 'Mesaj gönderilemedi.'),
  });

  const kaydet = async () => {
    if (!duzenlenen) return;
    await mesajDuzenle(duzenlenen.id, duzenlenen.metin);
    setDuzenlenen(null);
    await qc.invalidateQueries({ queryKey: anahtar });
    tazele();
  };

  const sil = async (id: string) => {
    await mesajSil(id);
    await qc.invalidateQueries({ queryKey: anahtar });
    tazele();
  };

  let sonGun = '';

  return (
    <Kart className="mesaj-ana" style={{ display: 'flex', flexDirection: 'column', padding: 0 }}>
      <div className="mesaj-baslik">
        <Avatar ad={konusma.kisiAdi} renk={konusma.kisiAvatarRengi} foto={konusma.kisiAvatarUrl} boy="md" />
        <div>
          <strong>{konusma.kisiAdi}</strong>
          <div className="hint">
            {konusma.tur === 'veli' ? `${konusma.ogrenciAdi ?? '—'} velisi` : 'öğrenci'} · koç {konusma.kocAdi}
          </div>
        </div>
      </div>

      <div className="mesaj-akis">
        {sorgu.data?.map((m) => {
          const gun = tarihKisa(m.tarih);
          const gunBasligi = gun !== sonGun ? gun : null;
          sonGun = gun;
          const benim = m.gonderenId === benId;

          return (
            <div key={m.id}>
              {gunBasligi && <div className="mesaj-gun">{gunBasligi}</div>}
              <div className={`mesaj-balon${benim ? ' benim' : ''}`}>
                {!benim && <span className="mesaj-kim">{m.gonderenAdi}</span>}

                {duzenlenen?.id === m.id ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <textarea
                      className="input"
                      rows={3}
                      value={duzenlenen.metin}
                      onChange={(e) => setDuzenlenen({ id: m.id, metin: e.target.value })}
                    />
                    <div style={{ display: 'flex', gap: 8 }}>
                      <Buton boy="sm" onClick={kaydet}>
                        <Check size={14} /> Kaydet
                      </Buton>
                      <Buton tip="ghost" boy="sm" onClick={() => setDuzenlenen(null)}>
                        Vazgeç
                      </Buton>
                    </div>
                  </div>
                ) : (
                  <p>{m.metin}</p>
                )}

                <span className="mesaj-alt">
                  {saat(m.tarih)}
                  {m.duzenlendi && ' · düzenlendi'}
                  {benim && m.okunduAt && ' · okundu'}
                  {(yetkili || benim) && duzenlenen?.id !== m.id && (
                    <>
                      <button
                        type="button"
                        className="mesaj-eylem"
                        onClick={() => setDuzenlenen({ id: m.id, metin: m.metin })}
                        aria-label="Mesajı düzenle"
                      >
                        <Pencil size={12} />
                      </button>
                      <button
                        type="button"
                        className="mesaj-eylem"
                        onClick={() => sil(m.id)}
                        aria-label="Mesajı sil"
                      >
                        <Trash2 size={12} />
                      </button>
                    </>
                  )}
                </span>
              </div>
            </div>
          );
        })}

        {!sorgu.isLoading && !sorgu.data?.length && (
          <p className="hint" style={{ padding: 16 }}>
            Bu konuşmada henüz mesaj yok. İlk mesajı sen yazabilirsin.
          </p>
        )}
        <div ref={dip} />
      </div>

      {hata && (
        <div style={{ padding: '0 16px' }}>
          <Uyari tur="error">{hata}</Uyari>
        </div>
      )}

      <form
        className="mesaj-yazma"
        onSubmit={(e) => {
          e.preventDefault();
          if (metin.trim()) gonder.mutate();
        }}
      >
        <textarea
          className="input"
          rows={2}
          value={metin}
          onChange={(e) => setMetin(e.target.value)}
          placeholder="Mesajını yaz…"
          onKeyDown={(e) => {
            // Enter gönderir, Shift+Enter satır atlar — sohbet alışkanlığı.
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              if (metin.trim()) gonder.mutate();
            }
          }}
        />
        <Buton type="submit" disabled={!metin.trim() || gonder.isPending} aria-label="Gönder">
          <Send size={16} />
        </Buton>
      </form>
    </Kart>
  );
}
