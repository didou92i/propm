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
        // Code splitting ultra-agressif pour réduire le bundle de 3MB et éliminer 570KB unused
        manualChunks: (id) => {
          // Split node_modules par package individuel pour meilleur cache et lazy loading
          if (id.includes('node_modules')) {
            // React core - toujours nécessaire mais séparé
            if (id.includes('react-dom')) return 'react-dom';
            if (id.includes('react/')) return 'react';
            
            // Librairies d'animation - lazy loadables
            if (id.includes('framer-motion')) return 'framer-motion';
            
            // Supabase - peut être lazy si utilisé uniquement après auth
            if (id.includes('@supabase/supabase-js')) return 'supabase-client';
            if (id.includes('@supabase')) return 'supabase-helpers';
            
            // React Query - critique mais séparable
            if (id.includes('@tanstack/react-query')) return 'react-query';
            
            // Icons - lazy loadable
            if (id.includes('lucide-react')) return 'lucide-icons';
            
            // Radix UI components - lazy par composant
            if (id.includes('@radix-ui/react-dialog')) return 'radix-dialog';
            if (id.includes('@radix-ui/react-dropdown')) return 'radix-dropdown';
            if (id.includes('@radix-ui/react-select')) return 'radix-select';
            if (id.includes('@radix-ui')) return 'radix-ui-core';
            
            // Charts - lazy loadable
            if (id.includes('recharts')) return 'recharts';
            
            // Markdown - lazy loadable  
            if (id.includes('react-markdown')) return 'markdown';
            
            // LlamaIndex - lazy loadable (utilisé uniquement dans certaines features)
            if (id.includes('llamaindex')) return 'llamaindex';
            
            // Three.js - lazy loadable (animations)
            if (id.includes('three')) return 'three';
            if (id.includes('@react-three')) return 'react-three';
            
            // jsPDF - lazy loadable (génération PDF)
            if (id.includes('jspdf')) return 'jspdf';
            
            return 'vendor-misc';
          }
          
          // Split modules internes volumineux par fonctionnalité
          if (id.includes('/src/components/training/')) return 'training-components';
          if (id.includes('/src/components/document/')) return 'document-components';
          if (id.includes('/src/components/monitoring/')) return 'monitoring-components';
          if (id.includes('/src/components/chat/')) return 'chat-components';
          if (id.includes('/src/services/training/')) return 'training-services';
          if (id.includes('/src/services/llama/')) return 'llama-services';
          if (id.includes('/src/services/prepacds/')) return 'prepacds-services';
        },
        // Nommage prévisible pour meilleur cache HTTP
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
      },
    },
    // Augmenter la limite mais warn si chunks trop gros
    chunkSizeWarningLimit: 300,
  },
}));
