# Expo Connect Angola

Plataforma de acessibilidade e inclusão: registo, estatística, prioridade de atendimento e procura de produtos de apoio
para pessoas com deficiência, idosos e pessoas com mobilidade reduzida nas 21 províncias de Angola.

Construída com [Astro](https://astro.build) 7 (modo servidor) e Postgres. Em produção corre no **Netlify**
com a **Netlify Database**; localmente usa um Postgres embutido (PGlite), sem nada para instalar.

## Desenvolvimento local

Requisitos: Node.js 22.12 ou superior.

```bash
npm install
npm run seed     # opcional: 300 registos fictícios + utilizadores de demonstração
npm run dev      # http://localhost:4321
```

A base local fica em `data/pglite` e a chave de encriptação em `data/secret.key` (ambas fora do git).
Administrador local: `admin@expoconnect.ao` / `ExpoConnect2026!`. Utilizadores de demonstração do `seed`:
`tecnico@`, `analista@`, `gestor@` e `beneficiario@expoconnect.ao`, com a palavra-passe `Demo2026!Expo`.

## Publicação no Netlify

O projecto já inclui `netlify.toml` e a migração inicial em `netlify/database/migrations/`.

1. **Variáveis de ambiente** (Project configuration → Environment variables), antes do primeiro deploy:
   - `APP_SECRET`: chave de encriptação, 64 caracteres hexadecimais. Gere-a com
     `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`.
     **Guarde-a também fora do Netlify**: sem ela os campos BI, telefone, e-mail e morada ficam ilegíveis.
   - `ADMIN_PASSWORD`: palavra-passe do administrador criado no primeiro acesso.
   - `ADMIN_EMAIL` (opcional, por omissão `admin@expoconnect.ao`).
2. **Base de dados**: em Data & Storage → Database, crie a base de dados. No deploy seguinte o Netlify
   aplica as migrações antes de publicar.
3. **Deploy**: cada `git push` para `main` publica automaticamente.

Os campos de formulário são protegidos por verificação de origem; o domínio `*.netlify.app` e o domínio
principal do site são aceites automaticamente. Para outros domínios defina `ALLOWED_DOMAINS` (separados por vírgulas).

### Alterar o esquema da base de dados

Não altere `0001_esquema_inicial.sql` depois de aplicada. Crie uma nova migração
(`netlify/database/migrations/0002_<descricao>.sql`) e reflicta a alteração em `src/lib/esquema.js`,
que é usado pela base local.

## Blog científico

Os artigos são ficheiros Markdown em `src/content/artigos/`. Para publicar um novo, crie um ficheiro
(o nome do ficheiro passa a ser o endereço, ex.: `meu-artigo.md` → `/blog/meu-artigo`) com este cabeçalho:

```markdown
---
titulo: "Título do artigo"
subtitulo: "Opcional"
resumo: "Resumo de um parágrafo."
autores:
  - nome: "Nome do Autor"
    afiliacao: "Opcional"
data: 2026-10-09
categoria: "Investigação"   # Investigação, Tecnologia, Política pública, Dados e estatística, Notícias
palavrasChave: ["acessibilidade", "tecnologia"]
idioma: "pt-PT"
rascunho: false             # true esconde o artigo em produção
---

## 1. Introdução

Texto com uma referência.[^ref1]

[^ref1]: Autor, A. (2024). *Título da obra*. Editora.
```

As notas `[^...]` aparecem numeradas na secção «Referências». Depois de um `git push`, o Netlify publica o artigo.

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
- `netlify/database/migrations/` — migrações aplicadas pelo Netlify em cada deploy
- `scripts/seed.js` — dados de demonstração (só para a base local)
