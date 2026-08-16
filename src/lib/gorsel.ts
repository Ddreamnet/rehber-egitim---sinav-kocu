/**
 * Profil fotoğrafını yüklemeden önce küçültür.
 *
 * Telefon kamerası 3–5 MB dosya üretiyor; avatar 40 px'lik bir yuvarlak olarak
 * gösterildiği için 256 px kare fazlasıyla yetiyor. Kısa kenardan kare kırpıp
 * JPEG'e çeviriyoruz.
 */
export async function fotografiKucult(dosya: File, kenar = 256): Promise<File> {
  const kaynak = await createImageBitmap(dosya).catch(() => null);
  if (!kaynak) return dosya; // tarayıcı çeviremediyse olduğu gibi yükle

  const k = Math.min(kaynak.width, kaynak.height);
  const tuval = document.createElement('canvas');
  tuval.width = tuval.height = kenar;
  const ctx = tuval.getContext('2d');
  if (!ctx) return dosya;

  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(kaynak, (kaynak.width - k) / 2, (kaynak.height - k) / 2, k, k, 0, 0, kenar, kenar);
  kaynak.close();

  const blob = await new Promise<Blob | null>((coz) => tuval.toBlob(coz, 'image/jpeg', 0.86));
  if (!blob) return dosya;
  return new File([blob], 'avatar.jpg', { type: 'image/jpeg' });
}
