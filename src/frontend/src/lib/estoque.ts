import type { Produto } from '../types';

// Situação do estoque de um produto, usando o limite DELE (estoqueMinimo):
// 5 garrafas de Royal Salute é bastante; 5 Heineken é pouquíssimo.
export function statusEstoque(p: Pick<Produto, 'estoque' | 'estoqueMinimo'>): { rotulo: string; classe: string; alerta: boolean } {
  if (p.estoque <= 0) return { rotulo: 'Sem Estoque', classe: 'badge-danger', alerta: true };
  if (p.estoque <= p.estoqueMinimo) return { rotulo: 'Estoque Baixo', classe: 'badge-warning', alerta: true };
  return { rotulo: 'Em Estoque', classe: 'badge-success', alerta: false };
}
