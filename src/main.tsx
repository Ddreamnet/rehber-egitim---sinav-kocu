import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import '@/styles/tokens.css';
import '@/styles/app.css';

import App from './App';
import { nativeMi, platformAdi } from '@/lib/platform';
import { OturumSaglayici } from '@/auth/Oturum';
import { SayfaBasinaKaydir } from '@/components/layout/SayfaBasinaKaydir';

// CSS'in platforma göre dallanabilmesi için kökü işaretle (ilk boyamadan önce).
if (nativeMi()) {
  document.documentElement.classList.add('native', `platform-${platformAdi()}`);
}

const sorguIstemcisi = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 60_000, refetchOnWindowFocus: false, retry: 1 },
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={sorguIstemcisi}>
      <BrowserRouter>
        <OturumSaglayici>
          <SayfaBasinaKaydir />
          <App />
        </OturumSaglayici>
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
);
