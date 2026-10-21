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
}

export interface ApiErro {
  erro: string;
  detalhes?: { campo: string; mensagem: string }[];
}
