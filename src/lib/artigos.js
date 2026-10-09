// Utilitários do blog: listagem, tempo de leitura, datas e citação.
import { getCollection } from 'astro:content';

/** Artigos publicados (sem rascunhos em produção), do mais recente para o mais antigo. */
export async function artigosPublicados() {
  const todos = await getCollection('artigos', ({ data }) => import.meta.env.DEV || !data.rascunho);
  return todos.sort((a, b) => b.data.data.getTime() - a.data.data.getTime());
}

/** Minutos de leitura estimados (≈ 200 palavras por minuto, sem contar as referências). */
export function tempoLeitura(corpo = '') {
  const texto = corpo.replace(/^\[\^[^\]]+\]:.*$/gm, '').replace(/[#>*_`[\]()-]/g, ' ');
  const palavras = texto.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(palavras / 200));
}

export const dataLonga = (d, idioma = 'pt-PT') => d.toLocaleDateString(idioma, { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
export const dataIso = (d) => d.toISOString().slice(0, 10);

/** "Praia, E." a partir de "Edmilson Praia". */
function apelidoIniciais(nome) {
  const partes = nome.trim().split(/\s+/);
  const apelido = partes.pop();
  return `${apelido}, ${partes.map((p) => `${p[0]}.`).join(' ')}`.trim();
}

/** Citação no estilo APA (7.ª edição) para um artigo do blog. */
export function citacaoAPA(artigo, url) {
  const { autores, data, titulo } = artigo.data;
  const nomes = autores.map((a) => apelidoIniciais(a.nome));
  const lista = nomes.length > 1 ? `${nomes.slice(0, -1).join(', ')}, & ${nomes.at(-1)}` : nomes[0];
  const dia = data.toLocaleDateString('pt-PT', { day: 'numeric', month: 'long', timeZone: 'UTC' });
  return `${lista} (${data.getUTCFullYear()}, ${dia}). ${titulo}. Expo Connect Angola. ${url}`;
}
