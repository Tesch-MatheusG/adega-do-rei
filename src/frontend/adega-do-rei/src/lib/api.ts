import axios from 'axios';

// NÃO USADO NESTA ETAPA: esta entrega roda com dados simulados
// (ver src/services/). Este arquivo fica pronto para quando o backend
// (Node/Express) for integrado na próxima fase — produtosService.ts e
// authService.ts passarão a usar este cliente `api` no lugar do mockDb.
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api',
});

// Anexa o token JWT salvo no login em toda requisição autenticada.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('adega-token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Extrai uma mensagem legível de qualquer erro do axios/backend.
export function getErrorMessage(err: unknown): string {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as { erro?: string; detalhes?: { mensagem: string }[] } | undefined;
    if (data?.detalhes?.length) return data.detalhes.map((d) => d.mensagem).join(' ');
    if (data?.erro) return data.erro;
  }
  return 'Não foi possível completar a ação. Tente novamente.';
}
