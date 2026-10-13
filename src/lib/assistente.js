// Motor do assistente: escolhe a entrada da base de conhecimento que melhor responde a uma pergunta.
// Sem servidores nem IA externa: correspondência de termos com peso pela raridade de cada palavra.
import { BASE } from './assistente-base.js';

const VAZIAS = new Set(('a o as os um uma uns umas de do da dos das no na nos nas em por para pra com sem e ou que qual quais ' +
  'como onde quando quem porque porquê eu tu ele ela nos vos eles elas me te se lhe meu minha meus minhas seu sua teu tua ' +
  'isto isso aquilo este esta esse essa ao aos à às é sou somos são ser estar está estou tem têm ter há fazer faço pode posso ' +
  'podem quero queria gostaria preciso precisa saber dizer diz mim voce você vocês favor por favor também mais muito já ' +
  'ainda so só nao não').split(' ').map(normalizar));

/** Minúsculas, sem acentos nem pontuação. */
export function normalizar(t) {
  return String(t).toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '').replace(/[^a-z0-9/]+/g, ' ').trim();
}
// Radical simples: retira plurais e algumas terminações comuns, para "registos" ≈ "registo".
const radical = (p) => (p.length > 4 ? p.replace(/(oes|aes|ais|eis|ns|es|s)$/, '') : p);
const palavras = (t) => normalizar(t).split(' ').filter((p) => p && !VAZIAS.has(p)).map(radical);

// Índice: palavras de cada entrada (termos + perguntas de exemplo) e frequência de cada palavra na base.
const INDICE = BASE.map((e) => ({
  e,
  frases: e.termos.map(normalizar).filter((t) => t.includes(' ')),
  chave: new Set(e.termos.flatMap(palavras)),
  exemplo: new Set(e.perguntas.flatMap(palavras)),
}));
const DF = new Map();
for (const { chave, exemplo } of INDICE) for (const p of new Set([...chave, ...exemplo])) DF.set(p, (DF.get(p) || 0) + 1);
const peso = (p) => 1 + Math.log(INDICE.length / (DF.get(p) || INDICE.length));

/** Devolve as entradas ordenadas por pontuação (só as que têm alguma relação com a pergunta). */
export function procurar(pergunta) {
  const texto = ` ${normalizar(pergunta)} `;
  const ps = [...new Set(palavras(pergunta))];
  const res = [];
  for (const { e, frases, chave, exemplo } of INDICE) {
    let s = 0;
    for (const f of frases) if (texto.includes(` ${f} `)) s += 2 + f.split(' ').length;   // expressão completa
    for (const p of ps) {
      if (chave.has(p)) s += 2 * peso(p);
      else if (exemplo.has(p)) s += peso(p);
      else if (p.length >= 5 && [...chave].some((c) => c.length >= 5 && (c.startsWith(p) || p.startsWith(c)))) s += peso(p);
    }
    if (s > 0) res.push({ e, s });
  }
  // Cumprimentos e agradecimentos só vencem quando a mensagem não pede mais nada.
  for (const r of res) if (['saudacao', 'agradecimento', 'despedida'].includes(r.e.id) && ps.length > 2) r.s *= 0.4;
  return res.sort((a, b) => b.s - a.s);
}

export const LIMIAR = 2.2;

/** Resposta final: entrada escolhida ou null (sem correspondência suficiente) + sugestões. */
export function responder(pergunta) {
  const r = procurar(pergunta);
  if (!r.length || r[0].s < LIMIAR) return { entrada: null, sugestoes: r.slice(0, 3).map((x) => x.e) };
  return { entrada: r[0].e, sugestoes: [] };
}

export const porId = (id) => BASE.find((e) => e.id === id);
