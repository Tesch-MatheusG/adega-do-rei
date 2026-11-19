import { Link } from 'react-router-dom';
import type { Produto } from '../types';
import { formatarPreco } from '../lib/format';
import ProdutoImagem from './ProdutoImagem';

export default function ProductCard({ produto }: { produto: Produto }) {
  const semEstoque = produto.estoque <= 0;

  return (
    <div className="card group">
      <Link to={`/produto/${produto.id}`} className="relative block aspect-[4/5] bg-surface-2 overflow-hidden">
        <div className={semEstoque ? 'h-full w-full opacity-40 grayscale' : 'h-full w-full'}>
          <ProdutoImagem produto={produto} />
        </div>
        {/* RN09: sem estoque o produto continua no catálogo, marcado como indisponível */}
        {semEstoque && (
          <span className="badge absolute top-3 left-3 bg-bg/90 text-danger border border-danger/40">Indisponível</span>
        )}
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
            {semEstoque ? 'Indisponível' : 'Reservar'}
          </Link>
        </div>
      </div>
    </div>
  );
}
