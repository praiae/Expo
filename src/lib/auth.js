// Sessões por cookie httpOnly guardadas na base de dados.
import { randomBytes } from 'node:crypto';
import { db, verificarPassword, auditar } from './db.js';

export const COOKIE_SESSAO = 'ec_sessao';
const DURACAO_HORAS = 12;

export function iniciarSessao(email, password, ip) {
  const u = db().prepare('SELECT * FROM utilizadores WHERE email = ?').get(String(email).trim());
  if (!u || !u.ativo || !verificarPassword(password, u.password_hash)) {
    auditar(u, 'Tentativa de acesso falhada', String(email).slice(0, 120), ip);
    return null;
  }
  const token = randomBytes(32).toString('hex');
  const expira = new Date(Date.now() + DURACAO_HORAS * 3600e3).toISOString();
  db().prepare('INSERT INTO sessoes (token, utilizador_id, expira_em) VALUES (?, ?, ?)').run(token, u.id, expira);
  auditar(u, 'Início de sessão', null, ip);
  return { token, expira };
}

export function utilizadorDaSessao(token) {
  if (!token) return null;
  const u = db().prepare(`SELECT u.id, u.nome, u.email, u.role, u.pessoa_id FROM sessoes s
    JOIN utilizadores u ON u.id = s.utilizador_id WHERE s.token = ? AND s.expira_em > ? AND u.ativo = 1`)
    .get(token, new Date().toISOString());
  return u || null;
}

export function terminarSessao(token) {
  if (token) db().prepare('DELETE FROM sessoes WHERE token = ?').run(token);
}

export function opcoesCookie(expira) {
  return {
    path: '/', httpOnly: true, sameSite: 'lax', secure: import.meta.env?.PROD ?? false,
    expires: expira ? new Date(expira) : undefined,
  };
}
