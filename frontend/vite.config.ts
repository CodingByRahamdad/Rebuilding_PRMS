import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  const isDemo = process.env.ENABLE_DEMO_MODE !== 'false';
  return {
    define: {
      'import.meta.env.VITE_ENABLE_DEMO_MODE': JSON.stringify(isDemo ? 'true' : 'false'),
      'process.env.ENABLE_DEMO_MODE': JSON.stringify(isDemo ? 'true' : 'false'),
    },
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
      proxy: {
        '/api': {
          target: process.env.VITE_DEV_PROXY_TARGET || 'http://localhost:3000',
          changeOrigin: true,
        },
        '/socket.io': {
          target: process.env.VITE_DEV_PROXY_TARGET || 'http://localhost:3000',
          ws: true,
          changeOrigin: true,
        },
      },
    },
  };
});
