import { readFileSync } from 'node:fs';
import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// Long-lived vendor chunks: they change rarely, so browsers keep them cached across deploys.
const VENDOR_CHUNKS = {
  'vendor-react': ['react', 'react-dom', 'react-router-dom'],
  'vendor-query': ['@tanstack/react-query'],
  'vendor-ui': ['radix-ui', 'lucide-react', 'sonner', 'class-variance-authority', 'clsx', 'tailwind-merge'],
  'vendor-forms': ['react-hook-form', '@hookform/resolvers', 'zod'],
};

const packageJson = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf-8'));

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // Shown in the footer (src/config/appInfo.js).
  define: { __APP_VERSION__: JSON.stringify(packageJson.version) },
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  server: { port: 5173 },
  build: {
    rollupOptions: {
      output: { manualChunks: VENDOR_CHUNKS },
      onwarn(warning, defaultHandler) {
        // zod ships explanatory comments containing "@__PURE__" that Rollup can't place. Harmless.
        const isThirdPartyAnnotationNotice =
          warning.code === 'INVALID_ANNOTATION' && warning.id?.includes('node_modules');
        if (!isThirdPartyAnnotationNotice) defaultHandler(warning);
      },
    },
  },
});
