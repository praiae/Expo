import { COOKIE_SESSAO, terminarSessao } from '../../lib/auth.js';
import { auditar } from '../../lib/db.js';

export async function POST({ cookies, locals, redirect }) {
  await terminarSessao(cookies.get(COOKIE_SESSAO)?.value);
  if (locals.user) await auditar(locals.user, 'Fim de sessão', null, locals.ip);
  cookies.delete(COOKIE_SESSAO, { path: '/' });
  return redirect('/app/login');
}
