import { api, getErrorMessage } from '../lib/api';
import type { Produto } from '../types';

// Chama o backend de verdade (Node/Express + MySQL). As assinaturas destas
// funções são as mesmas usadas quando o projeto rodava com dados simulados
// (antigo src/services/mockDb.ts) — por isso nenhuma página precisou mudar.

export async function listarProdutos(filtroCategoria?: string): Promise<Produto[]> {
  try {
    const res = await api.get<Produto[]>('/produtos', {
      params: filtroCategoria ? { categoria: filtroCategoria } : undefined,
    });
    return res.data;
  } catch (err) {
    throw new Error(getErrorMessage(err));
  }
}

export async function buscarProduto(id: number): Promise<Produto | null> {
  try {
    const res = await api.get<Produto>(`/produtos/${id}`);
    return res.data;
  } catch (err) {
    // 404 do backend vira "não encontrado" (null), e não um erro quebrando a tela
    return null;
  }
}

export async function criarProduto(dados: Omit<Produto, 'id' | 'ativo'>): Promise<Produto> {
  try {
    const res = await api.post<Produto>('/produtos', dados);
    return res.data;
  } catch (err) {
    throw new Error(getErrorMessage(err));
  }
}

export async function atualizarProduto(id: number, dados: Partial<Produto>): Promise<Produto> {
  try {
    const res = await api.put<Produto>(`/produtos/${id}`, dados);
    return res.data;
  } catch (err) {
    throw new Error(getErrorMessage(err));
  }
}

export async function registrarEntradaEstoque(id: number, quantidade: number): Promise<Produto> {
  try {
    const res = await api.patch<{ produto: Produto }>(`/produtos/${id}/estoque`, { quantidade });
    return res.data.produto;
  } catch (err) {
    throw new Error(getErrorMessage(err));
  }
}
