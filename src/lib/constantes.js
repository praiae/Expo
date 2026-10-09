// Listas de referência usadas em formulários, filtros e estatísticas.

// 21 províncias (divisão político-administrativa em vigor desde 2025).
// x/y: posição aproximada numa grelha para o mapa de mosaicos.
export const PROVINCIAS = [
  { nome: 'Cabinda', x: 0, y: 0 },
  { nome: 'Zaire', x: 1, y: 1 },
  { nome: 'Uíge', x: 2, y: 1 },
  { nome: 'Bengo', x: 1, y: 2 },
  { nome: 'Luanda', x: 0, y: 2 },
  { nome: 'Icolo e Bengo', x: 0, y: 3 },
  { nome: 'Cuanza Norte', x: 2, y: 2 },
  { nome: 'Malanje', x: 3, y: 2 },
  { nome: 'Lunda Norte', x: 4, y: 2 },
  { nome: 'Cuanza Sul', x: 1, y: 3 },
  { nome: 'Lunda Sul', x: 4, y: 3 },
  { nome: 'Bié', x: 2, y: 4 },
  { nome: 'Moxico', x: 3, y: 4 },
  { nome: 'Moxico Leste', x: 4, y: 4 },
  { nome: 'Benguela', x: 0, y: 4 },
  { nome: 'Huambo', x: 1, y: 4 },
  { nome: 'Huíla', x: 1, y: 5 },
  { nome: 'Namibe', x: 0, y: 5 },
  { nome: 'Cuando', x: 3, y: 5 },
  { nome: 'Cubango', x: 2, y: 5 },
  { nome: 'Cunene', x: 1, y: 6 },
];
export const NOMES_PROVINCIAS = PROVINCIAS.map((p) => p.nome);

export const SEXOS = ['Masculino', 'Feminino'];

export const FAIXAS_ETARIAS = [
  { id: '0-17', nome: '0–17 anos', min: 0, max: 17 },
  { id: '18-35', nome: '18–35 anos', min: 18, max: 35 },
  { id: '36-59', nome: '36–59 anos', min: 36, max: 59 },
  { id: '60+', nome: '60 anos ou mais', min: 60, max: 200 },
];
export const IDADE_IDOSO = 60;

export const CAUSAS = [
  'Acidente de viação', 'Guerra', 'Doença', 'Poliomielite', 'AVC', 'Amputação',
  'Acidente de trabalho', 'Queda', 'Congénita', 'Outra',
];

export const TIPOS_DEFICIENCIA = ['Motora', 'Visual', 'Auditiva', 'Intelectual', 'Múltipla', 'Outra'];
export const GRAUS = ['Ligeiro', 'Moderado', 'Grave'];

// Campos booleanos agrupados por módulo (chave da coluna -> rótulo).
export const CONDICOES = {
  pcd: 'Pessoa com deficiência',
  cego: 'Pessoa cega',
  baixa_visao: 'Pessoa com baixa visão (albinismo)',
  idoso: 'Idoso',
  cadeira_rodas: 'Utilizador de cadeira de rodas',
  muletas: 'Utilizador de muletas',
  apoio_permanente: 'Necessita de apoio permanente',
  apoio_parcial: 'Necessita de apoio parcial',
  mobilidade_reduzida: 'Mobilidade reduzida',
};

export const FUNCIONALIDADE = {
  desloca_sozinho: 'Consegue deslocar-se sozinho',
  ajuda_sair_casa: 'Precisa de ajuda para sair de casa',
  apoio_transferencias: 'Precisa de apoio para transferências',
  sobe_escadas: 'Consegue subir escadas',
  transporte_publico: 'Consegue usar transporte público',
  lim_membros_sup: 'Tem limitação nos membros superiores',
  lim_visual: 'Tem limitação visual',
  lim_comunicacao: 'Tem limitação na comunicação',
  tecnologia_assistiva: 'Necessita de tecnologia assistiva',
};

export const PRODUTOS = {
  cadeira_manual: 'Cadeira de rodas manual',
  cadeira_eletrica: 'Cadeira de rodas eléctrica',
  oculos_inteligentes: 'Óculos inteligentes',
  adaptacao_automovel: 'Adaptação automóvel',
  manutencao: 'Manutenção / reparação',
};

export const INTENCAO = {
  aquisicao_futura: 'Pretende adquirir no futuro',
  compra_imediata: 'Tem capacidade de compra imediata',
  apoio_social: 'Precisa de apoio social para aquisição',
};

export const NIVEIS_ACADEMICOS = [
  'Sem escolaridade', 'Ensino primário', 'Ensino secundário (I ciclo)',
  'Ensino secundário (II ciclo)', 'Ensino técnico-profissional', 'Licenciatura', 'Pós-graduação',
];

export const SITUACOES_PROFISSIONAIS = ['Desempregado', 'Funcionário', 'Empreendedor', 'Estudante', 'Reformado'];

// Faixas de rendimento mensal em Kwanzas; "media" é o ponto médio usado para médias.
export const MARGENS_SALARIAIS = [
  { id: 'sem', nome: 'Sem rendimento', media: 0 },
  { id: 'ate50', nome: 'Até 50 000 Kz', media: 25000 },
  { id: '50-100', nome: '50 001 – 100 000 Kz', media: 75000 },
  { id: '100-250', nome: '100 001 – 250 000 Kz', media: 175000 },
  { id: '250-500', nome: '250 001 – 500 000 Kz', media: 375000 },
  { id: '500+', nome: 'Acima de 500 000 Kz', media: 750000 },
];

export const FONTES_RENDIMENTO = ['Salário', 'Negócio próprio', 'Pensão / reforma', 'Apoio familiar', 'Apoio social', 'Nenhuma', 'Outra'];

export const CATEGORIAS = ['Cegueira', 'Baixa visão', 'Cadeirante', 'Utilizador de muletas', 'Outra deficiência', 'Idoso', 'Cliente individual'];

export const PRIORIDADES = {
  1: { nome: 'Prioridade 1', desc: 'Urgente', classe: 'p1' },
  2: { nome: 'Prioridade 2', desc: 'Moderada', classe: 'p2' },
  3: { nome: 'Prioridade 3', desc: 'Futura ou preventiva', classe: 'p3' },
};

export const PERFIS = {
  admin: 'Administrador',
  tecnico: 'Técnico de registo',
  analista: 'Analista estatístico',
  gestor: 'Gestor do projecto',
  externo: 'Utilizador externo',
};

// Permissões por perfil (secção 3 do documento funcional).
const P = {
  dashboard: ['admin', 'tecnico', 'analista', 'gestor'],
  'beneficiarios.ver': ['admin', 'tecnico', 'gestor'],
  'beneficiarios.editar': ['admin', 'tecnico'],
  'beneficiarios.validar': ['admin', 'tecnico'],
  'dados.sensiveis': ['admin', 'tecnico', 'gestor'],
  relatorios: ['admin', 'analista', 'gestor'],
  'exportar.identificado': ['admin', 'gestor'],
  administracao: ['admin'],
  'meus-dados': ['externo'],
};
export function pode(user, permissao) {
  return !!user && (P[permissao] || []).includes(user.role);
}
