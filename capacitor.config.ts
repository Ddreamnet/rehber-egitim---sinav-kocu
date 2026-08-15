import type { CapacitorConfig } from '@capacitor/cli';
import { KeyboardResize } from '@capacitor/keyboard';

/**
 * Uygulama yapılandırması.
 * Renkler tasarım token'larıyla aynı: zemin #F1F4DF (sage-50), marka #CF2E2F.
 */
const config: CapacitorConfig = {
  appId: 'com.rehbersinavkocu.app',
  appName: 'Rehber',
  webDir: 'dist',

  // Uygulama zemini: web görünümü yüklenirken beyaz parlama olmasın
  backgroundColor: '#F1F4DF',

  server: { androidScheme: 'https' },

  ios: {
    contentInset: 'always',
    backgroundColor: '#F1F4DF',
    // Kaydırırken kenarda beyaz zıplama olmasın
    scrollEnabled: true,
  },

  android: {
    backgroundColor: '#F1F4DF',
    // Web görünümünde metin boyutu sistem ayarından şişmesin (tasarım bozuluyor)
    useLegacyBridge: false,
  },

  plugins: {
    SplashScreen: {
      launchShowDuration: 1200,
      launchAutoHide: false, // arayüz hazır olunca koddan gizliyoruz
      backgroundColor: '#F1F4DF',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      splashFullScreen: false,
      splashImmersive: false,
    },
    StatusBar: {
      // Krem zemin üstünde koyu ikonlar
      style: 'LIGHT',
      backgroundColor: '#F1F4DF',
      overlaysWebView: false,
    },
    Keyboard: {
      resize: KeyboardResize.Native,
      resizeOnFullScreen: true,
    },
  },
};

export default config;
