import axios from 'axios';

// Cliente HTTP usado por produtosService.ts e authService.ts para falar
// com o backend (Node/Express + MySQL). VITE_API_URL vem do .env (local)
// ou é configurada no ambiente de produção (ex: Render) apontando para a
// URL pública da API.
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
