import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@app/ratewise': resolve(__dirname, './src'),
      '@shared': resolve(__dirname, '../shared'),
    },
  },
  server: {
    port: 4173,
  },
  build: {
    // Target modern browsers for better optimization
    target: 'es2022',
    // Use esbuild for faster minification (default)
    minify: 'esbuild',
    // Enable CSS code splitting for better caching
    cssCodeSplit: true,
    // Increase chunk size warning limit
    chunkSizeWarningLimit: 1000,
    // Optimize chunks
    rollupOptions: {
      output: {
        // Manual chunk splitting for better caching
        manualChunks: {
          // Vendor chunk for React and core libraries
          vendor: ['react', 'react-dom'],
          // UI libraries chunk
          ui: ['lucide-react'],
        },
        // Clean output file names
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: 'assets/[ext]/[name]-[hash].[ext]',
      },
    },
    // Source maps for production debugging
    sourcemap: true,
    // Report compressed size
    reportCompressedSize: true,
  },
  // Optimize dependencies
  optimizeDeps: {
    include: ['react', 'react-dom', 'lucide-react'],
  },
});
