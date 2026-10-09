// Módulo estatístico (secção 5.8) e indicadores estratégicos para a fábrica (secção 11).
import { db } from './db.js';
import { construirWhere } from './filtros.js';
import {
  NOMES_PROVINCIAS, FAIXAS_ETARIAS, MARGENS_SALARIAIS, PRODUTOS, SITUACOES_PROFISSIONAIS, SEXOS, CATEGORIAS, TIPOS_DEFICIENCIA,
} from './constantes.js';

const MEDIA_SQL = `CASE margem_salarial ${MARGENS_SALARIAIS.map((m) => `WHEN '${m.id}' THEN ${m.media}`).join(' ')} END`;

// Indicadores contados numa só consulta (COUNT ... FILTER) para reduzir idas à base de dados.
const INDICADORES = {
  total: 'TRUE',
  cegos: 'cego = 1',
  baixaVisao: 'baixa_visao = 1',
  idosos: 'idoso = 1',
  cadeirantes: 'cadeira_rodas = 1',
  muletas: 'muletas = 1',
  pcd: 'pcd = 1',
  p1: 'prioridade = 1',
  p2: 'prioridade = 2',
  p3: 'prioridade = 3',
  muletasApoio: 'muletas = 1 AND (apoio_permanente = 1 OR apoio_parcial = 1)',
  idososMobReduzida: 'idoso = 1 AND mobilidade_reduzida = 1',
  compraImediata: 'compra_imediata = 1',
  aquisicaoFutura: 'aquisicao_futura = 1',
  apoioSocial: 'apoio_social = 1',
  ...Object.fromEntries(Object.keys(PRODUTOS).flatMap((k) => [[`prod_${k}`, `${k} = 1`], [`imed_${k}`, `${k} = 1 AND compra_imediata = 1`]])),
  ...Object.fromEntries(FAIXAS_ETARIAS.map((fx, i) => [`faixa_${i}`, `idade BETWEEN ${fx.min} AND ${fx.max}`])),
};
const SQL_INDICADORES = Object.entries(INDICADORES).map(([k, cond]) => `COUNT(*) FILTER (WHERE ${cond}) AS "${k}"`).join(',\n  ');

async function agrupar(where, args, coluna, ordem = null) {
  const rows = await db.all(`SELECT ${coluna} k, COUNT(*) n FROM v_pessoas ${where} GROUP BY 1`, ...args);
  const mapa = new Map(rows.map((r) => [r.k, r.n]));
  if (!ordem) return rows.filter((r) => r.k != null).map((r) => ({ nome: r.k, valor: r.n })).sort((a, b) => b.valor - a.valor);
  return ordem.map((o) => ({ nome: o.nome ?? o, valor: mapa.get(o.id ?? o) || 0 }));
}

export async function calcularEstatisticas(filtros = {}) {
  const { sql: where, args } = construirWhere(filtros, { apenasValidados: true });
  const e = where ? `${where} AND` : 'WHERE';

  const [ind, porProvincia, porMunicipio, porCategoria, porTipoDeficiencia, porCausa, porSexo, porSituacao, porMargem,
    salarioPorProvincia, necessidade, mensal] = await Promise.all([
    db.get(`SELECT ${SQL_INDICADORES} FROM v_pessoas ${where}`, ...args),
    agrupar(where, args, 'provincia', NOMES_PROVINCIAS),
    agrupar(where, args, "provincia || ' — ' || municipio").then((r) => r.slice(0, 15)),
    agrupar(where, args, 'categoria', CATEGORIAS),
    agrupar(where, args, 'tipo_deficiencia', TIPOS_DEFICIENCIA),
    agrupar(where, args, 'causa'),
    agrupar(where, args, 'sexo', SEXOS),
    agrupar(where, args, 'situacao_profissional', SITUACOES_PROFISSIONAIS),
    agrupar(where, args, 'margem_salarial', MARGENS_SALARIAIS),
    db.all(`SELECT provincia nome, ROUND(AVG(${MEDIA_SQL})) media, COUNT(margem_salarial) n
      FROM v_pessoas ${e} margem_salarial IS NOT NULL GROUP BY provincia ORDER BY media DESC`, ...args),
    // "Onde se concentra a maior necessidade": casos P1 por província e município.
    db.all(`SELECT provincia, municipio, COUNT(*) n FROM v_pessoas ${e} prioridade = 1
      GROUP BY provincia, municipio ORDER BY n DESC LIMIT 8`, ...args),
    db.all(`SELECT substr(criado_em, 1, 7) mes, COUNT(*) n FROM v_pessoas ${where}
      GROUP BY 1 ORDER BY 1 DESC LIMIT 12`, ...args),
  ]);

  const totais = Object.fromEntries(Object.keys(INDICADORES).filter((k) => !/^(prod|imed|faixa)_/.test(k)).map((k) => [k, ind[k]]));
  const procura = Object.entries(PRODUTOS).map(([k, nome]) => ({ id: k, nome, valor: ind[`prod_${k}`], imediata: ind[`imed_${k}`] }));
  const faixas = FAIXAS_ETARIAS.map((fx, i) => ({ nome: fx.nome, valor: ind[`faixa_${i}`] }));

  return {
    totais,
    porProvincia,
    porMunicipio,
    porCategoria,
    porTipoDeficiencia,
    porCausa,
    porSexo,
    porSituacao,
    porMargem,
    porPrioridade: [
      { nome: 'P1 — Urgente', valor: totais.p1 },
      { nome: 'P2 — Moderada', valor: totais.p2 },
      { nome: 'P3 — Futura', valor: totais.p3 },
    ],
    faixas,
    procura,
    salarioPorProvincia,
    necessidade,
    mensal: mensal.reverse().map((r) => ({ nome: r.mes, valor: r.n })),
  };
}

export async function contagemPendentes() {
  return db.get(`SELECT COUNT(*) FILTER (WHERE estado = 'pendente') pendentes,
    COUNT(*) FILTER (WHERE completo = 0) incompletos, COUNT(*) total FROM pessoas`);
}

export const fmt = (n) => new Intl.NumberFormat('pt-AO').format(Math.round(n || 0));
export const pct = (n, t) => (t ? `${((n / t) * 100).toFixed(1).replace('.', ',')}%` : '0%');
