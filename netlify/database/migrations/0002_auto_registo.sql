-- Auto-registo: pedidos de conta ficam pendentes até um administrador aprovar.
ALTER TABLE utilizadores ADD COLUMN IF NOT EXISTS pendente INTEGER NOT NULL DEFAULT 0;
ALTER TABLE utilizadores ADD COLUMN IF NOT EXISTS perfil_pedido TEXT;
ALTER TABLE utilizadores ADD COLUMN IF NOT EXISTS organizacao TEXT;
ALTER TABLE utilizadores ADD COLUMN IF NOT EXISTS justificacao TEXT;
ALTER TABLE utilizadores ADD COLUMN IF NOT EXISTS aprovado_por INTEGER;
ALTER TABLE utilizadores ADD COLUMN IF NOT EXISTS aprovado_em TEXT;
