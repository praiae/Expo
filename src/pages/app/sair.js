import { COOKIE_SESSAO, terminarSessao } from '../../lib/auth.js';
import { auditar } from '../../lib/db.js';

export function POST({ cookies, locals, redirect }) {
  terminarSessao(cookies.get(COOKIE_SESSAO)?.value);
  if (locals.user) auditar(locals.user, 'Fim de sessão', null, locals.ip);
  cookies.delete(COOKIE_SESSAO, { path: '/' });
  return redirect('/app/login');
}
