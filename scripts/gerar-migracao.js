// Gera a migração inicial da Netlify Database a partir de src/lib/esquema.js.
// Uso: npm run migracao. Alterações futuras ao esquema devem ir para NOVAS migrações
// (ex.: 0002_<descricao>.sql) e também para esquema.js, para manter o arranque local coerente.
import { writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { ESQUEMA } from '../src/lib/esquema.js';

const dir = 'netlify/database/migrations';
const ficheiro = `${dir}/0001_esquema_inicial.sql`;
if (existsSync(ficheiro) && !process.argv.includes('--forcar')) {
  console.error(`${ficheiro} já existe. Migrações já aplicadas não devem ser alteradas; crie uma nova (ou use --forcar).`);
  process.exit(1);
}
mkdirSync(dir, { recursive: true });
writeFileSync(ficheiro, `-- Gerado por scripts/gerar-migracao.js a partir de src/lib/esquema.js.\n${ESQUEMA.trim()}\n`);
console.log(`Escrito ${ficheiro}`);
