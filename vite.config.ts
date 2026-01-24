import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, (process as any).cwd(), '');

  return {
    plugins: [react()],
    
    // SERVER CONFIGURATION
    server: {
      port: 3000, 
      host: true, // Expose to Network
      strictPort: true,
      
      // PROXY FOR PHP BACKEND INTEGRATION
      // This is critical: It tells Vite to forward any request starting with /api
      // to the Apache/XAMPP server instead of trying to serve it locally.
      proxy: {
        '/api': {
          target: 'http://localhost', // Standard XAMPP/Apache address
          changeOrigin: true,
          secure: false,
          // IMPORTANT: If your project is inside C:/xampp/htdocs/buana-app/
          // You must rewrite the path to match the actual folder structure on Apache.
          // rewrite: (path) => path.replace(/^\/api/, '/buana-app/api')
        }
      }
    },

    // PATH ALIAS
    resolve: {
      alias: {
        '@': '/',
      },
    },

    // ENV VARIABLE HANDLING
    define: {
      'process.env': {
        ...process.env,
        ...env,
        API_KEY: env.API_KEY || process.env.API_KEY
      }
    }
  };
});