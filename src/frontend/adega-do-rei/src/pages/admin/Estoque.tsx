import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { listarProdutos, registrarEntradaEstoque } from '../../services/produtosService';
import type { Produto } from '../../types';
import { formatarPreco } from '../../lib/format';

const ESTOQUE_MINIMO = 5;

export default function Estoque() {
  const [produtos, setProdutos] = useState<Produto[]>([]);

  function carregar() { listarProdutos().then(setProdutos); }
  useEffect(carregar, []);

  async function registrarEntrada(id: number) {
    const valor = window.prompt('Quantidade recebida do fornecedor:');
    const quantidade = Number(valor);
    if (!valor || !Number.isInteger(quantidade) || quantidade <= 0) return;

    await registrarEntradaEstoque(id, quantidade);
    carregar();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-serif text-2xl">Controle de Estoque</h1>
        <Link to="/admin/novo-produto" className="btn-primary">+ Novo Produto</Link>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-left text-muted border-b border-border">
            <tr>
              <th className="p-3 font-normal">Produto</th>
              <th className="p-3 font-normal">Categoria</th>
              <th className="p-3 font-normal">Preço</th>
              <th className="p-3 font-normal">Estoque</th>
              <th className="p-3 font-normal">Status</th>
              <th className="p-3 font-normal">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {produtos.map((p) => (
              <tr key={p.id}>
                <td className="p-3">{p.nome}</td>
                <td className="p-3 text-muted">{p.categoria}</td>
                <td className="p-3">{formatarPreco(p.preco)}</td>
                <td className="p-3">{p.estoque} un.</td>
                <td className="p-3">
                  <span className={p.estoque <= ESTOQUE_MINIMO ? 'badge-danger' : 'badge-success'}>
                    {p.estoque <= ESTOQUE_MINIMO ? 'Estoque Baixo' : 'Em Estoque'}
                  </span>
                </td>
                <td className="p-3">
                  <button className="text-gold hover:underline" onClick={() => registrarEntrada(p.id)}>+ Entrada</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
