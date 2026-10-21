import type { Produto } from '../types';
import { db } from './mockDb';

// Simula a latência de uma chamada de rede, para a interface já nascer
// preparada para estados de carregamento (igual quando a API real entrar).
const atraso = (ms = 300) => new Promise((resolve) => setTimeout(resolve, ms));

export async function listarProdutos(filtroCategoria?: string): Promise<Produto[]> {
  await atraso();
  const { produtos } = db.get();
  return produtos
    .filter((p) => p.ativo)
    .filter((p) => !filtroCategoria || p.categoria === filtroCategoria);
}

export async function buscarProduto(id: number): Promise<Produto | null> {
  await atraso();
  const { produtos } = db.get();
  return produtos.find((p) => p.id === id && p.ativo) ?? null;
}

export async function criarProduto(dados: Omit<Produto, 'id' | 'ativo'>): Promise<Produto> {
  await atraso();
  const base = db.get();
  const novo: Produto = { ...dados, id: base.proximoIdProduto, ativo: true };
  base.produtos.push(novo);
  base.proximoIdProduto += 1;
  db.set(base);
  return novo;
}

export async function atualizarProduto(id: number, dados: Partial<Produto>): Promise<Produto> {
  await atraso();
  const base = db.get();
  const produto = base.produtos.find((p) => p.id === id);
  if (!produto) throw new Error('Produto não encontrado.');
  Object.assign(produto, dados);
  db.set(base);
  return produto;
}

export async function registrarEntradaEstoque(id: number, quantidade: number): Promise<Produto> {
  await atraso();
  const base = db.get();
  const produto = base.produtos.find((p) => p.id === id);
  if (!produto) throw new Error('Produto não encontrado.');
  produto.estoque += quantidade;
  db.set(base);
  return produto;
}
