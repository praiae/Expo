// Diagnóstico da configuração em produção. Não revela valores: apenas se existem.
import { db } from '../../lib/db.js';

export async function GET() {
  const env = (k) => !!(process.env[k] && process.env[k].trim());
  let adminsActivos = null;
  let erroBD = null;
  try {
    ({ n: adminsActivos } = await db.get("SELECT COUNT(*) n FROM utilizadores WHERE role = 'admin' AND ativo = 1"));
  } catch (e) {
    erroBD = String(e.message || e).slice(0, 200);
  }
  const corpo = {
    build: { commit: __BUILD_COMMIT__, data: __BUILD_DATA__ },
    variaveis: {
      ADMIN_EMAIL: env('ADMIN_EMAIL'),
      ADMIN_PASSWORD: env('ADMIN_PASSWORD'),
      ADMIN_REPOR: /^(sim|1|true)$/i.test(process.env.ADMIN_REPOR || ''),
      APP_SECRET: env('APP_SECRET'),
    },
    adminsActivos,
    erroBD,
  };
  return new Response(JSON.stringify(corpo, null, 2), {
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
  });
}
