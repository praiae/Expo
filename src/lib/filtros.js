// Construção de filtros (WHERE) a partir dos parâmetros do URL, sobre a vista v_pessoas.
import { FAIXAS_ETARIAS, PRODUTOS, CONDICOES } from './constantes.js';
import { hashBI } from './db.js';

export const CHAVES_FILTRO = ['q', 'provincia', 'municipio', 'sexo', 'faixa', 'categoria', 'condicao', 'produto', 'prioridade', 'estado', 'situacao', 'completo'];

export function lerFiltros(url) {
  const f = {};
  for (const k of CHAVES_FILTRO) {
    const v = url.searchParams.get(k);
    if (v) f[k] = v.trim();
  }
  return f;
}

/**
 * @param {object} f filtros
 * @param {{ apenasValidados?: boolean }} opt as estatísticas só usam registos validados (regra de negócio)
 */
export function construirWhere(f, opt = {}) {
  const w = [];
  const a = [];
  if (opt.apenasValidados) w.push("estado = 'validado'");
  if (f.q) {
    const h = hashBI(f.q);
    w.push('(nome LIKE ? COLLATE NOCASE OR bi_hash = ?)');
    a.push(`%${f.q}%`, h);
  }
  if (f.provincia) { w.push('provincia = ?'); a.push(f.provincia); }
  if (f.municipio) { w.push('municipio LIKE ? COLLATE NOCASE'); a.push(`%${f.municipio}%`); }
  if (f.sexo) { w.push('sexo = ?'); a.push(f.sexo); }
  if (f.faixa) {
    const fx = FAIXAS_ETARIAS.find((x) => x.id === f.faixa);
    if (fx) { w.push('idade BETWEEN ? AND ?'); a.push(fx.min, fx.max); }
  }
  if (f.categoria) { w.push('categoria = ?'); a.push(f.categoria); }
  if (f.condicao && CONDICOES[f.condicao]) w.push(`${f.condicao} = 1`);
  if (f.produto && PRODUTOS[f.produto]) w.push(`${f.produto} = 1`);
  if (f.prioridade) { w.push('prioridade = ?'); a.push(Number(f.prioridade)); }
  if (f.estado && !opt.apenasValidados) { w.push('estado = ?'); a.push(f.estado); }
  if (f.situacao) { w.push('situacao_profissional = ?'); a.push(f.situacao); }
  if (f.completo === '0' || f.completo === '1') { w.push('completo = ?'); a.push(Number(f.completo)); }
  return { sql: w.length ? `WHERE ${w.join(' AND ')}` : '', args: a };
}

export function queryString(f, extra = {}) {
  const u = new URLSearchParams();
  for (const [k, v] of Object.entries({ ...f, ...extra })) if (v !== '' && v != null) u.set(k, v);
  const s = u.toString();
  return s ? `?${s}` : '';
}
