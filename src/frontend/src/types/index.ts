export type Role = 'cliente' | 'admin';

export interface Usuario {
  id: number;
  nome: string;
  email: string;
  cpf?: string;
  dataNascimento?: string;
  role: Role;
}

export interface Produto {
  id: number;
  nome: string;
  categoria: string;
  preco: number;
  volumeMl: number | null;
  descricao: string | null;
  estoque: number;
  ativo: boolean;
  imagemUrl?: string | null; // caminho da foto (relativo à API); null = sem foto
}

export interface ApiErro {
  erro: string;
  detalhes?: { campo: string; mensagem: string }[];
}

export type StatusReserva = 'pendente' | 'pronta' | 'retirada' | 'expirada' | 'cancelada';

export interface ItemReserva {
  id: number;
  produtoId: number;
  quantidade: number;
  precoUnitario: number;
  produto?: { id: number; nome: string; categoria: string; volumeMl: number | null };
}

export interface Reserva {
  id: number;
  usuarioId: number;
  status: StatusReserva;
  retiradaPrevista: string; // ISO 8601
  expiraEm: string;
  total: number;
  createdAt: string;
  itens: ItemReserva[];
  usuario?: { id: number; nome: string; email: string }; // só vem na listagem do admin
}

export interface Categoria {
  id: number;
  nome: string;
}

export interface Movimentacao {
  id: number;
  produtoId: number;
  usuarioId: number | null;
  tipo: 'entrada' | 'saida' | 'reserva' | 'ajuste';
  quantidade: number;
  saldoAnterior: number;
  saldoPosterior: number;
  motivo: string | null;
  createdAt: string;
}
