import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    port: 3000,
    open: false,
    watch: {
      // Exclude large static JSON data files that Windows locks (EBUSY)
      ignored: [
        '**/src/data/*.json'
      ]
    }
  }
});
