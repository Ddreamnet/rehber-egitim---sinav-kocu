/**
 * Platform ayrımı — aynı kod tabanı iki farklı ürün sunuyor:
 *
 *   Mobil web (tarayıcı) : pazarlama sitesi + paneller. Ziyaretçi henüz müşteri
 *                          değil; landing, blog, başvuru ve "Başvuru" CTA'sı var.
 *   Uygulama (Capacitor) : yalnız panel. Uygulamayı indiren zaten müşteri; ona
 *                          satış sayfası göstermek gürültü. Alt sekme çubuğu,
 *                          donanım geri tuşu, durum çubuğu ve güvenli alanlar
 *                          buraya özel.
 */

import { Capacitor } from '@capacitor/core';

/** Gerçek cihazda (iOS/Android kabuğu içinde) mi çalışıyoruz? */
export const nativeMi = (): boolean => Capacitor.isNativePlatform();

export const platformAdi = (): 'ios' | 'android' | 'web' =>
  Capacitor.getPlatform() as 'ios' | 'android' | 'web';

export const iosMu = (): boolean => platformAdi() === 'ios';
export const androidMi = (): boolean => platformAdi() === 'android';

/**
 * Uygulamada gizlenen herkese açık rotalar. Doğrudan açılırlarsa (bildirim,
 * derin bağlantı) kullanıcı panele yönlendirilir.
 */
export const PAZARLAMA_ROTALARI = ['/', '/nasil-calisir', '/basvuru', '/styleguide'];

export const pazarlamaRotasiMi = (yol: string): boolean =>
  PAZARLAMA_ROTALARI.includes(yol);
