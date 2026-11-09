import { api } from './api';
import type { Produto } from '../types';

const LADO_MAXIMO = 900; // px: suficiente para o card e a página do produto
const TAMANHO_MAXIMO = 1.5 * 1024 * 1024; // a API aceita até 2 MB

// URL completa da foto para usar no <img src>. O imagemUrl vem relativo à base da API.
export function urlDaImagem(produto: Pick<Produto, 'imagemUrl'>): string | null {
  if (!produto.imagemUrl) return null;
  const base = String(api.defaults.baseURL ?? '').replace(/\/$/, '');
  return `${base}${produto.imagemUrl}`;
}

function paraBlob(canvas: HTMLCanvasElement, tipo: string, qualidade: number): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, tipo, qualidade));
}

// Reduz a foto no navegador antes de enviar: o admin pode escolher a foto direto da câmera
// (vários MB) e ela chega na API leve, em WebP (ou JPEG, se o navegador não gerar WebP).
export async function prepararImagem(arquivo: File): Promise<Blob> {
  if (!arquivo.type.startsWith('image/')) {
    throw new Error('Escolha um arquivo de imagem (JPG, PNG ou WebP).');
  }

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(arquivo);
  } catch {
    throw new Error('Não foi possível abrir essa imagem. Use JPG, PNG ou WebP.');
  }

  const escala = Math.min(1, LADO_MAXIMO / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(bitmap.width * escala));
  canvas.height = Math.max(1, Math.round(bitmap.height * escala));
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Seu navegador não conseguiu preparar a imagem.');
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();

  let blob = await paraBlob(canvas, 'image/webp', 0.85);
  if (!blob || blob.type !== 'image/webp') {
    // Navegador sem suporte a WebP: usa JPEG com fundo branco (JPEG não tem transparência)
    ctx.globalCompositeOperation = 'destination-over';
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    blob = await paraBlob(canvas, 'image/jpeg', 0.85);
  }
  if (!blob) throw new Error('Não foi possível preparar a imagem.');
  if (blob.size > TAMANHO_MAXIMO) throw new Error('A imagem continua muito grande. Escolha outra foto.');
  return blob;
}
