// Sessões por cookie httpOnly guardadas na base de dados.
import { randomBytes } from 'node:crypto';
import { db, verificarPassword, hashPassword, auditar } from './db.js';

export const COOKIE_SESSAO = 'ec_sessao';
const DURACAO_HORAS = 12;

export async function iniciarSessao(email, password, ip) {
  const u = await db.get('SELECT * FROM utilizadores WHERE lower(email) = lower(?)', String(email).trim());
  const passwordOk = !!u && verificarPassword(password, u.password_hash);
  // Só revela que a conta aguarda aprovação a quem sabe a palavra-passe (evita enumerar contas).
  if (passwordOk && u.pendente) return { pendente: true };
  if (!passwordOk || !u.ativo) {
    await auditar(u, 'Tentativa de acesso falhada', String(email).slice(0, 120), ip);
    return null;
  }
  const token = randomBytes(32).toString('hex');
  const expira = new Date(Date.now() + DURACAO_HORAS * 3600e3).toISOString();
  await db.run('INSERT INTO sessoes (token, utilizador_id, expira_em) VALUES (?, ?, ?)', token, u.id, expira);
  // Limpeza oportunista de sessões expiradas.
  await db.run('DELETE FROM sessoes WHERE expira_em < ?', new Date().toISOString());
  await auditar(u, 'Início de sessão', null, ip);
  return { token, expira };
}

export async function utilizadorDaSessao(token) {
  if (!token) return null;
  const u = await db.get(`SELECT u.id, u.nome, u.email, u.role, u.pessoa_id FROM sessoes s
    JOIN utilizadores u ON u.id = s.utilizador_id WHERE s.token = ? AND s.expira_em > ? AND u.ativo = 1`,
  token, new Date().toISOString());
  return u || null;
}

export async function terminarSessao(token) {
  if (token) await db.run('DELETE FROM sessoes WHERE token = ?', token);
}

export function opcoesCookie(expira) {
  return {
    path: '/', httpOnly: true, sameSite: 'lax', secure: import.meta.env?.PROD ?? false,
    expires: expira ? new Date(expira) : undefined,
  };
}

// Perfis que se podem pedir no auto-registo (nunca "admin").
export const PERFIS_PEDIDO = {
  externo: 'Beneficiário ou familiar',
  tecnico: 'Técnico de registo',
  analista: 'Analista estatístico',
  gestor: 'Gestor do projecto',
};

/**
 * Cria um pedido de conta: fica inactivo e pendente até aprovação, sempre com o perfil mínimo ("externo").
 * Devolve { ok: true } mesmo que o e-mail já exista, para não revelar contas registadas.
 */
export async function registarConta({ nome, email, password, perfil, organizacao, justificacao }, ip) {
  const existe = await db.get('SELECT 1 FROM utilizadores WHERE lower(email) = lower(?)', email);
  if (existe) {
    await auditar(null, 'Pedido de registo com e-mail existente', email.slice(0, 120), ip);
    return { ok: true };
  }
  await db.run(`INSERT INTO utilizadores (nome, email, password_hash, role, ativo, pendente, perfil_pedido, organizacao, justificacao)
    VALUES (?, ?, ?, 'externo', 0, 1, ?, ?, ?) ON CONFLICT ((lower(email))) DO NOTHING`, nome, email, hashPassword(password), perfil, organizacao || null, justificacao || null);
  await auditar(null, 'Pedido de registo', `${email.slice(0, 120)} (${perfil})`, ip);
  return { ok: true };
}

/** Limite simples contra abuso: pedidos de registo por IP na última hora. */
export async function registosRecentes(ip) {
  const { n } = await db.get(`SELECT COUNT(*) n FROM auditoria WHERE acao LIKE 'Pedido de registo%'
    AND criado_em > agora('-1 hour') AND (ip = ?::text OR ?::text IS NULL)`, ip, ip);
  return n;
}
