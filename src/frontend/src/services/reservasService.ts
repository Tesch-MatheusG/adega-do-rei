import { api, getErrorMessage } from '../lib/api';
import type { Reserva, StatusReserva } from '../types';

// Todas as chamadas de /api/reservas. As páginas nunca usam o axios diretamente.

async function chamar<T>(requisicao: Promise<{ data: T }>): Promise<T> {
  try {
    return (await requisicao).data;
  } catch (err) {
    throw new Error(getErrorMessage(err));
  }
}

export interface NovoItem { produtoId: number; quantidade: number }

// Cliente: cria a reserva (o backend confere maioridade e estoque e já baixa o estoque)
export function criarReserva(itens: NovoItem[], retiradaPrevista?: string): Promise<Reserva> {
  return chamar(api.post<Reserva>('/reservas', { itens, ...(retiradaPrevista ? { retiradaPrevista } : {}) }));
}

// Cliente: só as reservas dele
export function minhasReservas(): Promise<Reserva[]> {
  return chamar(api.get<Reserva[]>('/reservas/minhas'));
}

// Admin: todas, com filtro opcional de status
export function listarReservas(status?: StatusReserva): Promise<Reserva[]> {
  return chamar(api.get<Reserva[]>('/reservas', { params: status ? { status } : undefined }));
}

// Dono ou admin: cancela e devolve o estoque
export async function cancelarReserva(id: number): Promise<Reserva> {
  return (await chamar(api.patch<{ reserva: Reserva }>(`/reservas/${id}/cancelar`))).reserva;
}

// Admin
export async function marcarPronta(id: number): Promise<Reserva> {
  return (await chamar(api.patch<{ reserva: Reserva }>(`/reservas/${id}/pronta`))).reserva;
}

export async function confirmarRetirada(id: number): Promise<Reserva> {
  return (await chamar(api.patch<{ reserva: Reserva }>(`/reservas/${id}/retirada`))).reserva;
}
