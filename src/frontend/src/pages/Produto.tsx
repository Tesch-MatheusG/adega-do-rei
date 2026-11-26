import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { buscarProduto, listarSugestoes } from '../services/produtosService';
import type { Produto } from '../types';
import { formatarPreco } from '../lib/format';
import { useCart } from '../context/CartContext';
import ProductCard from '../components/ProductCard';
import ProdutoImagem from '../components/ProdutoImagem';

export default function ProdutoPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { adicionar } = useCart();

  const [produto, setProduto] = useState<Produto | null>(null);
  const [relacionados, setRelacionados] = useState<Produto[]>([]);
  const [quantidade, setQuantidade] = useState(1);
  const [erro, setErro] = useState('');

  useEffect(() => {
    setErro('');
    buscarProduto(Number(id))
      .then((p) => {
        if (!p) { setErro('Produto não encontrado.'); return; }
        setProduto(p);
        // As 3 bebidas mais reservadas da adega (sem repetir esta). Se falhar, a página funciona sem a seção.
        listarSugestoes(p.id, 3).then(setRelacionados).catch(() => setRelacionados([]));
      });
  }, [id]);

  if (erro) return <div className="container-page py-16 text-danger">{erro}</div>;
  if (!produto) return <div className="container-page py-16 text-muted">Carregando...</div>;

  const semEstoque = produto.estoque <= 0;

  function reservar() {
    adicionar(produto!.id, quantidade);
    navigate('/reservas');
  }

  return (
    <div className="container-page py-10">
      <div className="grid md:grid-cols-2 gap-10 mb-16">
        <div className="card aspect-square overflow-hidden">
          <ProdutoImagem produto={produto} inicialClassName="text-6xl" />
        </div>

        <div>
          <div className="flex gap-2 mb-3">
            {semEstoque ? <span className="badge-danger">Indisponível</span> : <span className="badge-success">Em Estoque</span>}
          </div>
          <h1 className="font-serif text-3xl mb-1">{produto.nome}</h1>
          <p className="text-muted mb-6">{produto.categoria}{produto.volumeMl ? ` · ${produto.volumeMl}ml` : ''}</p>

          <p className="field-label">Preço de Reserva</p>
          <p className="text-gold text-3xl font-serif mb-6">{formatarPreco(produto.preco)}</p>

          <div className="flex items-center gap-4 mb-6">
            <div className="flex items-center border border-border rounded">
              <button className="px-3 py-2" onClick={() => setQuantidade((q) => Math.max(1, q - 1))}>−</button>
              <span className="px-3">{quantidade}</span>
              <button className="px-3 py-2" onClick={() => setQuantidade((q) => Math.min(produto.estoque, q + 1))}>+</button>
            </div>
            <button className="btn-primary flex-1" disabled={produto.estoque <= 0} onClick={reservar}>
              {semEstoque ? 'Produto indisponível' : 'Reservar para Retirada'}
            </button>
          </div>

          {produto.descricao && <p className="text-muted leading-relaxed">{produto.descricao}</p>}
        </div>
      </div>

      {relacionados.length > 0 && (
        <div>
          <h2 className="font-serif text-xl mb-4">Outras Bebidas Imperiais que Você Pode Gostar</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
            {relacionados.map((p) => <ProductCard key={p.id} produto={p} />)}
          </div>
        </div>
      )}
    </div>
  );
}
