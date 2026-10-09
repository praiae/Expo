// Base de dados Postgres (Netlify Database em produção, PGlite local) + encriptação de campos sensíveis.
import { randomBytes, createCipheriv, createDecipheriv, createHmac, scryptSync, timingSafeEqual } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { ESQUEMA } from './esquema.js';

// PRODUCAO: código compilado pelo Astro (build). Scripts Node (seed) e "astro dev" não são produção.
const PRODUCAO = !!import.meta.env?.PROD;
const URL_EXPLICITO = process.env.DATABASE_URL || '';
const DATA_DIR = resolve(process.env.DATA_DIR || join(process.cwd(), 'data'));

// Chave mestra: APP_SECRET (obrigatória em produção) ou ficheiro local gerado no primeiro arranque.
function carregarSegredo() {
  if (process.env.APP_SECRET) return process.env.APP_SECRET;
  if (PRODUCAO || URL_EXPLICITO) {
    throw new Error('APP_SECRET não definida. Configure-a nas variáveis de ambiente (ex.: openssl rand -hex 32).');
  }
  mkdirSync(DATA_DIR, { recursive: true });
  const f = join(DATA_DIR, 'secret.key');
  if (!existsSync(f)) writeFileSync(f, randomBytes(32).toString('hex'), { mode: 0o600 });
  return readFileSync(f, 'utf8').trim();
}
let _chaves;
function chaves() {
  if (!_chaves) {
    const s = carregarSegredo();
    _chaves = { aes: scryptSync(s, 'expo-connect:aes', 32), hmac: scryptSync(s, 'expo-connect:hmac', 32) };
  }
  return _chaves;
}

export function encriptar(texto) {
  if (texto == null || texto === '') return null;
  const iv = randomBytes(12);
  const c = createCipheriv('aes-256-gcm', chaves().aes, iv);
  const dados = Buffer.concat([c.update(String(texto), 'utf8'), c.final()]);
  return Buffer.concat([iv, c.getAuthTag(), dados]).toString('base64');
}

export function desencriptar(b64) {
  if (!b64) return '';
  try {
    const buf = Buffer.from(b64, 'base64');
    const d = createDecipheriv('aes-256-gcm', chaves().aes, buf.subarray(0, 12));
    d.setAuthTag(buf.subarray(12, 28));
    return Buffer.concat([d.update(buf.subarray(28)), d.final()]).toString('utf8');
  } catch {
    return '';
  }
}

// Hash determinístico do BI: permite garantir unicidade e pesquisar sem guardar o BI em claro.
export function hashBI(bi) {
  const n = String(bi || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
  return n ? createHmac('sha256', chaves().hmac).update(n).digest('hex') : null;
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

// Converte marcadores "?" e "?N" (estilo SQLite) em "$N" (Postgres).
function pgSql(sql) {
  let i = 0;
  return sql.replace(/\?(\d+)?/g, (_, n) => `$${n ?? ++i}`);
}

/**
 * Motor: pg (Pool) com DATABASE_URL ou, em produção, a Netlify Database; senão PGlite (Postgres embutido) em data/pglite.
 * Ambos expõem query(texto, params) -> { rows, rowCount|affectedRows }.
 */
async function criarMotor() {
  let url = URL_EXPLICITO;
  if (!url && PRODUCAO) {
    const { getConnectionString } = await import('@netlify/database');
    url = getConnectionString(); // lança erro claro se a Netlify Database não estiver activa
  }
  if (url) {
    const { default: pg } = await import('pg');
    // COUNT/SUM devolvem bigint/numeric: converter para Number (os valores cabem com folga).
    pg.types.setTypeParser(20, (v) => (v === null ? null : Number(v)));
    pg.types.setTypeParser(1700, (v) => (v === null ? null : Number(v)));
    pg.types.setTypeParser(1082, (v) => v); // DATE como texto AAAA-MM-DD
    const pool = new pg.Pool({ connectionString: url, max: 3, idleTimeoutMillis: 10_000 });
    return {
      query: (t, p) => pool.query(t, p),
      fechar: () => pool.end(),
      async transacao(fn) {
        const c = await pool.connect();
        try {
          await c.query('BEGIN');
          const r = await fn({ query: (t, p) => c.query(t, p) });
          await c.query('COMMIT');
          return r;
        } catch (e) {
          await c.query('ROLLBACK').catch(() => {});
          throw e;
        } finally {
          c.release();
        }
      },
    };
  }
  // Nome do módulo numa variável para o bundler não o incluir no build de produção.
  const mod = '@electric-sql/pglite';
  const { PGlite, types } = await import(/* @vite-ignore */ mod);
  mkdirSync(DATA_DIR, { recursive: true });
  const num = (v) => (v === null ? null : Number(v));
  const lite = await PGlite.create(join(DATA_DIR, 'pglite'), {
    parsers: { [types.INT8]: num, [types.NUMERIC]: num, [types.DATE]: (v) => v },
  });
  const norm = (r) => ({ rows: r.rows, rowCount: r.affectedRows ?? r.rows.length });
  return {
    query: async (t, p) => norm(await lite.query(t, p)),
    fechar: () => lite.close(),
    transacao: (fn) => lite.transaction((tx) => fn({ query: async (t, p) => norm(await tx.query(t, p)) })),
  };
}

let _pronto;
function motor() {
  if (!_pronto) {
    _pronto = (async () => {
      const m = await criarMotor();
      // Bloqueio para evitar corridas entre instâncias que arrancam ao mesmo tempo.
      await m.transacao(async (tx) => {
        await tx.query('SELECT pg_advisory_xact_lock(724001)');
        // Na Netlify Database o esquema é aplicado pelas migrações (netlify/database/migrations) antes de cada deploy.
        if (!PRODUCAO || URL_EXPLICITO) {
          for (const instr of ESQUEMA.split(/;\s*\n(?=\s*(?:CREATE|ALTER|--))/)) if (instr.trim()) await tx.query(instr);
        }
        await tx.query('INSERT INTO parametros (chave, valor) VALUES ($1, $2) ON CONFLICT (chave) DO NOTHING',
          ['prioridade', JSON.stringify(PARAMETROS_PADRAO)]);
        const { rows } = await tx.query('SELECT COUNT(*) n FROM utilizadores');
        if (rows[0].n === 0) {
          const email = process.env.ADMIN_EMAIL || 'admin@expoconnect.ao';
          const pw = process.env.ADMIN_PASSWORD || (PRODUCAO || URL_EXPLICITO ? '' : 'ExpoConnect2026!');
          if (!pw) {
            console.error('[expo-connect] Nenhum administrador criado: defina ADMIN_PASSWORD nas variáveis de ambiente.');
          } else {
            await tx.query('INSERT INTO utilizadores (nome, email, password_hash, role) VALUES ($1, $2, $3, $4)',
              ['Administrador', email, hashPassword(pw), 'admin']);
            console.log(`[expo-connect] Administrador criado: ${email}${process.env.ADMIN_PASSWORD ? '' : ` / ${pw}`}`);
          }
        }
      });
      return m;
    })().catch((e) => { _pronto = null; throw e; });
  }
  return _pronto;
}

function api(q) {
  return {
    /** Todas as linhas. */
    all: async (sql, ...args) => (await q(pgSql(sql), args)).rows,
    /** Primeira linha (ou undefined). */
    get: async (sql, ...args) => (await q(pgSql(sql), args)).rows[0],
    /** Executa e devolve { changes, rows }. */
    run: async (sql, ...args) => { const r = await q(pgSql(sql), args); return { changes: r.rowCount, rows: r.rows }; },
  };
}

/** Acesso à base: await db.all/get/run(sql, ...args). */
export const db = api(async (t, p) => (await motor()).query(t, p));

/** Executa fn(tx) numa transacção; tx tem a mesma interface que db. */
export async function transacao(fn) {
  return (await motor()).transacao((c) => fn(api((t, p) => c.query(t, p))));
}

export async function parametrosPrioridade() {
  const row = await db.get('SELECT valor FROM parametros WHERE chave = ?', 'prioridade');
  const v = row ? JSON.parse(row.valor) : {};
  return { ...PARAMETROS_PADRAO, ...v, pesos: { ...PARAMETROS_PADRAO.pesos, ...(v.pesos || {}) } };
}

export async function auditar(user, acao, alvo = null, ip = null) {
  await db.run('INSERT INTO auditoria (utilizador_id, acao, alvo, ip) VALUES (?, ?, ?, ?)', user?.id ?? null, acao, alvo, ip);
}

/** Exporta todas as tabelas em JSON (cópia de segurança lógica). Campos sensíveis seguem encriptados. */
export async function exportarTudo() {
  const tabelas = ['utilizadores', 'pessoas', 'condicoes', 'socioeconomica', 'procura', 'historico', 'auditoria', 'relatorios', 'parametros', 'contactos'];
  const out = { versao: 1, gerado_em: new Date().toISOString(), tabelas: {} };
  for (const t of tabelas) {
    out.tabelas[t] = await db.all(t === 'pessoas'
      ? "SELECT *, to_char(data_nascimento, 'YYYY-MM-DD') data_nascimento FROM pessoas ORDER BY id"
      : `SELECT * FROM ${t}${t === 'parametros' ? '' : ' ORDER BY 1'}`);
  }
  return out;
}

/** Fecha recursos (usado por scripts). */
export async function fechar() {
  if (!_pronto) return;
  const m = await _pronto;
  _pronto = null;
  if (m.fechar) await m.fechar();
}
