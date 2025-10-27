import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    // ES2020 pour éliminer les polyfills inutiles (Object.assign, Object.is, etc.)
    target: 'es2020',
    minify: 'esbuild',
    cssCodeSplit: true,
    rollupOptions: {
      output: {
        // Code splitting ultra-agressif pour réduire le bundle de 3MB
        manualChunks: (id) => {
          // Split node_modules par package individuel
          if (id.includes('node_modules')) {
            if (id.includes('react-dom')) return 'react-dom';
            if (id.includes('react/')) return 'react';
            if (id.includes('framer-motion')) return 'framer-motion';
            if (id.includes('@supabase/supabase-js')) return 'supabase-client';
            if (id.includes('@supabase')) return 'supabase-helpers';
            if (id.includes('@tanstack/react-query')) return 'react-query';
            if (id.includes('lucide-react')) return 'lucide-icons';
            if (id.includes('@radix-ui')) return 'radix-ui';
            if (id.includes('recharts')) return 'recharts';
            if (id.includes('react-markdown')) return 'markdown';
            if (id.includes('llamaindex')) return 'llamaindex';
            if (id.includes('three')) return 'three';
            if (id.includes('@react-three')) return 'react-three';
            if (id.includes('jspdf')) return 'jspdf';
            return 'vendor-misc';
          }
          // Split modules internes volumineux
          if (id.includes('/src/components/training/')) return 'training-components';
          if (id.includes('/src/components/document/')) return 'document-components';
          if (id.includes('/src/components/monitoring/')) return 'monitoring-components';
          if (id.includes('/src/services/training/')) return 'training-services';
          if (id.includes('/src/services/llama/')) return 'llama-services';
          if (id.includes('/src/services/prepacds/')) return 'prepacds-services';
        },
        // Nommage prévisible pour meilleur cache
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
      },
    },
    chunkSizeWarningLimit: 500,
  },
}));
