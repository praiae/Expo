# Expo Connect Angola

Plataforma de acessibilidade e inclusão: registo, estatística, prioridade de atendimento e procura de produtos de apoio
para pessoas com deficiência, idosos e pessoas com mobilidade reduzida nas 21 províncias de Angola.

Construída com [Astro](https://astro.build) 7 (modo servidor, adaptador Node) e SQLite nativo do Node (`node:sqlite`).

## Requisitos

- Node.js 22.13 ou superior (recomendado 24)

## Arranque rápido

```bash
npm install
npm run seed     # opcional: 300 registos fictícios + utilizadores de demonstração
npm run dev      # http://localhost:4321
```

No primeiro arranque é criado o administrador `admin@expoconnect.ao` (palavra-passe em `ADMIN_PASSWORD`,
ou `ExpoConnect2026!` por omissão — altere-a de imediato). Os utilizadores de demonstração criados pelo `seed`
usam a palavra-passe `Demo2026!Expo`.

## Produção

```bash
cp .env.example .env   # defina SITE_URL, ALLOWED_DOMAINS, ADMIN_PASSWORD e APP_SECRET
npm run build
npm start
```

- `SITE_URL` e `ALLOWED_DOMAINS` são fixados no build; sem eles os formulários são rejeitados pela verificação de origem.
- A base de dados e a chave de encriptação ficam em `data/` (excluída do git). **Guarde a chave (`APP_SECRET` ou
  `data/secret.key`) em local seguro**: sem ela, BI, telefone, e-mail e morada não podem ser desencriptados.
- Cópias de segurança: Administração → Cópia de segurança.

## Perfis

| Perfil | Acesso |
| --- | --- |
| Administrador | Tudo, incluindo utilizadores, parâmetros, auditoria e cópias |
| Técnico de registo | Registar, editar e validar beneficiários |
| Analista estatístico | Painel, relatórios e exportações anonimizadas |
| Gestor do projecto | Consulta de registos, relatórios e exportações identificadas |
| Utilizador externo | Apenas os próprios dados |

## Estrutura

- `src/lib/` — base de dados, encriptação, sessões, regras de prioridade, estatísticas, exportação Excel
- `src/pages/` — site público (`/`) e área reservada (`/app`)
- `src/middleware.js` — autenticação e permissões por rota
- `scripts/seed.js` — dados de demonstração
