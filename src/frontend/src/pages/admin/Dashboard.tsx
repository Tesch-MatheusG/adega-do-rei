import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { listarProdutos } from '../../services/produtosService';
import type { Produto } from '../../types';
import { formatarPreco } from '../../lib/format';

const ESTOQUE_MINIMO = 5;

export default function Dashboard() {
  const [produtos, setProdutos] = useState<Produto[]>([]);

  useEffect(() => { listarProdutos().then(setProdutos); }, []);

  const totalProdutos = produtos.length;
  const alertasEstoque = produtos.filter((p) => p.estoque <= ESTOQUE_MINIMO).length;
  const valorEstoque = produtos.reduce((soma, p) => soma + Number(p.preco) * p.estoque, 0);

  return (
    <div>
      <h1 className="font-serif text-2xl mb-1">Gestão de Estoque &amp; Reservas</h1>
      <p className="text-muted mb-8">Adega Real controlada dia a dia, mundo imperial em tempo real</p>

      <div className="grid grid-cols-3 gap-4 mb-10">
        <div className="card p-5"><p className="text-muted text-sm mb-1">Total de Produtos</p><p className="text-3xl font-serif">{totalProdutos}</p></div>
        <div className="card p-5"><p className="text-muted text-sm mb-1">Alertas de Estoque</p><p className="text-3xl font-serif text-warning">{alertasEstoque}</p></div>
        <div className="card p-5"><p className="text-muted text-sm mb-1">Valor em Estoque</p><p className="text-3xl font-serif text-gold">{formatarPreco(valorEstoque)}</p></div>
      </div>

      <div className="flex items-center justify-between mb-3">
        <p className="font-serif text-lg">Status Geral do Estoque</p>
        <Link to="/admin/estoque" className="text-sm text-gold hover:underline">Ver tudo →</Link>
      </div>
      <div className="card divide-y divide-border">
        {produtos.slice(0, 5).map((p) => (
          <div key={p.id} className="flex items-center justify-between px-4 py-3 text-sm">
            <span>{p.nome}</span>
            <span className="text-muted">{p.estoque} un.</span>
            <span className={p.estoque <= ESTOQUE_MINIMO ? 'badge-danger' : 'badge-success'}>
              {p.estoque <= ESTOQUE_MINIMO ? 'Estoque Baixo' : 'Em Estoque'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
