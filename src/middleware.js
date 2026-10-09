import { defineMiddleware } from 'astro:middleware';
import { COOKIE_SESSAO, utilizadorDaSessao } from './lib/auth.js';
import { pode } from './lib/constantes.js';

// Permissão exigida por prefixo de rota (a mais específica primeiro).
const ROTAS = [
  ['/app/utilizadores', 'administracao'],
  ['/app/auditoria', 'administracao'],
  ['/app/parametros', 'administracao'],
  ['/app/backup', 'administracao'],
  ['/app/contactos', 'administracao'],
  ['/app/beneficiarios/novo', 'beneficiarios.editar'],
  ['/app/beneficiarios', 'beneficiarios.ver'],
  ['/app/prioridades', 'beneficiarios.ver'],
  ['/app/clientes', 'beneficiarios.ver'],
  ['/app/relatorios', 'relatorios'],
  ['/app/exportar', 'relatorios'],
  ['/app/meus-dados', 'meus-dados'],
];

export const onRequest = defineMiddleware(async (ctx, next) => {
  const { pathname } = ctx.url;
  ctx.locals.user = utilizadorDaSessao(ctx.cookies.get(COOKIE_SESSAO)?.value);
  // clientAddress só usa X-Forwarded-For quando o Host foi validado (security.allowedDomains).
  try { ctx.locals.ip = ctx.clientAddress || null; } catch { ctx.locals.ip = null; }

  if (pathname.startsWith('/app') && pathname !== '/app/login') {
    const user = ctx.locals.user;
    if (!user) return ctx.redirect(`/app/login?r=${encodeURIComponent(pathname + ctx.url.search)}`);
    if (pathname === '/app' || pathname === '/app/') {
      if (user.role === 'externo') return ctx.redirect('/app/meus-dados');
    }
    const regra = ROTAS.find(([p]) => pathname.startsWith(p));
    if (regra && !pode(user, regra[1])) return new Response('Acesso não autorizado para o seu perfil.', { status: 403 });
    // Edição exige permissão de edição.
    if (/^\/app\/beneficiarios\/\d+\/editar/.test(pathname) && !pode(user, 'beneficiarios.editar')) {
      return new Response('Acesso não autorizado para o seu perfil.', { status: 403 });
    }
  }

  // Protecção CSRF simples: pedidos POST têm de vir do próprio site.
  if (ctx.request.method === 'POST') {
    const origem = ctx.request.headers.get('origin');
    if (origem && origem !== ctx.url.origin) return new Response('Origem inválida.', { status: 403 });
  }

  const res = await next();
  if (pathname.startsWith('/app')) {
    res.headers.set('Cache-Control', 'no-store');
    res.headers.set('X-Robots-Tag', 'noindex');
  }
  res.headers.set('X-Content-Type-Options', 'nosniff');
  res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  return res;
});
