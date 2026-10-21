import { Link } from 'react-router-dom';
import type { Produto } from '../types';
import { formatarPreco } from '../lib/format';

export default function ProductCard({ produto }: { produto: Produto }) {
  const semEstoque = produto.estoque <= 0;

  return (
    <div className="card group">
      <Link to={`/produto/${produto.id}`} className="block aspect-[4/5] bg-surface-2 overflow-hidden">
        {/* Sem imagens reais ainda: placeholder com a inicial do produto */}
        <div className="w-full h-full flex items-center justify-center text-4xl font-serif text-gold/40">
          {produto.nome.charAt(0)}
        </div>
      </Link>
      <div className="p-4">
        <p className="text-xs text-muted uppercase tracking-wide">{produto.categoria}</p>
        <Link to={`/produto/${produto.id}`} className="block font-serif text-lg leading-snug mt-1 hover:text-gold">
          {produto.nome}
        </Link>
        <div className="flex items-center justify-between mt-3">
          <span className="text-gold font-medium">{formatarPreco(produto.preco)}</span>
          <Link
            to={`/produto/${produto.id}`}
            className={semEstoque ? 'btn-outline text-xs pointer-events-none opacity-50' : 'btn-primary text-xs'}
          >
            {semEstoque ? 'Esgotado' : 'Reservar'}
          </Link>
        </div>
      </div>
    </div>
  );
}
