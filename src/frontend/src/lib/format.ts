// O MySQL devolve DECIMAL como string (ex: "8.50"), então sempre convertemos com Number() antes.
export function formatarPreco(valor: number | string): string {
  return Number(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function formatarDataHora(iso: string): string {
  return new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
}

// Rótulo e cor (classe de badge do index.css) de cada status de reserva
export const STATUS_RESERVA: Record<string, { rotulo: string; classe: string }> = {
  pendente: { rotulo: 'Pendente', classe: 'badge-warning' },
  pronta: { rotulo: 'Pronta para retirada', classe: 'badge-success' },
  retirada: { rotulo: 'Retirada', classe: 'badge' },
  expirada: { rotulo: 'Expirada', classe: 'badge-danger' },
  cancelada: { rotulo: 'Cancelada', classe: 'badge-danger' },
};
