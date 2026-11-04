import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { minhasReservas, cancelarReserva } from '../services/reservasService';
import type { Reserva } from '../types';
import { formatarPreco, formatarDataHora, STATUS_RESERVA } from '../lib/format';

// Acompanhamento das reservas do cliente logado (RF05) e cancelamento (RF06).
export default function MinhasReservas() {
  const [reservas, setReservas] = useState<Reserva[] | null>(null);
  const [erro, setErro] = useState('');

  function carregar() {
    minhasReservas().then(setReservas).catch((e: Error) => { setErro(e.message); setReservas([]); });
  }
  useEffect(carregar, []);

  async function cancelar(id: number) {
    if (!window.confirm('Cancelar esta reserva? Os produtos voltam para o estoque.')) return;
    try {
      await cancelarReserva(id);
      carregar();
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Não foi possível cancelar.');
    }
  }

  if (reservas === null) return <div className="container-page py-16 text-muted">Carregando...</div>;

  return (
    <div className="container-page py-10 max-w-3xl">
      <h1 className="font-serif text-3xl mb-6">Minhas Reservas</h1>
      {erro && <p className="text-danger text-sm mb-4">{erro}</p>}

      {reservas.length === 0 ? (
        <div className="card p-8 text-center text-muted">
          <p className="mb-4">Você ainda não fez nenhuma reserva.</p>
          <Link to="/catalogo" className="btn-primary">Ver Catálogo</Link>
        </div>
      ) : (
        <div className="space-y-4">
          {reservas.map((r) => {
            const st = STATUS_RESERVA[r.status];
            const ativa = r.status === 'pendente' || r.status === 'pronta';
            return (
              <div key={r.id} className="card p-5">
                <div className="flex items-center justify-between mb-3">
                  <p className="font-serif text-lg">Reserva #{r.id}</p>
                  <span className={st.classe}>{st.rotulo}</span>
                </div>
                <ul className="text-sm space-y-1 mb-3">
                  {r.itens.map((i) => (
                    <li key={i.id} className="flex justify-between">
                      <span>{i.quantidade}× {i.produto?.nome ?? `Produto ${i.produtoId}`}</span>
                      <span className="text-muted">{formatarPreco(i.precoUnitario * i.quantidade)}</span>
                    </li>
                  ))}
                </ul>
                <div className="border-t border-border pt-3 flex flex-wrap items-center justify-between gap-2 text-sm">
                  <span className="text-muted">
                    Retirada: {formatarDataHora(r.retiradaPrevista)}
                    {ativa && <> · vale até {formatarDataHora(r.expiraEm)}</>}
                  </span>
                  <span className="text-gold font-serif text-lg">{formatarPreco(r.total)}</span>
                </div>
                {ativa && (
                  <button className="btn-outline mt-3 text-sm" onClick={() => cancelar(r.id)}>Cancelar reserva</button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
