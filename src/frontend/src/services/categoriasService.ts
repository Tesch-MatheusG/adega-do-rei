import { api, getErrorMessage } from '../lib/api';
import type { Categoria } from '../types';

// Lista oficial de categorias (pública)
export async function listarCategorias(): Promise<Categoria[]> {
  try {
    return (await api.get<Categoria[]>('/categorias')).data;
  } catch (err) {
    throw new Error(getErrorMessage(err));
  }
}

// Cadastro de categoria nova (só admin). O backend padroniza o nome e recusa duplicadas.
export async function criarCategoria(nome: string): Promise<Categoria> {
  try {
    return (await api.post<Categoria>('/categorias', { nome })).data;
  } catch (err) {
    throw new Error(getErrorMessage(err));
  }
}
