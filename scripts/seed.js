// Dados de demonstração: utilizadores por perfil e beneficiários fictícios.
// Uso: npm run seed [-- N]   (por omissão 300 registos). Não usar em produção.
import { db, hashPassword } from '../src/lib/db.js';
import { gravarPessoa, validarRegisto } from '../src/lib/pessoas.js';
import {
  NOMES_PROVINCIAS, CAUSAS, TIPOS_DEFICIENCIA, GRAUS, NIVEIS_ACADEMICOS, SITUACOES_PROFISSIONAIS, MARGENS_SALARIAIS, FONTES_RENDIMENTO,
} from '../src/lib/constantes.js';

const N = Number(process.argv[2]) || 300;
const SENHA = 'Demo2026!Expo';
const r = Math.random;
const um = (a) => a[Math.floor(r() * a.length)];
const prob = (p) => (r() < p ? 1 : 0);

const MUNICIPIOS = {
  Luanda: ['Luanda', 'Belas', 'Cazenga', 'Kilamba Kiaxi', 'Talatona', 'Viana', 'Cacuaco'],
  Benguela: ['Benguela', 'Lobito', 'Catumbela', 'Baía Farta'], Huambo: ['Huambo', 'Caála', 'Bailundo'],
  Huíla: ['Lubango', 'Chibia', 'Matala'], 'Cuanza Sul': ['Sumbe', 'Porto Amboim', 'Gabela'], Bié: ['Cuíto', 'Andulo'],
  Malanje: ['Malanje', 'Cacuso'], Uíge: ['Uíge', 'Negage'], Cabinda: ['Cabinda', 'Cacongo'],
};
// Peso aproximado da população por província para uma distribuição realista.
const PESO = { Luanda: 30, 'Icolo e Bengo': 3, Benguela: 9, Huambo: 8, Huíla: 8, 'Cuanza Sul': 7, Bié: 5, Uíge: 5, Malanje: 4 };
const sacoProv = NOMES_PROVINCIAS.flatMap((p) => Array(PESO[p] || 2).fill(p));
const NOMES_M = ['João', 'António', 'Manuel', 'Pedro', 'Domingos', 'Francisco', 'Paulo', 'José', 'Afonso', 'Mateus', 'Adão', 'Lucas'];
const NOMES_F = ['Maria', 'Ana', 'Teresa', 'Luísa', 'Esperança', 'Joana', 'Rosa', 'Fátima', 'Isabel', 'Helena', 'Madalena', 'Celeste'];
const APELIDOS = ['da Silva', 'dos Santos', 'Fernandes', 'Domingos', 'Kiala', 'Mbala', 'Tchissola', 'Kanda', 'Neto', 'Sebastião', 'Lopes',
  'Cassoma', 'Chilala', 'Sapalo', 'Ngola', 'Pinto', 'Muachingue', 'Kapinga'];

function data(minIdade, maxIdade) {
  const idade = minIdade + r() * (maxIdade - minIdade);
  const d = new Date(Date.now() - idade * 365.25 * 864e5);
  return d.toISOString().slice(0, 10);
}

function pessoaFicticia(i) {
  const sexo = r() < 0.5 ? 'Masculino' : 'Feminino';
  const tipo = um(['cego', 'baixa_visao', 'cadeira', 'muletas', 'motora', 'idoso', 'idoso', 'auditiva']);
  const idoso = tipo === 'idoso' || r() < 0.12;
  const provincia = um(sacoProv);
  const p = {
    nome: `${um(sexo === 'Masculino' ? NOMES_M : NOMES_F)} ${um(APELIDOS)} ${um(APELIDOS)}`,
    sexo, data_nascimento: idoso ? data(60, 92) : data(8, 59),
    bi: `00${String(1000000 + i * 7919).slice(-7)}${um(['LA', 'BA', 'HO', 'HA'])}0${String(i).padStart(2, '0').slice(-2)}`,
    telefone: `+244 9${Math.floor(10 + r() * 89)} ${Math.floor(100 + r() * 899)} ${Math.floor(100 + r() * 899)}`,
    email: r() < 0.3 ? `pessoa${i}@exemplo.ao` : '',
    provincia, municipio: um(MUNICIPIOS[provincia] || [provincia]), bairro: `Bairro ${Math.floor(1 + r() * 30)}`, morada: `Rua ${Math.floor(1 + r() * 200)}`,
    consentimento: prob(0.95),
    pcd: tipo !== 'idoso' ? 1 : prob(0.3), cego: tipo === 'cego' ? 1 : 0, baixa_visao: tipo === 'baixa_visao' ? 1 : 0, idoso: idoso ? 1 : 0,
    cadeira_rodas: tipo === 'cadeira' ? 1 : 0, muletas: tipo === 'muletas' ? 1 : 0,
    apoio_permanente: prob(tipo === 'cadeira' ? 0.4 : 0.12), apoio_parcial: prob(0.35),
    mobilidade_reduzida: ['cadeira', 'muletas', 'motora'].includes(tipo) || (idoso && r() < 0.6) ? 1 : 0,
    tipo_deficiencia: { cego: 'Visual', baixa_visao: 'Visual', cadeira: 'Motora', muletas: 'Motora', motora: 'Motora', auditiva: 'Auditiva' }[tipo] || '',
    origem: tipo === 'idoso' ? '' : um(['Congénita', 'Adquirida', 'Adquirida']),
    causa: tipo === 'idoso' ? '' : um(CAUSAS.filter((c) => c !== 'Outra')), causa_outra: '', grau: tipo === 'idoso' ? '' : um(GRAUS),
    desloca_sozinho: tipo === 'cadeira' ? prob(0.3) : prob(0.65), ajuda_sair_casa: prob(tipo === 'cadeira' ? 0.6 : 0.25),
    apoio_transferencias: prob(tipo === 'cadeira' ? 0.5 : 0.1), sobe_escadas: prob(tipo === 'cadeira' ? 0.02 : 0.5),
    transporte_publico: prob(0.4), lim_membros_sup: prob(0.1), lim_visual: 0, lim_comunicacao: prob(tipo === 'auditiva' ? 0.8 : 0.05),
    tecnologia_assistiva: prob(0.3),
    nivel_academico: um(NIVEIS_ACADEMICOS), sabe_ler: prob(0.7), situacao_profissional: idoso ? um(['Reformado', 'Desempregado']) : um(SITUACOES_PROFISSIONAIS),
    margem_salarial: um([...MARGENS_SALARIAIS, MARGENS_SALARIAIS[0], MARGENS_SALARIAIS[1]]).id, fonte_rendimento: um(FONTES_RENDIMENTO),
    dependentes: Math.floor(r() * 6),
    cadeira_manual: prob(tipo === 'cadeira' ? 0.6 : 0.08), cadeira_eletrica: prob(tipo === 'cadeira' ? 0.3 : 0.02),
    oculos_inteligentes: prob(tipo === 'cego' ? 0.7 : tipo === 'baixa_visao' ? 0.5 : 0), adaptacao_automovel: prob(0.04),
    manutencao: prob(tipo === 'cadeira' ? 0.35 : 0.05), aquisicao_futura: prob(0.4), compra_imediata: prob(0.12), apoio_social: prob(0.45),
    servico_pretendido: '',
  };
  if (p.cego || p.baixa_visao) p.lim_visual = 1;
  // Alguns registos ficam propositadamente incompletos.
  if (r() < 0.08) { p.telefone = ''; p.margem_salarial = ''; }
  return p;
}

const d = db();
const DEMO = [
  ['Técnica de Registo', 'tecnico@expoconnect.ao', 'tecnico'],
  ['Analista Estatístico', 'analista@expoconnect.ao', 'analista'],
  ['Gestor do Projecto', 'gestor@expoconnect.ao', 'gestor'],
];
for (const [nome, email, role] of DEMO) {
  if (!d.prepare('SELECT 1 FROM utilizadores WHERE email = ?').get(email)) {
    d.prepare('INSERT INTO utilizadores (nome, email, password_hash, role) VALUES (?, ?, ?, ?)').run(nome, email, hashPassword(SENHA), role);
  }
}
const tecnico = d.prepare('SELECT * FROM utilizadores WHERE email = ?').get('tecnico@expoconnect.ao');

const inicio = d.prepare('SELECT COUNT(*) n FROM pessoas').get().n;
let validados = 0;
for (let i = inicio + 1; i <= inicio + N; i++) {
  const id = gravarPessoa(pessoaFicticia(i), tecnico);
  // Espalha as datas de registo pelos últimos 12 meses.
  const quando = new Date(Date.now() - r() * 365 * 864e5).toISOString().slice(0, 19).replace('T', ' ');
  d.prepare('UPDATE pessoas SET criado_em = ?, atualizado_em = ? WHERE id = ?').run(quando, quando, id);
  if (r() < 0.85 && !validarRegisto(id, tecnico)) validados++;
}

const primeiro = d.prepare('SELECT id FROM pessoas ORDER BY id LIMIT 1').get();
if (primeiro && !d.prepare('SELECT 1 FROM utilizadores WHERE email = ?').get('beneficiario@expoconnect.ao')) {
  d.prepare('INSERT INTO utilizadores (nome, email, password_hash, role, pessoa_id) VALUES (?, ?, ?, ?, ?)')
    .run('Beneficiário de demonstração', 'beneficiario@expoconnect.ao', hashPassword(SENHA), 'externo', primeiro.id);
}

console.log(`${N} registos criados (${validados} validados).`);
console.log(`Utilizadores de demonstração (palavra-passe "${SENHA}"): ${[...DEMO.map((x) => x[1]), 'beneficiario@expoconnect.ao'].join(', ')}`);
