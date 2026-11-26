import { api, getErrorMessage } from '../lib/api';
import type { ProdutoMaisReservado } from '../types';

// Relatório do admin: produtos mais reservados. dias omitido = todo o período.
export async function listarMaisReservados(dias?: number, limite = 5): Promise<ProdutoMaisReservado[]> {
  try {
    const res = await api.get<ProdutoMaisReservado[]>('/relatorios/mais-reservados', {
      params: { ...(dias ? { dias } : {}), limite },
    });
    return res.data;
  } catch (err) {
    throw new Error(getErrorMessage(err));
  }
}
