import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    const openAIProxyTarget = env.OPENAI_PROXY_TARGET || env.VITE_OPENAI_PROXY_TARGET || 'https://new.fastaicode.top';
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
        proxy: {
          '/api/openai': {
            target: openAIProxyTarget,
            changeOrigin: true,
            secure: true,
            rewrite: (proxyPath) => proxyPath.replace(/^\/api\/openai/, ''),
          },
        },
      },
      plugins: [react()],
      define: {
        'process.env.OPENAI_API_KEY': JSON.stringify(env.OPENAI_API_KEY || env.VITE_OPENAI_API_KEY || ''),
        'process.env.OPENAI_BASE_URL': JSON.stringify(env.OPENAI_BASE_URL || env.VITE_OPENAI_BASE_URL || '')
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
