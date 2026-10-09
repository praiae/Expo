// Exportação para Excel. Estatísticas e microdados anonimizados: perfis com "relatorios".
// Os microdados omitem o município para reduzir o risco de reidentificação.
// Listas identificadas (com contactos): apenas "exportar.identificado".
import { db, desencriptar, auditar } from '../../lib/db.js';
import { lerFiltros, construirWhere } from '../../lib/filtros.js';
import { calcularEstatisticas } from '../../lib/estatisticas.js';
import { gerarXlsx } from '../../lib/xlsx.js';
import { pode, CONDICOES, FUNCIONALIDADE, PRODUTOS, INTENCAO, MARGENS_SALARIAIS } from '../../lib/constantes.js';

const SN = (v) => (v ? 'Sim' : 'Não');
const margem = (id) => MARGENS_SALARIAIS.find((m) => m.id === id)?.nome ?? '';

async function folhaEstatisticas(f) {
  const e = await calcularEstatisticas(f);
  const t = e.totais;
  const tabela = (nome, dados, col = 'Total') => ({ nome, linhas: [['Categoria', col], ...dados.map((d) => [d.nome ?? '—', d.valor])] });
  return [
    { nome: 'Resumo', linhas: [['Indicador', 'Valor'],
      ['Total de beneficiários validados', t.total], ['Pessoas com deficiência', t.pcd], ['Cegos', t.cegos],
      ['Baixa visão', t.baixaVisao], ['Idosos', t.idosos], ['Idosos com mobilidade reduzida', t.idososMobReduzida],
      ['Cadeirantes', t.cadeirantes], ['Utilizadores de muletas', t.muletas], ['Muletas com necessidade de apoio', t.muletasApoio],
      ['Prioridade 1', t.p1], ['Prioridade 2', t.p2], ['Prioridade 3', t.p3],
      ['Compra imediata', t.compraImediata], ['Aquisição futura', t.aquisicaoFutura], ['Necessita de apoio social', t.apoioSocial],
      [], ['Filtros aplicados', JSON.stringify(f)], ['Gerado em', new Date().toISOString()]] },
    tabela('Províncias', e.porProvincia),
    tabela('Municípios', e.porMunicipio),
    tabela('Categorias', e.porCategoria),
    tabela('Tipo de deficiência', e.porTipoDeficiencia),
    tabela('Causas', e.porCausa),
    tabela('Sexo', e.porSexo),
    tabela('Faixa etária', e.faixas),
    tabela('Situação profissional', e.porSituacao),
    tabela('Margem salarial', e.porMargem),
    { nome: 'Procura', linhas: [['Produto', 'Procura', 'Compra imediata'], ...e.procura.map((p) => [p.nome, p.valor, p.imediata])] },
    { nome: 'Rendimento por província', linhas: [['Província', 'Média estimada (Kz)', 'Respostas'], ...e.salarioPorProvincia.map((r) => [r.nome ?? '—', r.media, r.n])] },
  ];
}

function folhaAnonima(rows) {
  const cab = ['Código', 'Sexo', 'Idade', 'Província', 'Categoria', 'Prioridade', 'Tipo de deficiência', 'Causa', 'Grau',
    ...Object.values(CONDICOES), ...Object.values(FUNCIONALIDADE), 'Nível académico', 'Situação profissional', 'Margem salarial',
    'Dependentes', ...Object.values(PRODUTOS), ...Object.values(INTENCAO)];
  const linhas = rows.map((r, i) => [`R${String(i + 1).padStart(5, '0')}`, r.sexo, r.idade, r.provincia, r.categoria, r.prioridade,
    r.tipo_deficiencia, r.causa, r.grau, ...Object.keys(CONDICOES).map((k) => SN(r[k])), ...Object.keys(FUNCIONALIDADE).map((k) => SN(r[k])),
    r.nivel_academico, r.situacao_profissional, margem(r.margem_salarial), r.dependentes,
    ...Object.keys(PRODUTOS).map((k) => SN(r[k])), ...Object.keys(INTENCAO).map((k) => SN(r[k]))]);
  return [{ nome: 'Microdados', linhas: [cab, ...linhas] }];
}

function folhaIdentificada(rows, nome) {
  const cab = ['N.º', 'Nome', 'Sexo', 'Data de nascimento', 'Idade', 'BI', 'Telefone', 'E-mail', 'Província', 'Município', 'Bairro',
    'Categoria', 'Prioridade', 'Pontos', 'Estado', 'Completo', 'Produtos', 'Intenção', 'Margem salarial', 'Registado em'];
  const linhas = rows.map((r) => [r.id, r.nome, r.sexo, r.data_nascimento, r.idade, desencriptar(r.bi_enc), desencriptar(r.telefone_enc),
    desencriptar(r.email_enc), r.provincia, r.municipio, r.bairro, r.categoria, r.prioridade, r.prioridade_pontos, r.estado, SN(r.completo),
    Object.entries(PRODUTOS).filter(([k]) => r[k]).map(([, n]) => n).join('; '),
    Object.entries(INTENCAO).filter(([k]) => r[k]).map(([, n]) => n).join('; '), margem(r.margem_salarial), r.criado_em]);
  return [{ nome, linhas: [cab, ...linhas] }];
}

export async function GET({ url, locals }) {
  const user = locals.user;
  const tipo = url.searchParams.get('tipo') || 'estatisticas';
  const f = lerFiltros(url);
  let folhas;
  let identificado = false;

  if (tipo === 'estatisticas') {
    folhas = await folhaEstatisticas(f);
  } else if (tipo === 'anonimo') {
    const { sql, args } = construirWhere(f, { apenasValidados: true });
    // Ordem aleatória para não ser possível reconstruir a sequência de registo.
    folhas = folhaAnonima(await db.all(`SELECT * FROM v_pessoas ${sql} ORDER BY random()`, ...args));
  } else if (tipo === 'lista' || tipo === 'clientes') {
    if (!pode(user, 'exportar.identificado')) return new Response('Exportação identificada não autorizada para o seu perfil.', { status: 403 });
    identificado = true;
    if (tipo === 'lista') {
      const { sql, args } = construirWhere(f);
      folhas = folhaIdentificada(await db.all(`SELECT * FROM v_pessoas ${sql} ORDER BY nome`, ...args), 'Beneficiários');
    } else {
      const { sql, args } = construirWhere(f, { apenasValidados: true });
      const intencao = url.searchParams.get('intencao');
      const extra = [`(${Object.keys(PRODUTOS).map((k) => `${k} = 1`).join(' OR ')})`, INTENCAO[intencao] ? `${intencao} = 1` : null]
        .filter(Boolean).join(' AND ');
      folhas = folhaIdentificada(await db.all(`SELECT * FROM v_pessoas ${sql} ${sql ? 'AND' : 'WHERE'} ${extra} ORDER BY nome`, ...args), 'Clientes');
    }
  } else {
    return new Response('Tipo de exportação desconhecido.', { status: 400 });
  }

  await auditar(user, identificado ? 'Exportação de dados identificados' : 'Exportação estatística', `${tipo} ${JSON.stringify(f)}`, locals.ip);
  const data = new Date().toISOString().slice(0, 10);
  return new Response(gerarXlsx(folhas), {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="expo-connect-${tipo}-${data}.xlsx"`,
    },
  });
}
