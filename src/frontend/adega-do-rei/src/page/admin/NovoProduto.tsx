import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { criarProduto } from '../../services/produtosService';

export default function NovoProduto() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ nome: '', categoria: '', preco: '', volumeMl: '', descricao: '', estoque: '' });
  const [enviando, setEnviando] = useState(false);

  function campo<K extends keyof typeof form>(chave: K, valor: string) {
    setForm((f) => ({ ...f, [chave]: valor }));
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setEnviando(true);
    await criarProduto({
      nome: form.nome,
      categoria: form.categoria,
      preco: Number(form.preco),
      volumeMl: form.volumeMl ? Number(form.volumeMl) : null,
      descricao: form.descricao || null,
      estoque: form.estoque ? Number(form.estoque) : 0,
    });
    navigate('/admin/estoque');
  }

  return (
    <div className="max-w-lg">
      <h1 className="font-serif text-2xl mb-6">Cadastrar Novo Produto</h1>
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="field-label">Nome do Produto</label>
          <input className="input" required value={form.nome} onChange={(e) => campo('nome', e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="field-label">Categoria</label>
            <input className="input" required value={form.categoria} onChange={(e) => campo('categoria', e.target.value)} placeholder="Ex: Whisky" />
          </div>
          <div>
            <label className="field-label">Volume (ml)</label>
            <input className="input" type="number" value={form.volumeMl} onChange={(e) => campo('volumeMl', e.target.value)} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="field-label">Preço (R$)</label>
            <input className="input" type="number" step="0.01" required value={form.preco} onChange={(e) => campo('preco', e.target.value)} />
          </div>
          <div>
            <label className="field-label">Estoque inicial</label>
            <input className="input" type="number" value={form.estoque} onChange={(e) => campo('estoque', e.target.value)} />
          </div>
        </div>
        <div>
          <label className="field-label">Descrição</label>
          <textarea className="input" rows={3} value={form.descricao} onChange={(e) => campo('descricao', e.target.value)} />
        </div>

        <button type="submit" disabled={enviando} className="btn-primary">
          {enviando ? 'Salvando...' : 'Cadastrar Produto'}
        </button>
      </form>
    </div>
  );
}
