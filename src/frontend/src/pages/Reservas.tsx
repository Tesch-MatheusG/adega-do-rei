import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { listarProdutos } from '../services/produtosService';
import { criarReserva } from '../services/reservasService';
import { useAuth } from '../context/AuthContext';
import type { Produto } from '../types';
import { formatarPreco } from '../lib/format';
import { useCart } from '../context/CartContext';
import ProdutoImagem from '../components/ProdutoImagem';

// O carrinho fica no navegador (CartContext) até o cliente confirmar. Ao confirmar,
// a reserva é gravada no backend, que confere maioridade e estoque e já baixa o estoque.
export default function Reservas() {
  const { itens, atualizarQuantidade, remover, limpar } = useCart();
  const { usuario } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [confirmado, setConfirmado] = useState(false);
  const [retirada, setRetirada] = useState(''); // valor do <input type="datetime-local">
  const [erro, setErro] = useState('');
  const [enviando, setEnviando] = useState(false);

  useEffect(() => { listarProdutos().then(setProdutos); }, []);

  const linhas = itens
    .map((item) => ({ item, produto: produtos.find((p) => p.id === item.produtoId) }))
    .filter((l) => l.produto);

  const total = linhas.reduce((soma, l) => soma + Number(l.produto!.preco) * l.item.quantidade, 0);

  async function confirmar() {
    setErro('');
    if (!usuario) {
      // O carrinho continua salvo; depois do login o cliente volta para esta tela
      navigate('/login', { state: { from: location } });
      return;
    }
    setEnviando(true);
    try {
      await criarReserva(
        linhas.map((l) => ({ produtoId: l.item.produtoId, quantidade: l.item.quantidade })),
        retirada ? new Date(retirada).toISOString() : undefined
      );
      limpar();
      setConfirmado(true);
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Não foi possível confirmar a reserva.');
    } finally {
      setEnviando(false);
    }
  }

  // Limites do seletor de data: de agora até 7 dias (o backend valida de novo).
  // Calculado uma única vez, ao abrir a tela.
  const [limites] = useState(() => {
    const paraInput = (d: Date) => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    const agora = new Date();
    return { min: paraInput(agora), max: paraInput(new Date(agora.getTime() + 7 * 24 * 3600 * 1000)) };
  });

  if (produtos.length === 0) return <div className="container-page py-16 text-muted">Carregando...</div>;

  if (confirmado) {
    return (
      <div className="container-page py-24 text-center">
        <p className="font-serif text-2xl mb-2 text-gold">Reserva confirmada!</p>
        <p className="text-muted mb-6">Apresente-se na adega na data combinada para retirada e pagamento.</p>
        <div className="flex gap-3 justify-center">
          <Link to="/minhas-reservas" className="btn-primary">Ver Minhas Reservas</Link>
          <Link to="/catalogo" className="btn-outline">Voltar ao Catálogo</Link>
        </div>
      </div>
    );
  }

  if (linhas.length === 0) {
    return (
      <div className="container-page py-24 text-center">
        <p className="font-serif text-2xl mb-2">Sua Adega está vazia</p>
        <p className="text-muted mb-6">Explore o catálogo e reserve suas bebidas favoritas.</p>
        <Link to="/catalogo" className="btn-primary">Ver Catálogo</Link>
      </div>
    );
  }

  return (
    <div className="container-page py-10 grid lg:grid-cols-[1fr_360px] gap-10">
      <div>
        <h1 className="font-serif text-3xl mb-6">Minha Adega (Carrinho de Reserva)</h1>
        <div className="bg-warning/10 border border-warning/30 rounded p-4 text-sm mb-6">
          <strong className="text-warning">Aviso importante:</strong> o pagamento será efetuado na retirada
          física, direto no caixa da adega. Nenhum valor é cobrado online hoje.
        </div>

        <div className="space-y-4">
          {linhas.map(({ item, produto }) => (
            <div key={item.produtoId} className="card flex items-center gap-4 p-4">
              <div className="w-16 h-16 bg-surface-2 rounded overflow-hidden shrink-0">
                <ProdutoImagem produto={produto!} inicialClassName="text-xl" />
              </div>
              <div className="flex-1">
                <p className="font-medium">{produto!.nome}</p>
                <p className="text-xs text-muted">{produto!.categoria}</p>
              </div>
              <div className="flex items-center border border-border rounded">
                <button className="px-2.5 py-1" onClick={() => atualizarQuantidade(item.produtoId, item.quantidade - 1)}>−</button>
                <span className="px-2.5">{item.quantidade}</span>
                <button className="px-2.5 py-1" onClick={() => atualizarQuantidade(item.produtoId, item.quantidade + 1)}>+</button>
              </div>
              <span className="text-gold w-24 text-right">{formatarPreco(Number(produto!.preco) * item.quantidade)}</span>
              <button className="text-muted hover:text-danger" onClick={() => remover(item.produtoId)} aria-label="Remover item">🗑</button>
            </div>
          ))}
        </div>
      </div>

      <aside className="card p-6 h-fit">
        <h2 className="font-serif text-xl mb-4">Detalhes de Retirada</h2>
        <p className="text-sm text-muted mb-4">Seg. a Dom. — 7h às 23h</p>
        <label className="field-label" htmlFor="retirada">Quando vai retirar? (opcional)</label>
        <input
          id="retirada" type="datetime-local" className="input mb-1"
          min={limites.min} max={limites.max} value={retirada} onChange={(e) => setRetirada(e.target.value)}
        />
        <p className="text-xs text-muted mb-6">A reserva vale por 24h após o horário combinado; depois disso expira e o estoque é liberado.</p>
        <div className="border-t border-border pt-4 flex justify-between mb-1 text-sm text-muted">
          <span>Subtotal das Bebidas</span><span>{formatarPreco(total)}</span>
        </div>
        <div className="flex justify-between font-serif text-xl mb-6">
          <span>Total da Reserva</span><span className="text-gold">{formatarPreco(total)}</span>
        </div>
        {erro && <p className="text-danger text-sm mb-3">{erro}</p>}
        <button className="btn-primary btn-block" disabled={enviando} onClick={confirmar}>
          {enviando ? 'Confirmando...' : usuario ? 'Confirmar Reserva para Retirada' : 'Entrar para Reservar'}
        </button>
      </aside>
    </div>
  );
}
