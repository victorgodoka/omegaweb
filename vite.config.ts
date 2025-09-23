import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import tailwindcss from '@tailwindcss/vite'
import path from 'path';
import flowbiteReact from "flowbite-react/plugin/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    flowbiteReact()
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@/ui': path.resolve(__dirname, './ui'),
      buffer: 'buffer'
    }
  },
  build: {
    commonjsOptions: {
      // Ensure CJS default export interoperability (fixes packages like hoist-non-react-statics)
      requireReturnsDefault: 'auto'
    },
    rollupOptions: {
      output: {
        manualChunks: {
          // React ecosystem
          'vendor-react': ['react', 'react-dom'],
          'vendor-router': ['react-router'],
          
          // UI libraries - split further
          'vendor-mui': ['@mui/material', '@mui/x-charts'],
          'vendor-flowbite': ['flowbite-react'],
          'vendor-material-tailwind': ['@material-tailwind/react'],
          
          // Utility libraries
          'vendor-charts': ['recharts'],
          'vendor-utils': ['moment', 'idb', 'react-toastify'],
          'vendor-icons': ['@iconify/react'],
          'vendor-editor': ['quill'],
          
          // App chunks
          'components-heavy': [
            'src/pages/Profile/components/MatchHistoryCard',
            'src/pages/Profile/components/ProfileSkeleton',
            'src/pages/HypergeometricCalculator/index',
            'src/pages/PDFGenerator/index'
          ],
          'utils-api': ['src/utils/Api', 'src/utils/auth', 'src/utils/Cards']
        },
        // Fix production module format issues
        format: 'es',
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]'
      },
      // Fix external dependencies in production
      external: [],
      // Ensure proper module resolution
      treeshake: {
        moduleSideEffects: false
      }
    },
    // Optimize chunk size
    chunkSizeWarningLimit: 1000,
    // Enable compression with proper options
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: false,
        drop_debugger: true
      },
      format: {
        comments: false
      }
    },
    // Optimize asset handling
    assetsInlineLimit: 4096,
    // Enable source maps for production debugging
    sourcemap: false,
    // Optimize CSS code splitting
    cssCodeSplit: true,
    // Target modern browsers for better optimization
    target: 'es2020',
    // Fix MIME type issues
    assetsDir: 'assets'
  },
  // Enable tree shaking and dependency optimization
  optimizeDeps: {
    include: [
      'react', 
      'react-dom', 
      'react-router',
      'hoist-non-react-statics',
      'buffer'
    ],
    exclude: ['@iconify/react', '@emotion/react', '@emotion/styled'],
    // Force re-bundling of problematic dependencies
    force: true
  },
  // Performance optimizations
  server: {
    fs: {
      // Allow serving files from one level up to the project root
      allow: ['..']
    }
  },
  // Fix emotion and other dependency issues
  define: {
    global: 'globalThis'
  },
  // Ensure proper ESM handling
  esbuild: {
    target: 'es2020',
    format: 'esm'
  }
})