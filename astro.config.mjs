// @ts-check
import { defineConfig } from 'astro/config';
import node from '@astrojs/node';

// Domínios aceites no cabeçalho Host (necessário para a verificação de origem dos formulários).
// Ex.: ALLOWED_DOMAINS="expoconnect.ao,www.expoconnect.ao". O domínio de SITE_URL é incluído automaticamente.
const dominios = new Set(['localhost', '127.0.0.1', ...(process.env.ALLOWED_DOMAINS || '').split(',').map((d) => d.trim()).filter(Boolean)]);
if (process.env.SITE_URL) dominios.add(new URL(process.env.SITE_URL).hostname);

export default defineConfig({
  output: 'server',
  adapter: node({ mode: 'standalone' }),
  site: process.env.SITE_URL || undefined,
  security: {
    checkOrigin: true,
    allowedDomains: [...dominios].map((hostname) => ({ hostname })),
  },
  server: { host: process.env.HOST || 'localhost', port: Number(process.env.PORT) || 4321 },
  vite: { ssr: { external: ['node:sqlite'] } },
});
