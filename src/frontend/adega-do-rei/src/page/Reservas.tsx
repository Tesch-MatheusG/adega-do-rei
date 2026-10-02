import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { listarProdutos } from '../services/produtosService';
import type { Produto } from '../types';
import { formatarPreco } from '../lib/format';
import { useCart } from '../context/CartContext';

// Nesta etapa (sem API ainda), a reserva só existe no carrinho local.
// Confirmar a reserva aqui simula o sucesso; a gravação real de uma
// reserva no banco é prevista para a próxima fase do projeto.
export default function Reservas() {
  const { itens, atualizarQuantidade, remover, limpar } = useCart();
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [confirmado, setConfirmado] = useState(false);

  useEffect(() => { listarProdutos().then(setProdutos); }, []);

  const linhas = itens
    .map((item) => ({ item, produto: produtos.find((p) => p.id === item.produtoId) }))
    .filter((l) => l.produto);

  const total = linhas.reduce((soma, l) => soma + Number(l.produto!.preco) * l.item.quantidade, 0);

  if (produtos.length === 0) return <div className="container-page py-16 text-muted">Carregando...</div>;

  if (confirmado) {
    return (
      <div className="container-page py-24 text-center">
        <p className="font-serif text-2xl mb-2 text-gold">Reserva confirmada!</p>
        <p className="text-muted mb-6">Apresente-se na adega na data combinada para retirada e pagamento.</p>
        <Link to="/catalogo" className="btn-primary">Voltar ao Catálogo</Link>
      </div>
    );
  }

  if (linhas.length === 0) {
    return (
      <div className="container-page py-24 text-center">
        <p className="font-serif text-2xl mb-2">Sua Adega está vazia</p>
        <p className="text-muted mb-6">Explore o catálogo e reserve suas bebidas favoritas.</p>
        <Link to="/catalogo" className="btn-primary">Ver Catálogo</Link>
      </div>
    );
  }

  return (
    <div className="container-page py-10 grid lg:grid-cols-[1fr_360px] gap-10">
      <div>
        <h1 className="font-serif text-3xl mb-6">Minha Adega (Carrinho de Reserva)</h1>
        <div className="bg-warning/10 border border-warning/30 rounded p-4 text-sm mb-6">
          <strong className="text-warning">Aviso importante:</strong> o pagamento será efetuado na retirada
          física, direto no caixa da adega. Nenhum valor é cobrado online hoje.
        </div>

        <div className="space-y-4">
          {linhas.map(({ item, produto }) => (
            <div key={item.produtoId} className="card flex items-center gap-4 p-4">
              <div className="w-16 h-16 bg-surface-2 rounded flex items-center justify-center font-serif text-gold/40">
                {produto!.nome.charAt(0)}
              </div>
              <div className="flex-1">
                <p className="font-medium">{produto!.nome}</p>
                <p className="text-xs text-muted">{produto!.categoria}</p>
              </div>
              <div className="flex items-center border border-border rounded">
                <button className="px-2.5 py-1" onClick={() => atualizarQuantidade(item.produtoId, item.quantidade - 1)}>−</button>
                <span className="px-2.5">{item.quantidade}</span>
                <button className="px-2.5 py-1" onClick={() => atualizarQuantidade(item.produtoId, item.quantidade + 1)}>+</button>
              </div>
              <span className="text-gold w-24 text-right">{formatarPreco(Number(produto!.preco) * item.quantidade)}</span>
              <button className="text-muted hover:text-danger" onClick={() => remover(item.produtoId)} aria-label="Remover item">🗑</button>
            </div>
          ))}
        </div>
      </div>

      <aside className="card p-6 h-fit">
        <h2 className="font-serif text-xl mb-4">Detalhes de Retirada</h2>
        <p className="text-sm text-muted mb-6">Seg. a Dom. — 7h às 23h</p>
        <div className="border-t border-border pt-4 flex justify-between mb-1 text-sm text-muted">
          <span>Subtotal das Bebidas</span><span>{formatarPreco(total)}</span>
        </div>
        <div className="flex justify-between font-serif text-xl mb-6">
          <span>Total da Reserva</span><span className="text-gold">{formatarPreco(total)}</span>
        </div>
        <button className="btn-primary btn-block" onClick={() => { setConfirmado(true); limpar(); }}>
          Confirmar Reserva para Retirada
        </button>
      </aside>
    </div>
  );
}
