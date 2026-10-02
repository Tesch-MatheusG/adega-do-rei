// O MySQL devolve DECIMAL como string (ex: "8.50"), então sempre convertemos com Number() antes.
export function formatarPreco(valor: number | string): string {
  return Number(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}
