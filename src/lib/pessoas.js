// Regras de negócio dos beneficiários: classificação, prioridade, validação e gravação.
import { db, encriptar, desencriptar, hashBI, parametrosPrioridade, transacao } from './db.js';
import { CONDICOES, FUNCIONALIDADE, PRODUTOS, INTENCAO, IDADE_IDOSO } from './constantes.js';

const BOOL_CONDICOES = [...Object.keys(CONDICOES), ...Object.keys(FUNCIONALIDADE)];
const BOOL_PROCURA = [...Object.keys(PRODUTOS), ...Object.keys(INTENCAO)];
const TXT_CONDICOES = ['tipo_deficiencia', 'origem', 'causa', 'causa_outra', 'grau'];
const TXT_SOCIO = ['nivel_academico', 'situacao_profissional', 'margem_salarial', 'fonte_rendimento'];

export function calcularIdade(dataNascimento) {
  if (!dataNascimento) return null;
  const d = new Date(dataNascimento);
  if (Number.isNaN(d.getTime())) return null;
  const hoje = new Date();
  let idade = hoje.getFullYear() - d.getFullYear();
  const m = hoje.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && hoje.getDate() < d.getDate())) idade--;
  return idade;
}

/** Converte o FormData do formulário de registo num objecto normalizado. */
export function lerFormulario(fd) {
  const t = (k) => String(fd.get(k) ?? '').trim();
  const b = (k) => (fd.get(k) ? 1 : 0);
  const p = {
    nome: t('nome'), sexo: t('sexo'), data_nascimento: t('data_nascimento'), bi: t('bi'),
    telefone: t('telefone'), email: t('email'), provincia: t('provincia'), municipio: t('municipio'),
    bairro: t('bairro'), morada: t('morada'), consentimento: b('consentimento'),
    servico_pretendido: t('servico_pretendido'),
    sabe_ler: fd.get('sabe_ler') === '' || fd.get('sabe_ler') == null ? null : Number(fd.get('sabe_ler')),
    dependentes: t('dependentes') === '' ? null : Math.max(0, parseInt(t('dependentes'), 10) || 0),
  };
  for (const k of BOOL_CONDICOES) p[k] = b(k);
  for (const k of BOOL_PROCURA) p[k] = b(k);
  for (const k of [...TXT_CONDICOES, ...TXT_SOCIO]) p[k] = t(k);
  const idade = calcularIdade(p.data_nascimento);
  if (idade != null && idade >= IDADE_IDOSO) p.idoso = 1;
  if (p.cego || p.baixa_visao) p.lim_visual = 1;
  return p;
}

export function categoriaEstatistica(p) {
  if (p.cego) return 'Cegueira';
  if (p.baixa_visao) return 'Baixa visão';
  if (p.cadeira_rodas) return 'Cadeirante';
  if (p.muletas) return 'Utilizador de muletas';
  if (p.pcd) return 'Outra deficiência';
  if (p.idoso) return 'Idoso';
  return 'Cliente individual';
}

/** Pontuação de prioridade segundo os pesos configurados (params obrigatório). Devolve { pontos, nivel, motivos }. */
export function calcularPrioridade(p, params) {
  const w = params.pesos;
  const motivos = [];
  let pontos = 0;
  const soma = (cond, peso, motivo) => { if (cond && peso) { pontos += peso; motivos.push(`${motivo} (+${peso})`); } };
  const precisaProduto = p.cadeira_manual || p.cadeira_eletrica || p.oculos_inteligentes || p.adaptacao_automovel;
  soma(p.apoio_permanente, w.apoio_permanente, 'Necessita de apoio permanente');
  soma(!p.apoio_permanente && p.apoio_parcial, w.apoio_parcial, 'Necessita de apoio parcial');
  soma(!p.desloca_sozinho, w.nao_desloca_sozinho, 'Não se desloca sozinho');
  soma(p.ajuda_sair_casa, w.ajuda_sair_casa, 'Precisa de ajuda para sair de casa');
  soma(p.apoio_transferencias, w.apoio_transferencias, 'Precisa de apoio para transferências');
  soma(p.lim_membros_sup, w.lim_membros_sup, 'Limitação nos membros superiores');
  soma(p.lim_visual, w.lim_visual, 'Limitação visual');
  soma(p.lim_comunicacao, w.lim_comunicacao, 'Limitação na comunicação');
  soma(p.idoso, w.idoso, 'Idoso');
  soma(precisaProduto, w.precisa_produto, 'Necessita de produto de apoio');
  soma(p.manutencao, w.manutencao, 'Precisa de manutenção/reparação');
  soma(p.margem_salarial === 'sem', w.sem_rendimento, 'Sem rendimento');
  soma(p.apoio_social, w.apoio_social, 'Precisa de apoio social para aquisição');
  const nivel = pontos >= params.limiar_p1 ? 1 : pontos >= params.limiar_p2 ? 2 : 3;
  return { pontos, nivel, motivos };
}

/** Campos obrigatórios para considerar o registo completo (regra: dados parciais são sinalizados). */
export function camposEmFalta(p) {
  const falta = [];
  const req = { nome: 'Nome', sexo: 'Sexo', data_nascimento: 'Data de nascimento', bi: 'BI', telefone: 'Telefone',
    provincia: 'Província', municipio: 'Município', situacao_profissional: 'Situação profissional',
    margem_salarial: 'Margem salarial' };
  for (const [k, rot] of Object.entries(req)) if (!p[k]) falta.push(rot);
  if (!Object.keys(CONDICOES).some((k) => p[k])) falta.push('Condição pessoal');
  if (!p.consentimento) falta.push('Consentimento');
  return falta;
}

export function validarFormulario(p) {
  const erros = {};
  if (!p.nome || p.nome.length < 3) erros.nome = 'Indique o nome completo.';
  if (p.data_nascimento) {
    const idade = calcularIdade(p.data_nascimento);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(p.data_nascimento) || idade == null || idade < 0 || idade > 120) {
      erros.data_nascimento = 'Data de nascimento inválida.';
    }
  }
  if (p.bi && !/^[0-9A-Za-z]{6,20}$/.test(p.bi.replace(/\s/g, ''))) erros.bi = 'Número do BI inválido.';
  if (p.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(p.email)) erros.email = 'E-mail inválido.';
  if (p.telefone && !/^[+0-9\s]{9,16}$/.test(p.telefone)) erros.telefone = 'Telefone inválido.';
  if (p.causa === 'Outra' && !p.causa_outra) erros.causa_outra = 'Descreva a causa.';
  return erros;
}

export async function biDuplicado(bi, excluirId = null) {
  const h = hashBI(bi);
  if (!h) return null;
  return (await db.get('SELECT id, nome FROM pessoas WHERE bi_hash = ? AND id IS DISTINCT FROM ?::int', h, excluirId)) || null;
}

function comSensiveis(p) {
  return {
    ...p,
    bi: desencriptar(p.bi_enc),
    telefone: desencriptar(p.telefone_enc),
    email: desencriptar(p.email_enc),
    morada: desencriptar(p.morada_enc),
  };
}

/** Obtém um beneficiário com campos desencriptados (para quem tem permissão). */
export async function obterPessoa(id, q = db) {
  const p = await q.get('SELECT * FROM v_pessoas WHERE id = ?', id);
  return p ? comSensiveis(p) : null;
}

const CAMPOS_HISTORICO = ['nome', 'sexo', 'data_nascimento', 'bi', 'telefone', 'email', 'provincia', 'municipio', 'bairro',
  'morada', 'consentimento', ...BOOL_CONDICOES, ...TXT_CONDICOES, ...TXT_SOCIO, 'sabe_ler', 'dependentes',
  ...BOOL_PROCURA, 'servico_pretendido'];
const SENSIVEIS = new Set(['bi', 'telefone', 'email', 'morada']);

function diferencas(antes, depois) {
  const d = {};
  for (const k of CAMPOS_HISTORICO) {
    const a = antes?.[k] ?? '';
    const n = depois[k] ?? '';
    if (String(a) !== String(n)) d[k] = SENSIVEIS.has(k) ? { de: '•••', para: '•••' } : { de: a, para: n };
  }
  return d;
}

const lista = (n, inicio = 1) => Array.from({ length: n }, (_, i) => `$${i + inicio}`).join(', ');
const actualizar = (cols) => cols.map((c) => `${c} = EXCLUDED.${c}`).join(', ');

/** Cria ou actualiza um beneficiário. Devolve o id. */
export async function gravarPessoa(p, user, id = null) {
  const prio = calcularPrioridade(p, await parametrosPrioridade());
  const falta = camposEmFalta(p);
  const categoria = categoriaEstatistica(p);
  const completo = falta.length ? 0 : 1;

  return transacao(async (tx) => {
    const antes = id ? await obterPessoa(id, tx) : null;
    const base = [p.nome, p.sexo || null, p.data_nascimento || null, hashBI(p.bi), encriptar(p.bi), encriptar(p.telefone),
      encriptar(p.email), encriptar(p.morada), p.provincia || null, p.municipio || null, p.bairro || null, p.consentimento,
      completo, falta.join(', ') || null, categoria, prio.nivel, prio.pontos];
    let pid = id;
    if (id) {
      // Uma alteração devolve o registo ao estado pendente se ficar incompleto.
      await tx.run(`UPDATE pessoas SET nome=?, sexo=?, data_nascimento=?::date, bi_hash=?, bi_enc=?, telefone_enc=?, email_enc=?,
        morada_enc=?, provincia=?, municipio=?, bairro=?, consentimento=?, completo=?, campos_em_falta=?, categoria=?,
        prioridade=?, prioridade_pontos=?, atualizado_em=agora(),
        consentimento_em = CASE WHEN ?::int = 1 AND consentimento_em IS NULL THEN agora() ELSE consentimento_em END,
        estado = CASE WHEN ?::int = 1 THEN estado ELSE 'pendente' END
        WHERE id=?`, ...base, p.consentimento, completo, id);
    } else {
      const r = await tx.get(`INSERT INTO pessoas (nome, sexo, data_nascimento, bi_hash, bi_enc, telefone_enc, email_enc,
        morada_enc, provincia, municipio, bairro, consentimento, completo, campos_em_falta, categoria, prioridade,
        prioridade_pontos, consentimento_em, criado_por)
        VALUES (?,?,?::date,?,?,?,?,?,?,?,?,?,?,?,?,?,?, CASE WHEN ?::int = 1 THEN agora() END, ?) RETURNING id`,
      ...base, p.consentimento, user?.id ?? null);
      pid = r.id;
    }
    const cc = [...BOOL_CONDICOES, ...TXT_CONDICOES];
    await tx.run(`INSERT INTO condicoes (pessoa_id, ${cc.join(',')}) VALUES (${lista(cc.length + 1)})
      ON CONFLICT (pessoa_id) DO UPDATE SET ${actualizar(cc)}`, pid, ...cc.map((k) => p[k] ?? null));
    const sc = ['nivel_academico', 'sabe_ler', 'situacao_profissional', 'margem_salarial', 'fonte_rendimento', 'dependentes'];
    await tx.run(`INSERT INTO socioeconomica (pessoa_id, ${sc.join(',')}) VALUES (${lista(sc.length + 1)})
      ON CONFLICT (pessoa_id) DO UPDATE SET ${actualizar(sc)}`, pid, ...sc.map((k) => (p[k] === '' ? null : p[k] ?? null)));
    const pc = [...BOOL_PROCURA, 'servico_pretendido'];
    await tx.run(`INSERT INTO procura (pessoa_id, ${pc.join(',')}) VALUES (${lista(pc.length + 1)})
      ON CONFLICT (pessoa_id) DO UPDATE SET ${actualizar(pc)}`, pid, ...pc.map((k) => p[k] ?? null));
    await tx.run('INSERT INTO historico (pessoa_id, utilizador_id, acao, alteracoes) VALUES (?, ?, ?, ?)',
      pid, user?.id ?? null, id ? 'Actualização' : 'Registo', JSON.stringify(diferencas(antes, p)));
    return pid;
  });
}

export async function validarRegisto(id, user) {
  const p = await db.get('SELECT completo, estado FROM pessoas WHERE id = ?', id);
  if (!p) return 'Registo não encontrado.';
  if (!p.completo) return 'Só registos completos podem ser validados.';
  if (p.estado === 'validado') return null;
  await transacao(async (tx) => {
    await tx.run("UPDATE pessoas SET estado='validado', validado_por=?, validado_em=agora() WHERE id=?", user.id, id);
    await tx.run('INSERT INTO historico (pessoa_id, utilizador_id, acao) VALUES (?, ?, ?)', id, user.id, 'Validação');
  });
  return null;
}

/** Recalcula prioridade e categoria de todos os registos (após mudança de parâmetros). */
export async function recalcularTodos() {
  const params = await parametrosPrioridade();
  const todos = await db.all('SELECT * FROM v_pessoas');
  if (!todos.length) return 0;
  // Uma única actualização em lote, em vez de uma consulta por registo.
  const dados = todos.map((p) => { const r = calcularPrioridade(p, params); return { id: p.id, n: r.nivel, pt: r.pontos, c: categoriaEstatistica(p) }; });
  await db.run(`UPDATE pessoas p SET prioridade = d.n, prioridade_pontos = d.pt, categoria = d.c
    FROM json_to_recordset(?::json) AS d(id int, n int, pt int, c text) WHERE p.id = d.id`, JSON.stringify(dados));
  return todos.length;
}
