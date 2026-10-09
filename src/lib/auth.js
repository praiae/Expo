// Sessões por cookie httpOnly guardadas na base de dados.
import { randomBytes } from 'node:crypto';
import { db, verificarPassword, auditar } from './db.js';

export const COOKIE_SESSAO = 'ec_sessao';
const DURACAO_HORAS = 12;

export async function iniciarSessao(email, password, ip) {
  const u = await db.get('SELECT * FROM utilizadores WHERE lower(email) = lower(?)', String(email).trim());
  if (!u || !u.ativo || !verificarPassword(password, u.password_hash)) {
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
