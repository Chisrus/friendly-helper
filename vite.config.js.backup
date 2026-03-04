import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  root: '.',
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        login: resolve(__dirname, 'login.html'),
        register: resolve(__dirname, 'register.html'),
        marketplace: resolve(__dirname, 'marketplace.html'),
        dashboard: resolve(__dirname, 'dashboard.html'),
        mentionsLegales: resolve(__dirname, 'mentions-legales.html'),
        politiqueConfidentialite: resolve(__dirname, 'politique-confidentialite.html'),
        conditionsUtilisation: resolve(__dirname, 'conditions-utilisation.html'),
        cookies: resolve(__dirname, 'cookies.html'),
      }
    }
  },
});