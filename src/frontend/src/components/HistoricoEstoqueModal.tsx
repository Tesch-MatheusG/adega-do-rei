import { useEffect, useState } from 'react';
import { listarMovimentacoes } from '../services/produtosService';
import { formatarDataHora } from '../lib/format';
import type { Movimentacao, Produto } from '../types';

const TIPOS: Record<Movimentacao['tipo'], string> = {
  entrada: 'Entrada',
  saida: 'Baixa manual',
  reserva: 'Reserva',
  ajuste: 'Devolução',
};

export default function HistoricoEstoqueModal({ produto, onFechar }: { produto: Produto; onFechar: () => void }) {
  const [itens, setItens] = useState<Movimentacao[] | null>(null);
  const [erro, setErro] = useState('');

  useEffect(() => {
    listarMovimentacoes(produto.id).then(setItens).catch((e: Error) => setErro(e.message));
  }, [produto.id]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={onFechar}>
      <div onClick={(e) => e.stopPropagation()} className="card w-full max-w-2xl max-h-[85vh] overflow-y-auto p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="font-serif text-xl">Histórico de estoque</h2>
            <p className="text-muted text-sm">{produto.nome}</p>
          </div>
          <button className="text-muted hover:text-ink" onClick={onFechar} aria-label="Fechar">✕</button>
        </div>

        {erro && <p className="text-sm text-red-400">{erro}</p>}
        {!erro && itens === null && <p className="text-muted text-sm">Carregando...</p>}
        {itens?.length === 0 && <p className="text-muted text-sm">Nenhuma movimentação registrada.</p>}

        {itens && itens.length > 0 && (
          <table className="w-full text-sm">
            <thead className="text-left text-muted border-b border-border">
              <tr>
                <th className="py-2 pr-2 font-normal">Data</th>
                <th className="py-2 pr-2 font-normal">Tipo</th>
                <th className="py-2 pr-2 font-normal">Qtd.</th>
                <th className="py-2 pr-2 font-normal">Saldo</th>
                <th className="py-2 font-normal">Motivo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {itens.map((m) => (
                <tr key={m.id}>
                  <td className="py-2 pr-2 whitespace-nowrap">{formatarDataHora(m.createdAt)}</td>
                  <td className="py-2 pr-2">{TIPOS[m.tipo]}</td>
                  <td className="py-2 pr-2">{m.tipo === 'entrada' || m.tipo === 'ajuste' ? '+' : '−'}{m.quantidade}</td>
                  <td className="py-2 pr-2 whitespace-nowrap">{m.saldoAnterior} → {m.saldoPosterior}</td>
                  <td className="py-2 text-muted">{m.motivo ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
