import { useState, type FormEvent } from 'react';
import { registrarBaixaEstoque, type MotivoBaixa } from '../services/produtosService';
import type { Produto } from '../types';

const MOTIVOS: { valor: MotivoBaixa; rotulo: string }[] = [
  { valor: 'quebra', rotulo: 'Quebra' },
  { valor: 'perda', rotulo: 'Perda' },
  { valor: 'vencimento', rotulo: 'Vencimento' },
  { valor: 'furto', rotulo: 'Furto/extravio' },
  { valor: 'outro', rotulo: 'Outro (descreva)' },
];

interface Props {
  produto: Produto;
  onFechar: () => void;
  onConcluido: () => void;
}

export default function BaixaEstoqueModal({ produto, onFechar, onConcluido }: Props) {
  const [quantidade, setQuantidade] = useState('1');
  const [motivo, setMotivo] = useState<MotivoBaixa>('quebra');
  const [observacao, setObservacao] = useState('');
  const [erro, setErro] = useState('');
  const [enviando, setEnviando] = useState(false);

  async function enviar(e: FormEvent) {
    e.preventDefault();
    const qtd = Number(quantidade);
    if (!Number.isInteger(qtd) || qtd <= 0) return setErro('Informe uma quantidade inteira maior que zero.');
    if (qtd > produto.estoque) return setErro(`A baixa não pode passar do estoque atual (${produto.estoque} un.).`);
    if (motivo === 'outro' && !observacao.trim()) return setErro('Descreva o motivo na observação.');

    setEnviando(true);
    setErro('');
    try {
      await registrarBaixaEstoque(produto.id, { quantidade: qtd, motivo, observacao: observacao.trim() || undefined });
      onConcluido();
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Não foi possível registrar a baixa.');
      setEnviando(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={onFechar}>
      <form onSubmit={enviar} onClick={(e) => e.stopPropagation()} className="card w-full max-w-md p-6 space-y-4">
        <div>
          <h2 className="font-serif text-xl">Baixa de estoque</h2>
          <p className="text-muted text-sm">{produto.nome} · estoque atual: {produto.estoque} un.</p>
        </div>

        <label className="block text-sm">
          <span className="text-muted">Motivo</span>
          <select className="input mt-1" value={motivo} onChange={(e) => setMotivo(e.target.value as MotivoBaixa)}>
            {MOTIVOS.map((m) => <option key={m.valor} value={m.valor}>{m.rotulo}</option>)}
          </select>
        </label>

        <label className="block text-sm">
          <span className="text-muted">Quantidade</span>
          <input className="input mt-1" type="number" min={1} max={produto.estoque} value={quantidade} onChange={(e) => setQuantidade(e.target.value)} />
        </label>

        <label className="block text-sm">
          <span className="text-muted">Observação {motivo === 'outro' ? '(obrigatória)' : '(opcional)'}</span>
          <input className="input mt-1" maxLength={150} value={observacao} onChange={(e) => setObservacao(e.target.value)} placeholder="Ex.: garrafa caiu durante a reposição" />
        </label>

        {erro && <p className="text-sm text-red-400">{erro}</p>}

        <div className="flex justify-end gap-3 pt-2">
          <button type="button" className="btn-outline" onClick={onFechar}>Cancelar</button>
          <button type="submit" className="btn-primary disabled:opacity-50" disabled={enviando}>
            {enviando ? 'Registrando...' : 'Registrar baixa'}
          </button>
        </div>
      </form>
    </div>
  );
}
