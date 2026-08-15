import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': path.resolve(__dirname, 'src') },
  },
  server: { port: 5173, host: true },
  build: {
    outDir: 'dist',
    // Kaynak haritaları üretimde yayınlanmaz (3,5 MB ve kaynak kodu sızdırır);
    // hata ayıklaması gerekirse VITE_SOURCEMAP=1 ile açılır.
    sourcemap: process.env.VITE_SOURCEMAP === '1',
    rollupOptions: {
      output: {
        // Grafik ve veri katmanı ayrı paketlerde — ilk açılış (landing) hafif kalsın.
        manualChunks: {
          react: ['react', 'react-dom', 'react-router-dom'],
          grafik: ['chart.js', 'react-chartjs-2'],
          supabase: ['@supabase/supabase-js'],
        },
      },
    },
  },
});
