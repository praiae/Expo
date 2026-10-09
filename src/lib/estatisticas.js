// Módulo estatístico (secção 5.8) e indicadores estratégicos para a fábrica (secção 11).
import { db } from './db.js';
import { construirWhere } from './filtros.js';
import {
  NOMES_PROVINCIAS, FAIXAS_ETARIAS, MARGENS_SALARIAIS, PRODUTOS, SITUACOES_PROFISSIONAIS, SEXOS, CATEGORIAS, TIPOS_DEFICIENCIA,
} from './constantes.js';

const MEDIA_SQL = `CASE margem_salarial ${MARGENS_SALARIAIS.map((m) => `WHEN '${m.id}' THEN ${m.media}`).join(' ')} END`;

function contar(where, args, extra = '') {
  const sql = `SELECT COUNT(*) n FROM v_pessoas ${where} ${where ? 'AND' : 'WHERE'} ${extra || '1=1'}`;
  return db().prepare(sql).get(...args).n;
}

function agrupar(where, args, coluna, ordem = null) {
  const rows = db().prepare(`SELECT ${coluna} k, COUNT(*) n FROM v_pessoas ${where} GROUP BY k`).all(...args);
  const mapa = new Map(rows.map((r) => [r.k, r.n]));
  if (!ordem) return rows.filter((r) => r.k != null).map((r) => ({ nome: r.k, valor: r.n })).sort((a, b) => b.valor - a.valor);
  return ordem.map((o) => ({ nome: o.nome ?? o, valor: mapa.get(o.id ?? o) || 0 }));
}

export function calcularEstatisticas(filtros = {}) {
  const { sql: where, args } = construirWhere(filtros, { apenasValidados: true });
  const c = (extra) => contar(where, args, extra);

  const total = c();
  const totais = {
    total,
    cegos: c('cego = 1'),
    baixaVisao: c('baixa_visao = 1'),
    idosos: c('idoso = 1'),
    cadeirantes: c('cadeira_rodas = 1'),
    muletas: c('muletas = 1'),
    pcd: c('pcd = 1'),
    p1: c('prioridade = 1'),
    p2: c('prioridade = 2'),
    p3: c('prioridade = 3'),
    muletasApoio: c('muletas = 1 AND (apoio_permanente = 1 OR apoio_parcial = 1)'),
    idososMobReduzida: c('idoso = 1 AND mobilidade_reduzida = 1'),
    compraImediata: c('compra_imediata = 1'),
    aquisicaoFutura: c('aquisicao_futura = 1'),
    apoioSocial: c('apoio_social = 1'),
  };

  const procura = Object.entries(PRODUTOS).map(([k, nome]) => ({
    id: k, nome, valor: c(`${k} = 1`), imediata: c(`${k} = 1 AND compra_imediata = 1`),
  }));

  const faixas = FAIXAS_ETARIAS.map((fx) => ({ nome: fx.nome, valor: c(`idade BETWEEN ${fx.min} AND ${fx.max}`) }));

  const salarioPorProvincia = db().prepare(`SELECT provincia nome, ROUND(AVG(${MEDIA_SQL})) media, COUNT(margem_salarial) n
    FROM v_pessoas ${where} ${where ? 'AND' : 'WHERE'} margem_salarial IS NOT NULL GROUP BY provincia ORDER BY media DESC`).all(...args);

  // "Onde se concentra a maior necessidade": casos P1 por província e município.
  const necessidade = db().prepare(`SELECT provincia, municipio, COUNT(*) n FROM v_pessoas ${where} ${where ? 'AND' : 'WHERE'}
    prioridade = 1 GROUP BY provincia, municipio ORDER BY n DESC LIMIT 8`).all(...args);

  const mensal = db().prepare(`SELECT strftime('%Y-%m', criado_em) mes, COUNT(*) n FROM v_pessoas ${where}
    GROUP BY mes ORDER BY mes DESC LIMIT 12`).all(...args).reverse().map((r) => ({ nome: r.mes, valor: r.n }));

  return {
    totais,
    porProvincia: agrupar(where, args, 'provincia', NOMES_PROVINCIAS),
    porMunicipio: agrupar(where, args, "provincia || ' — ' || municipio").slice(0, 15),
    porCategoria: agrupar(where, args, 'categoria', CATEGORIAS),
    porTipoDeficiencia: agrupar(where, args, 'tipo_deficiencia', TIPOS_DEFICIENCIA),
    porCausa: agrupar(where, args, 'causa'),
    porSexo: agrupar(where, args, 'sexo', SEXOS),
    porSituacao: agrupar(where, args, 'situacao_profissional', SITUACOES_PROFISSIONAIS),
    porMargem: agrupar(where, args, 'margem_salarial', MARGENS_SALARIAIS),
    porPrioridade: [
      { nome: 'P1 — Urgente', valor: totais.p1 },
      { nome: 'P2 — Moderada', valor: totais.p2 },
      { nome: 'P3 — Futura', valor: totais.p3 },
    ],
    faixas,
    procura,
    salarioPorProvincia,
    necessidade,
    mensal,
  };
}

export function contagemPendentes() {
  return db().prepare(`SELECT
    SUM(estado = 'pendente') pendentes, SUM(completo = 0) incompletos, COUNT(*) total FROM pessoas`).get();
}

export const fmt = (n) => new Intl.NumberFormat('pt-AO').format(Math.round(n || 0));
export const pct = (n, t) => (t ? `${((n / t) * 100).toFixed(1).replace('.', ',')}%` : '0%');
