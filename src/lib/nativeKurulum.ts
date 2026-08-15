/**
 * Uygulamaya özel açılış ayarları. Yalnız Capacitor kabuğunda çalışır;
 * tarayıcıda hiçbir şey yapmaz (eklentiler web'de sessizce no-op döner ama
 * gereksiz çağrı da yapmıyoruz).
 */

import { nativeMi, androidMi } from './platform';

let kuruldu = false;

export async function nativeKurulum(geriTuşu: () => boolean): Promise<void> {
  if (!nativeMi() || kuruldu) return;
  kuruldu = true;

  const [{ StatusBar, Style }, { SplashScreen }, { Keyboard, KeyboardResize }, { App }] =
    await Promise.all([
      import('@capacitor/status-bar'),
      import('@capacitor/splash-screen'),
      import('@capacitor/keyboard'),
      import('@capacitor/app'),
    ]);

  // Durum çubuğu: zemin krem olduğu için ikonlar koyu olmalı.
  try {
    await StatusBar.setStyle({ style: Style.Light });
    if (androidMi()) {
      await StatusBar.setBackgroundColor({ color: '#F1F4DF' });
      // Uygulama içeriği durum çubuğunun altına akmasın; güvenli alanı CSS yönetiyor.
      await StatusBar.setOverlaysWebView({ overlay: false });
    }
  } catch {
    /* durum çubuğu yoksa (tablet kiosk vb.) sorun değil */
  }

  // Klavye açılınca içerik yukarı itilsin, sayfa altına sıkışmasın.
  try {
    await Keyboard.setResizeMode({ mode: KeyboardResize.Native });
    await Keyboard.setScroll({ isDisabled: false });
  } catch {
    /* iOS dışında bazı sürümlerde desteklenmiyor */
  }

  // Android donanım geri tuşu: önce uygulama içi geri, kök ekrandaysa çık.
  try {
    App.addListener('backButton', ({ canGoBack }) => {
      const icerideKaldi = geriTuşu();
      if (icerideKaldi) return;
      if (canGoBack) window.history.back();
      else App.exitApp();
    });
  } catch {
    /* iOS'ta donanım geri tuşu yok */
  }

  // Arayüz hazır — açılış ekranını kapat.
  try {
    await SplashScreen.hide();
  } catch {
    /* splash zaten kapalıysa */
  }
}
