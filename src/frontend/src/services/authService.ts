import { api, getErrorMessage } from '../lib/api';
import type { Usuario } from '../types';

// Chama o backend de verdade (Node/Express). O token JWT retornado é salvo
// pelo AuthContext; o interceptor em lib/api.ts já anexa esse token em toda
// requisição autenticada, então as funções abaixo não precisam recebê-lo.

export interface RegisterInput {
  nome: string;
  email: string;
  cpf: string;
  dataNascimento: string; // AAAA-MM-DD (o input type="date" já envia nesse formato)
  senha: string;
}

export async function login(email: string, senha: string): Promise<{ token: string; usuario: Usuario }> {
  try {
    const res = await api.post<{ token: string; usuario: Usuario }>('/auth/login', { email, senha });
    return res.data;
  } catch (err) {
    throw new Error(getErrorMessage(err));
  }
}

export async function register(dados: RegisterInput): Promise<void> {
  try {
    await api.post('/auth/register', dados);
  } catch (err) {
    throw new Error(getErrorMessage(err));
  }
}

export async function me(): Promise<Usuario> {
  try {
    const res = await api.get<Usuario>('/auth/me');
    return res.data;
  } catch (err) {
    throw new Error(getErrorMessage(err));
  }
}
