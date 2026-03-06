import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  root: '.',
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        admin: resolve(__dirname, 'admin/index.html'),
        adminAccess: resolve(__dirname, 'admin-access.html'),
        login: resolve(__dirname, 'login.html'),
        register: resolve(__dirname, 'register.html'),
        marketplace: resolve(__dirname, 'marketplace.html'),
        dashboard: resolve(__dirname, 'dashboard.html'),
      }
    }
  },
});
