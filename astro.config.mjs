// @ts-check
import { defineConfig } from 'astro/config';
import netlify from '@astrojs/netlify';
import { satteri } from '@astrojs/markdown-satteri';

// Domínios aceites no cabeçalho Host (verificação de origem dos formulários).
// No Netlify, URL e DEPLOY_PRIME_URL são definidos automaticamente durante o build.
const dominios = new Set(['localhost', '127.0.0.1', ...(process.env.ALLOWED_DOMAINS || '').split(',').map((d) => d.trim()).filter(Boolean)]);
for (const u of [process.env.SITE_URL, process.env.URL, process.env.DEPLOY_PRIME_URL]) if (u) dominios.add(new URL(u).hostname);

export default defineConfig({
  output: 'server',
  adapter: netlify({
    // PGlite só serve para desenvolvimento local; não entra na função de produção.
    excludeFiles: ['./node_modules/@electric-sql/pglite/**/*'],
    // Sem Edge Functions: não emular localmente.
    devFeatures: { edgeFunctions: false },
  }),
  // As sessões são próprias (tabela "sessoes"); as sessões do Astro (Netlify Blobs) não são usadas.
  session: false,
  site: process.env.SITE_URL || process.env.URL || undefined,
  security: {
    checkOrigin: true,
    allowedDomains: [...dominios].map((hostname) => ({ hostname })),
  },
  markdown: {
    // Notas de rodapé dos artigos usadas como lista de referências.
    processor: satteri({
      features: { gfm: { footnotes: { label: 'Referências', backLabel: 'Voltar à citação {reference} no texto' } } },
    }),
  },
  vite: { ssr: { external: ['pg', '@electric-sql/pglite'] } },
});
