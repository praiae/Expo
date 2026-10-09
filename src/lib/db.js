// Base de dados SQLite (módulo nativo do Node) + encriptação de campos sensíveis.
import { DatabaseSync } from 'node:sqlite';
import { randomBytes, createCipheriv, createDecipheriv, createHmac, scryptSync, timingSafeEqual } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const DATA_DIR = resolve(process.env.DATA_DIR || join(process.cwd(), 'data'));
mkdirSync(DATA_DIR, { recursive: true });
export const DB_PATH = join(DATA_DIR, 'expo-connect.db');

// Chave mestra: variável APP_SECRET ou ficheiro gerado no primeiro arranque.
function carregarSegredo() {
  if (process.env.APP_SECRET) return process.env.APP_SECRET;
  const f = join(DATA_DIR, 'secret.key');
  if (!existsSync(f)) writeFileSync(f, randomBytes(32).toString('hex'), { mode: 0o600 });
  return readFileSync(f, 'utf8').trim();
}
const SEGREDO = carregarSegredo();
const CHAVE_AES = scryptSync(SEGREDO, 'expo-connect:aes', 32);
const CHAVE_HMAC = scryptSync(SEGREDO, 'expo-connect:hmac', 32);

export function encriptar(texto) {
  if (texto == null || texto === '') return null;
  const iv = randomBytes(12);
  const c = createCipheriv('aes-256-gcm', CHAVE_AES, iv);
  const dados = Buffer.concat([c.update(String(texto), 'utf8'), c.final()]);
  return Buffer.concat([iv, c.getAuthTag(), dados]).toString('base64');
}

export function desencriptar(b64) {
  if (!b64) return '';
  try {
    const buf = Buffer.from(b64, 'base64');
    const d = createDecipheriv('aes-256-gcm', CHAVE_AES, buf.subarray(0, 12));
    d.setAuthTag(buf.subarray(12, 28));
    return Buffer.concat([d.update(buf.subarray(28)), d.final()]).toString('utf8');
  } catch {
    return '';
  }
}

// Hash determinístico do BI: permite garantir unicidade e pesquisar sem guardar o BI em claro.
export function hashBI(bi) {
  const n = String(bi || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
  return n ? createHmac('sha256', CHAVE_HMAC).update(n).digest('hex') : null;
}

export function hashPassword(pw) {
  const salt = randomBytes(16);
  return `${salt.toString('hex')}:${scryptSync(pw, salt, 64).toString('hex')}`;
}
export function verificarPassword(pw, guardado) {
  const [salt, hash] = String(guardado).split(':');
  if (!salt || !hash) return false;
  const calc = scryptSync(pw, Buffer.from(salt, 'hex'), 64);
  return timingSafeEqual(calc, Buffer.from(hash, 'hex'));
}

const SCHEMA = `
PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS utilizadores (
  id INTEGER PRIMARY KEY,
  nome TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE COLLATE NOCASE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin','tecnico','analista','gestor','externo')),
  ativo INTEGER NOT NULL DEFAULT 1,
  pessoa_id INTEGER REFERENCES pessoas(id) ON DELETE SET NULL,
  criado_em TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS sessoes (
  token TEXT PRIMARY KEY,
  utilizador_id INTEGER NOT NULL REFERENCES utilizadores(id) ON DELETE CASCADE,
  expira_em TEXT NOT NULL
);

-- Tabela Pessoas (identificação). Campos de contacto e BI encriptados.
CREATE TABLE IF NOT EXISTS pessoas (
  id INTEGER PRIMARY KEY,
  nome TEXT NOT NULL,
  sexo TEXT,
  data_nascimento TEXT,
  bi_hash TEXT UNIQUE,
  bi_enc TEXT,
  telefone_enc TEXT,
  email_enc TEXT,
  morada_enc TEXT,
  provincia TEXT,
  municipio TEXT,
  bairro TEXT,
  consentimento INTEGER NOT NULL DEFAULT 0,
  consentimento_em TEXT,
  estado TEXT NOT NULL DEFAULT 'pendente' CHECK (estado IN ('pendente','validado')),
  completo INTEGER NOT NULL DEFAULT 0,
  campos_em_falta TEXT,
  categoria TEXT,
  prioridade INTEGER,
  prioridade_pontos INTEGER,
  criado_por INTEGER REFERENCES utilizadores(id),
  validado_por INTEGER REFERENCES utilizadores(id),
  validado_em TEXT,
  criado_em TEXT NOT NULL DEFAULT (datetime('now')),
  atualizado_em TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS ix_pessoas_prov ON pessoas(provincia, municipio);
CREATE INDEX IF NOT EXISTS ix_pessoas_nome ON pessoas(nome COLLATE NOCASE);

-- Tabela Condições (condição pessoal, causa e funcionalidade)
CREATE TABLE IF NOT EXISTS condicoes (
  pessoa_id INTEGER PRIMARY KEY REFERENCES pessoas(id) ON DELETE CASCADE,
  pcd INTEGER DEFAULT 0, cego INTEGER DEFAULT 0, baixa_visao INTEGER DEFAULT 0, idoso INTEGER DEFAULT 0,
  cadeira_rodas INTEGER DEFAULT 0, muletas INTEGER DEFAULT 0, apoio_permanente INTEGER DEFAULT 0,
  apoio_parcial INTEGER DEFAULT 0, mobilidade_reduzida INTEGER DEFAULT 0,
  tipo_deficiencia TEXT, origem TEXT, causa TEXT, causa_outra TEXT, grau TEXT,
  desloca_sozinho INTEGER DEFAULT 0, ajuda_sair_casa INTEGER DEFAULT 0, apoio_transferencias INTEGER DEFAULT 0,
  sobe_escadas INTEGER DEFAULT 0, transporte_publico INTEGER DEFAULT 0, lim_membros_sup INTEGER DEFAULT 0,
  lim_visual INTEGER DEFAULT 0, lim_comunicacao INTEGER DEFAULT 0, tecnologia_assistiva INTEGER DEFAULT 0
);

-- Tabela Socioeconómica
CREATE TABLE IF NOT EXISTS socioeconomica (
  pessoa_id INTEGER PRIMARY KEY REFERENCES pessoas(id) ON DELETE CASCADE,
  nivel_academico TEXT, sabe_ler INTEGER, situacao_profissional TEXT,
  margem_salarial TEXT, fonte_rendimento TEXT, dependentes INTEGER
);

-- Tabela Procura
CREATE TABLE IF NOT EXISTS procura (
  pessoa_id INTEGER PRIMARY KEY REFERENCES pessoas(id) ON DELETE CASCADE,
  cadeira_manual INTEGER DEFAULT 0, cadeira_eletrica INTEGER DEFAULT 0, oculos_inteligentes INTEGER DEFAULT 0,
  adaptacao_automovel INTEGER DEFAULT 0, manutencao INTEGER DEFAULT 0,
  aquisicao_futura INTEGER DEFAULT 0, compra_imediata INTEGER DEFAULT 0, apoio_social INTEGER DEFAULT 0,
  servico_pretendido TEXT
);

-- Histórico de alterações por registo
CREATE TABLE IF NOT EXISTS historico (
  id INTEGER PRIMARY KEY,
  pessoa_id INTEGER NOT NULL REFERENCES pessoas(id) ON DELETE CASCADE,
  utilizador_id INTEGER REFERENCES utilizadores(id),
  acao TEXT NOT NULL,
  alteracoes TEXT,
  criado_em TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Auditoria de acessos
CREATE TABLE IF NOT EXISTS auditoria (
  id INTEGER PRIMARY KEY,
  utilizador_id INTEGER REFERENCES utilizadores(id),
  acao TEXT NOT NULL,
  alvo TEXT,
  ip TEXT,
  criado_em TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Tabela Relatórios
CREATE TABLE IF NOT EXISTS relatorios (
  id INTEGER PRIMARY KEY,
  data TEXT NOT NULL DEFAULT (datetime('now')),
  tipo TEXT NOT NULL,
  filtros TEXT,
  resultados TEXT,
  utilizador_id INTEGER REFERENCES utilizadores(id)
);

CREATE TABLE IF NOT EXISTS parametros (chave TEXT PRIMARY KEY, valor TEXT NOT NULL);

CREATE TABLE IF NOT EXISTS contactos (
  id INTEGER PRIMARY KEY, nome TEXT, email TEXT NOT NULL, organizacao TEXT, mensagem TEXT,
  criado_em TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Vista consolidada usada por filtros, estatísticas e relatórios.
CREATE VIEW IF NOT EXISTS v_pessoas AS
SELECT p.*,
  CAST((julianday('now') - julianday(p.data_nascimento)) / 365.25 AS INTEGER) AS idade,
  c.pcd, c.cego, c.baixa_visao, c.idoso, c.cadeira_rodas, c.muletas, c.apoio_permanente, c.apoio_parcial,
  c.mobilidade_reduzida, c.tipo_deficiencia, c.origem, c.causa, c.causa_outra, c.grau,
  c.desloca_sozinho, c.ajuda_sair_casa, c.apoio_transferencias, c.sobe_escadas, c.transporte_publico,
  c.lim_membros_sup, c.lim_visual, c.lim_comunicacao, c.tecnologia_assistiva,
  s.nivel_academico, s.sabe_ler, s.situacao_profissional, s.margem_salarial, s.fonte_rendimento, s.dependentes,
  r.cadeira_manual, r.cadeira_eletrica, r.oculos_inteligentes, r.adaptacao_automovel, r.manutencao,
  r.aquisicao_futura, r.compra_imediata, r.apoio_social, r.servico_pretendido
FROM pessoas p
LEFT JOIN condicoes c ON c.pessoa_id = p.id
LEFT JOIN socioeconomica s ON s.pessoa_id = p.id
LEFT JOIN procura r ON r.pessoa_id = p.id;
`;

// Pesos e limiares da classificação automática de prioridade (editáveis pelo administrador).
export const PARAMETROS_PADRAO = {
  pesos: {
    apoio_permanente: 3, apoio_parcial: 1, nao_desloca_sozinho: 2, ajuda_sair_casa: 2,
    apoio_transferencias: 2, lim_membros_sup: 1, lim_visual: 1, lim_comunicacao: 1,
    idoso: 1, precisa_produto: 2, manutencao: 1, sem_rendimento: 1, apoio_social: 1,
  },
  limiar_p1: 9,
  limiar_p2: 5,
};

let _db;
export function db() {
  if (_db) return _db;
  _db = new DatabaseSync(DB_PATH);
  _db.exec(SCHEMA);
  const temParams = _db.prepare('SELECT 1 FROM parametros WHERE chave = ?').get('prioridade');
  if (!temParams) {
    _db.prepare('INSERT INTO parametros (chave, valor) VALUES (?, ?)').run('prioridade', JSON.stringify(PARAMETROS_PADRAO));
  }
  const nUsers = _db.prepare('SELECT COUNT(*) n FROM utilizadores').get().n;
  if (nUsers === 0) {
    const email = process.env.ADMIN_EMAIL || 'admin@expoconnect.ao';
    const pw = process.env.ADMIN_PASSWORD || 'ExpoConnect2026!';
    _db.prepare('INSERT INTO utilizadores (nome, email, password_hash, role) VALUES (?, ?, ?, ?)')
      .run('Administrador', email, hashPassword(pw), 'admin');
    console.log(`[expo-connect] Administrador criado: ${email} / ${pw}  (altere a palavra-passe após o 1.º acesso)`);
  }
  return _db;
}

export function parametrosPrioridade() {
  const row = db().prepare('SELECT valor FROM parametros WHERE chave = ?').get('prioridade');
  const v = row ? JSON.parse(row.valor) : {};
  return { ...PARAMETROS_PADRAO, ...v, pesos: { ...PARAMETROS_PADRAO.pesos, ...(v.pesos || {}) } };
}

export function auditar(user, acao, alvo = null, ip = null) {
  db().prepare('INSERT INTO auditoria (utilizador_id, acao, alvo, ip) VALUES (?, ?, ?, ?)')
    .run(user?.id ?? null, acao, alvo, ip);
}

export function transacao(fn) {
  const d = db();
  d.exec('BEGIN');
  try {
    const r = fn(d);
    d.exec('COMMIT');
    return r;
  } catch (e) {
    d.exec('ROLLBACK');
    throw e;
  }
}
