import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  base: '/',
  css: {
    postcss: {
      plugins: []
    }
  },
  plugins: [
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      // Router wrapper used by the teleadmin pages (adds the /teleadmin base to absolute paths)
      '@teleadmin/router': fileURLToPath(new URL('./src/teleadmin/router.jsx', import.meta.url)),
      // Router wrapper used by the HRMS pages (adds the /hrms base, reports paths relative to it)
      '@hrms/router': fileURLToPath(new URL('./src/hrms/router.jsx', import.meta.url))
    }
  },
  build: {
    chunkSizeWarningLimit: 1000,
    rolldownOptions: {
      output: {
        // Split heavy vendor libraries into separately cached chunks. Dependencies are not
        // pulled into a group, so page-only libraries stay out of the first-load React chunk.
        codeSplitting: {
          includeDependenciesRecursively: false,
          groups: [
            { name: 'vendor-react', test: /node_modules[\\/](react|react-dom|react-router|react-router-dom|scheduler)[\\/]/, priority: 10 },
            { name: 'vendor-recharts', test: /node_modules[\\/](recharts|recharts-to-png|d3-[^\\/]+|victory-vendor)[\\/]/ },
            { name: 'vendor-chartjs', test: /node_modules[\\/](chart\.js|react-chartjs-2)[\\/]/ },
            { name: 'vendor-pdf', test: /node_modules[\\/](jspdf|html2canvas|canvg|dompurify)[\\/]/ },
            { name: 'vendor-motion', test: /node_modules[\\/](framer-motion|motion-dom|motion-utils)[\\/]/ },
            { name: 'vendor-icons', test: /node_modules[\\/]lucide-react[\\/]/ },
            // Libraries used only by the teleadmin pages
            { name: 'vendor-xlsx', test: /node_modules[\\/]xlsx[\\/]/ },
            { name: 'vendor-nivo', test: /node_modules[\\/]@nivo[\\/]/ },
            { name: 'vendor-spring', test: /node_modules[\\/](@react-spring|react-spring)[\\/]/ },
            { name: 'vendor-icons-teleadmin', test: /node_modules[\\/]lucide-react-teleadmin[\\/]/ },
          ],
        },
      },
    },
  },
  server: {
    warmup: {
      clientFiles: ['./src/main.jsx', './src/layouts/AdminLayout.jsx', './src/pages/Dashboard/index.jsx']
    },
    port: 5174,
    host: true,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true
      },
      // Teleadmin "dual login" against production (same as the standalone teleadmin app)
      '/prod-api': {
        target: 'https://truckmitr.com',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/prod-api/, '/api')
      }
    }
  }
});
