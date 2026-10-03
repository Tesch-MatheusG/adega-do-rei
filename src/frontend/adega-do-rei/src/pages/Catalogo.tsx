import { useEffect, useState } from 'react';
import { listarProdutos } from '../services/produtosService';
import type { Produto } from '../types';
import ProductCard from '../components/ProductCard';

export default function Catalogo() {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [busca, setBusca] = useState('');
  const [categoria, setCategoria] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    listarProdutos().then((data) => { setProdutos(data); setCarregando(false); });
  }, []);

  const categorias = Array.from(new Set(produtos.map((p) => p.categoria)));
  const filtrados = produtos
    .filter((p) => p.nome.toLowerCase().includes(busca.toLowerCase()))
    .filter((p) => !categoria || p.categoria === categoria);

  return (
    <div className="container-page py-10">
      <p className="text-gold text-sm">Adega do Rei</p>
      <h1 className="font-serif text-3xl mb-6">Coleção Imperial de Bebidas</h1>

      <div className="grid md:grid-cols-[220px_1fr] gap-8">
        <aside className="space-y-6">
          <div>
            <input
              className="input"
              placeholder="Pesquisar por nome..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
            />
          </div>
          <div>
            <p className="text-sm text-gold mb-2">Tipo de Bebida</p>
            <div className="space-y-1">
              <button
                className={`block text-sm ${!categoria ? 'text-gold' : 'text-muted hover:text-ink'}`}
                onClick={() => setCategoria(null)}
              >
                Todas
              </button>
              {categorias.map((c) => (
                <button
                  key={c}
                  className={`block text-sm ${categoria === c ? 'text-gold' : 'text-muted hover:text-ink'}`}
                  onClick={() => setCategoria(c)}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
        </aside>

        <div>
          {carregando && <p className="text-muted">Carregando catálogo...</p>}
          {!carregando && filtrados.length === 0 && <p className="text-muted">Nenhum produto encontrado.</p>}

          <div className="grid grid-cols-2 lg:grid-cols-3 gap-5">
            {filtrados.map((p) => <ProductCard key={p.id} produto={p} />)}
          </div>
        </div>
      </div>
    </div>
  );
}
