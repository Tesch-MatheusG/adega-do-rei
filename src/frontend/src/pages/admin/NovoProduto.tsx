import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { criarProduto } from '../../services/produtosService';
import { listarCategorias, criarCategoria } from '../../services/categoriasService';
import type { Categoria } from '../../types';

// Valor especial da lista: abre o campo para cadastrar uma categoria nova
const NOVA = '__nova__';

export default function NovoProduto() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ nome: '', categoria: '', preco: '', volumeMl: '', descricao: '', estoque: '' });
  const [erro, setErro] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [carregandoCategorias, setCarregandoCategorias] = useState(true);
  const [nomeNovaCategoria, setNomeNovaCategoria] = useState('');
  const [erroCategoria, setErroCategoria] = useState('');
  const [salvandoCategoria, setSalvandoCategoria] = useState(false);

  useEffect(() => {
    listarCategorias()
      .then(setCategorias)
      .catch((e: Error) => setErro(e.message))
      .finally(() => setCarregandoCategorias(false));
  }, []);

  // Cadastra a categoria nova, coloca na lista e já deixa selecionada
  async function adicionarCategoria() {
    setErroCategoria('');
    setSalvandoCategoria(true);
    try {
      const nova = await criarCategoria(nomeNovaCategoria);
      setCategorias((lista) => [...lista, nova].sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR')));
      campo('categoria', nova.nome);
      setNomeNovaCategoria('');
    } catch (e) {
      setErroCategoria(e instanceof Error ? e.message : 'Não foi possível cadastrar a categoria.');
    } finally {
      setSalvandoCategoria(false);
    }
  }

  function campo<K extends keyof typeof form>(chave: K, valor: string) {
    setForm((f) => ({ ...f, [chave]: valor }));
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setErro('');
    if (!form.categoria || form.categoria === NOVA) {
      setErro('Escolha uma categoria da lista ou cadastre uma nova.');
      return;
    }
    setEnviando(true);
    try {
      await criarProduto({
        nome: form.nome,
        categoria: form.categoria,
        preco: Number(form.preco),
        volumeMl: form.volumeMl ? Number(form.volumeMl) : null,
        descricao: form.descricao || null,
        estoque: form.estoque ? Number(form.estoque) : 0,
      });
      navigate('/admin/estoque');
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Não foi possível cadastrar o produto.');
    } finally {
      setEnviando(false);
    }
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
            <select
              className="input"
              value={form.categoria}
              disabled={carregandoCategorias}
              onChange={(e) => { campo('categoria', e.target.value); setErroCategoria(''); }}
            >
              <option value="">{carregandoCategorias ? 'Carregando...' : 'Selecione...'}</option>
              {categorias.map((c) => <option key={c.id} value={c.nome}>{c.nome}</option>)}
              <option value={NOVA}>+ Nova categoria...</option>
            </select>
          </div>
          <div>
            <label className="field-label">Volume (ml)</label>
            <input className="input" type="number" value={form.volumeMl} onChange={(e) => campo('volumeMl', e.target.value)} />
          </div>
        </div>
        {form.categoria === NOVA && (
          <div className="card p-4 space-y-2">
            <label className="field-label" htmlFor="nova-categoria">Nome da nova categoria</label>
            <div className="flex gap-2">
              <input
                id="nova-categoria" className="input" placeholder="Ex: Licor" maxLength={60}
                value={nomeNovaCategoria} onChange={(e) => setNomeNovaCategoria(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); adicionarCategoria(); } }}
              />
              <button type="button" className="btn-primary" disabled={salvandoCategoria || !nomeNovaCategoria.trim()} onClick={adicionarCategoria}>
                {salvandoCategoria ? 'Salvando...' : 'Adicionar'}
              </button>
              <button type="button" className="btn-outline" onClick={() => { campo('categoria', ''); setErroCategoria(''); }}>Cancelar</button>
            </div>
            {erroCategoria && <p className="text-danger text-sm">{erroCategoria}</p>}
          </div>
        )}

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

        {erro && <p className="text-danger text-sm">{erro}</p>}

        <button type="submit" disabled={enviando} className="btn-primary">
          {enviando ? 'Salvando...' : 'Cadastrar Produto'}
        </button>
      </form>
    </div>
  );
}
