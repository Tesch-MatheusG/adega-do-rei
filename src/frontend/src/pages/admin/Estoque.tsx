import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import { Link } from 'react-router-dom';
import { listarProdutos, registrarEntradaEstoque, enviarImagemProduto, removerImagemProduto } from '../../services/produtosService';
import { prepararImagem } from '../../lib/imagem';
import ProdutoImagem from '../../components/ProdutoImagem';
import BaixaEstoqueModal from '../../components/BaixaEstoqueModal';
import HistoricoEstoqueModal from '../../components/HistoricoEstoqueModal';
import type { Produto } from '../../types';
import { formatarPreco } from '../../lib/format';

const ESTOQUE_MINIMO = 5;

export default function Estoque() {
  const [produtos, setProdutos] = useState<Produto[]>([]);

  // Uma única entrada de arquivo (escondida) serve todas as linhas: guardamos de qual produto é a foto
  const inputFoto = useRef<HTMLInputElement>(null);
  const [produtoDaFoto, setProdutoDaFoto] = useState<number | null>(null);
  const [ocupado, setOcupado] = useState<number | null>(null);
  const [baixando, setBaixando] = useState<Produto | null>(null);
  const [verHistorico, setVerHistorico] = useState<Produto | null>(null);

  function carregar() { listarProdutos().then(setProdutos); }
  useEffect(carregar, []);

  function escolherFoto(id: number) {
    setProdutoDaFoto(id);
    inputFoto.current?.click();
  }

  async function enviarFoto(e: ChangeEvent<HTMLInputElement>) {
    const arquivo = e.target.files?.[0];
    e.target.value = '';
    if (!arquivo || produtoDaFoto === null) return;
    setOcupado(produtoDaFoto);
    try {
      await enviarImagemProduto(produtoDaFoto, await prepararImagem(arquivo));
      carregar();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Não foi possível enviar a foto.');
    } finally {
      setOcupado(null);
    }
  }

  async function removerFoto(id: number) {
    if (!window.confirm('Remover a foto deste produto?')) return;
    setOcupado(id);
    try {
      await removerImagemProduto(id);
      carregar();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Não foi possível remover a foto.');
    } finally {
      setOcupado(null);
    }
  }

  async function registrarEntrada(id: number) {
    const valor = window.prompt('Quantidade recebida do fornecedor:');
    const quantidade = Number(valor);
    if (!valor || !Number.isInteger(quantidade) || quantidade <= 0) return;

    try {
      await registrarEntradaEstoque(id, quantidade);
      carregar();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Não foi possível registrar a entrada.');
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-serif text-2xl">Controle de Estoque</h1>
        <Link to="/admin/novo-produto" className="btn-primary">+ Novo Produto</Link>
      </div>

      <input ref={inputFoto} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={enviarFoto} />

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-left text-muted border-b border-border">
            <tr>
              <th className="p-3 font-normal">Foto</th>
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
                <td className="p-3">
                  <div className="w-12 h-12 bg-surface-2 rounded overflow-hidden">
                    <ProdutoImagem produto={p} inicialClassName="text-lg" />
                  </div>
                </td>
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
                  <div className="flex flex-wrap gap-x-4 gap-y-1">
                    <button className="text-gold hover:underline" onClick={() => registrarEntrada(p.id)}>+ Entrada</button>
                    <button className="text-gold hover:underline disabled:opacity-50" disabled={p.estoque === 0} onClick={() => setBaixando(p)}>− Baixa</button>
                    <button className="text-gold hover:underline" onClick={() => setVerHistorico(p)}>Histórico</button>
                    <button className="text-gold hover:underline disabled:opacity-50" disabled={ocupado === p.id} onClick={() => escolherFoto(p.id)}>
                      {ocupado === p.id ? 'Enviando...' : p.imagemUrl ? 'Trocar foto' : '+ Foto'}
                    </button>
                    {p.imagemUrl && (
                      <button className="text-muted hover:underline disabled:opacity-50" disabled={ocupado === p.id} onClick={() => removerFoto(p.id)}>
                        Remover foto
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {baixando && (
        <BaixaEstoqueModal
          produto={baixando}
          onFechar={() => setBaixando(null)}
          onConcluido={() => { setBaixando(null); carregar(); }}
        />
      )}
      {verHistorico && <HistoricoEstoqueModal produto={verHistorico} onFechar={() => setVerHistorico(null)} />}
    </div>
  );
}
