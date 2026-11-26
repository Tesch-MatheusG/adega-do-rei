// O MySQL devolve DECIMAL como string (ex: "8.50"), então sempre convertemos com Number() antes.
export function formatarPreco(valor: number | string): string {
  return Number(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

// "1995-05-20" -> "20/05/1995". Trocamos as partes do texto em vez de usar new Date(), porque
// "AAAA-MM-DD" é lido como meia-noite UTC e, no horário de Brasília, apareceria 1 dia antes.
export function formatarData(dataISO: string): string {
  const [ano, mes, dia] = dataISO.slice(0, 10).split('-');
  return ano && mes && dia ? `${dia}/${mes}/${ano}` : dataISO;
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
