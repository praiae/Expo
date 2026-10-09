// Feed RSS 2.0 do blog.
import { artigosPublicados } from '../../lib/artigos.js';

export const prerender = true;

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export async function GET({ site, url }) {
  const base = site ?? url.origin;
  const artigos = await artigosPublicados();
  const itens = artigos.map((a) => {
    const link = new URL(`/blog/${a.id}`, base).href;
    return `<item><title>${esc(a.data.titulo)}</title><link>${link}</link><guid>${link}</guid>
<pubDate>${a.data.data.toUTCString()}</pubDate><category>${esc(a.data.categoria)}</category>
<dc:creator>${esc(a.data.autores.map((x) => x.nome).join(', '))}</dc:creator><description>${esc(a.data.resumo)}</description></item>`;
  }).join('\n');
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:dc="http://purl.org/dc/elements/1.1/"><channel>
<title>Expo Connect Angola — Blog</title><link>${new URL('/blog', base).href}</link>
<description>Artigos sobre acessibilidade, tecnologias de apoio e inclusão.</description><language>pt</language>
${itens}
</channel></rss>`;
  return new Response(xml, { headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' } });
}
