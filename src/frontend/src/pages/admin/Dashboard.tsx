import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { listarProdutos } from '../../services/produtosService';
import { listarReservas } from '../../services/reservasService';
import type { Produto } from '../../types';
import { formatarPreco } from '../../lib/format';
import { statusEstoque } from '../../lib/estoque';
import RelatorioMaisReservados from '../../components/RelatorioMaisReservados';

export default function Dashboard() {
  const [produtos, setProdutos] = useState<Produto[]>([]);

  const [pendentes, setPendentes] = useState(0);

  useEffect(() => {
    listarProdutos().then(setProdutos);
    // Se a API de reservas falhar, o painel continua funcionando sem esse indicador
    listarReservas('pendente').then((r) => setPendentes(r.length)).catch(() => setPendentes(0));
  }, []);

  const totalProdutos = produtos.length;
  const alertasEstoque = produtos.filter((p) => statusEstoque(p).alerta).length;
  const valorEstoque = produtos.reduce((soma, p) => soma + Number(p.preco) * p.estoque, 0);

  return (
    <div>
      <h1 className="font-serif text-2xl mb-1">Gestão de Estoque &amp; Reservas</h1>
      <p className="text-muted mb-8">Adega Real controlada dia a dia, mundo imperial em tempo real</p>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        <div className="card p-5"><p className="text-muted text-sm mb-1">Total de Produtos</p><p className="text-3xl font-sans font-semibold">{totalProdutos}</p></div>
        <div className="card p-5"><p className="text-muted text-sm mb-1">Alertas de Estoque</p><p className="text-3xl font-sans font-semibold text-warning">{alertasEstoque}</p></div>
        <Link to="/admin/reservas" className="card p-5 hover:border-gold"><p className="text-muted text-sm mb-1">Reservas Pendentes</p><p className="text-3xl font-sans font-semibold">{pendentes}</p></Link>
        <div className="card p-5"><p className="text-muted text-sm mb-1">Valor em Estoque</p><p className="text-3xl font-sans font-semibold text-gold">{formatarPreco(valorEstoque)}</p></div>
      </div>

      <div className="flex items-center justify-between mb-3">
        <p className="font-serif text-lg">Status Geral do Estoque</p>
        <Link to="/admin/estoque" className="text-sm text-gold hover:underline">Ver tudo →</Link>
      </div>
      <div className="card divide-y divide-border">
        {produtos.slice(0, 5).map((p) => (
          <div key={p.id} className="grid grid-cols-3 items-center gap-4 px-4 py-3 text-sm">
          <span>{p.nome}</span>
          <span className="text-muted text-center">{p.estoque} un.</span>
          <span className={`${statusEstoque(p).classe} justify-self-end`}>{statusEstoque(p).rotulo}</span>
        </div>
        ))}
      </div>

      <RelatorioMaisReservados />
    </div>
  );
}
