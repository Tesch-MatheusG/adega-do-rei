import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

export interface ItemCarrinho { produtoId: number; quantidade: number }

interface CartContextValue {
  itens: ItemCarrinho[];
  adicionar: (produtoId: number, quantidade?: number) => void;
  atualizarQuantidade: (produtoId: number, quantidade: number) => void;
  remover: (produtoId: number) => void;
  limpar: () => void;
  contagem: number;
}

const STORAGE_KEY = 'adega-cart';
const CartContext = createContext<CartContextValue | undefined>(undefined);

// NOTA: o carrinho/reserva ainda não é salvo no backend (a API de Reservas é
// a próxima etapa do PI). Por enquanto ele fica no localStorage do navegador.
export function CartProvider({ children }: { children: ReactNode }) {
  const [itens, setItens] = useState<ItemCarrinho[]>(() => {
    try {
      const salvo = localStorage.getItem(STORAGE_KEY);
      return salvo ? JSON.parse(salvo) : [];
    } catch { return []; }
  });

  useEffect(() => { localStorage.setItem(STORAGE_KEY, JSON.stringify(itens)); }, [itens]);

  function adicionar(produtoId: number, quantidade = 1) {
    setItens((atual) => {
      const existente = atual.find((i) => i.produtoId === produtoId);
      if (existente) {
        return atual.map((i) => (i.produtoId === produtoId ? { ...i, quantidade: i.quantidade + quantidade } : i));
      }
      return [...atual, { produtoId, quantidade }];
    });
  }

  function atualizarQuantidade(produtoId: number, quantidade: number) {
    setItens((atual) => atual.map((i) => (i.produtoId === produtoId ? { ...i, quantidade: Math.max(1, quantidade) } : i)));
  }

  function remover(produtoId: number) {
    setItens((atual) => atual.filter((i) => i.produtoId !== produtoId));
  }

  function limpar() { setItens([]); }

  return (
    <CartContext.Provider value={{ itens, adicionar, atualizarQuantidade, remover, limpar, contagem: itens.length }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart deve ser usado dentro de <CartProvider>');
  return ctx;
}
