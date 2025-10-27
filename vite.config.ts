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
    // Optimisations pour améliorer FCP
    target: 'es2015', // Réduit les polyfills inutiles
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: mode === 'production',
        drop_debugger: mode === 'production',
      },
    },
    cssCodeSplit: true, // Split CSS par route
    rollupOptions: {
      output: {
        // Code splitting agressif pour réduire le bundle initial
        manualChunks: (id) => {
          // Vendors séparés
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom')) {
              return 'react-vendor';
            }
            if (id.includes('framer-motion')) {
              return 'animation-vendor';
            }
            if (id.includes('@supabase')) {
              return 'supabase-vendor';
            }
            if (id.includes('@tanstack')) {
              return 'query-vendor';
            }
            if (id.includes('lucide-react')) {
              return 'icons-vendor';
            }
            // Autres vendors
            return 'vendor';
          }
          // Code splitting par domaine fonctionnel
          if (id.includes('/src/components/training/')) {
            return 'training';
          }
          if (id.includes('/src/components/document/')) {
            return 'document';
          }
          if (id.includes('/src/components/monitoring/')) {
            return 'monitoring';
          }
        },
      },
    },
    chunkSizeWarningLimit: 500, // Avertir si chunk > 500KB
  },
}));
