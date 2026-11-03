import { useEffect, useState } from 'react';
import { listarReservas, marcarPronta, confirmarRetirada, cancelarReserva } from '../../services/reservasService';
import type { Reserva, StatusReserva } from '../../types';
import { formatarPreco, formatarDataHora, STATUS_RESERVA } from '../../lib/format';

const FILTROS: { valor: StatusReserva | ''; rotulo: string }[] = [
  { valor: '', rotulo: 'Todas' },
  { valor: 'pendente', rotulo: 'Pendentes' },
  { valor: 'pronta', rotulo: 'Prontas' },
  { valor: 'retirada', rotulo: 'Retiradas' },
  { valor: 'expirada', rotulo: 'Expiradas' },
  { valor: 'cancelada', rotulo: 'Canceladas' },
];

// Gestão das reservas pelo dono (RF12): preparar, confirmar retirada ou cancelar.
export default function ReservasAdmin() {
  const [reservas, setReservas] = useState<Reserva[] | null>(null);
  const [filtro, setFiltro] = useState<StatusReserva | ''>('');
  const [erro, setErro] = useState('');

  function carregar() {
    listarReservas(filtro || undefined)
      .then((r) => { setReservas(r); setErro(''); })
      .catch((e: Error) => { setErro(e.message); setReservas([]); });
  }
  useEffect(carregar, [filtro]);

  async function agir(acao: () => Promise<unknown>) {
    try {
      await acao();
      carregar();
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Não foi possível concluir a ação.');
      carregar();
    }
  }

  function cancelar(id: number) {
    if (window.confirm(`Cancelar a reserva #${id}? O estoque será devolvido.`)) agir(() => cancelarReserva(id));
  }

  return (
    <div>
      <h1 className="font-serif text-2xl mb-4">Pedidos / Reservas</h1>

      <div className="flex flex-wrap gap-2 mb-5">
        {FILTROS.map((f) => (
          <button
            key={f.valor}
            onClick={() => setFiltro(f.valor)}
            className={`text-sm px-3 py-1.5 rounded border ${filtro === f.valor ? 'border-gold text-gold' : 'border-border text-muted hover:text-ink'}`}
          >
            {f.rotulo}
          </button>
        ))}
      </div>

      {erro && <p className="text-danger text-sm mb-4">{erro}</p>}

      {reservas === null ? (
        <p className="text-muted">Carregando...</p>
      ) : reservas.length === 0 ? (
        <div className="card p-8 text-center text-muted">Nenhuma reserva {filtro ? `"${STATUS_RESERVA[filtro].rotulo.toLowerCase()}"` : 'por enquanto'}.</div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-muted border-b border-border">
              <tr>
                <th className="p-3 font-normal">#</th>
                <th className="p-3 font-normal">Cliente</th>
                <th className="p-3 font-normal">Itens</th>
                <th className="p-3 font-normal">Retirada</th>
                <th className="p-3 font-normal">Total</th>
                <th className="p-3 font-normal">Status</th>
                <th className="p-3 font-normal">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {reservas.map((r) => {
                const st = STATUS_RESERVA[r.status];
                return (
                  <tr key={r.id} className="align-top">
                    <td className="p-3">{r.id}</td>
                    <td className="p-3">{r.usuario?.nome}<span className="block text-xs text-muted">{r.usuario?.email}</span></td>
                    <td className="p-3">{r.itens.map((i) => <span key={i.id} className="block">{i.quantidade}× {i.produto?.nome ?? i.produtoId}</span>)}</td>
                    <td className="p-3">{formatarDataHora(r.retiradaPrevista)}</td>
                    <td className="p-3">{formatarPreco(r.total)}</td>
                    <td className="p-3"><span className={st.classe}>{st.rotulo}</span></td>
                    <td className="p-3 space-x-3 whitespace-nowrap">
                      {r.status === 'pendente' && <button className="text-gold hover:underline" onClick={() => agir(() => marcarPronta(r.id))}>Marcar pronta</button>}
                      {(r.status === 'pendente' || r.status === 'pronta') && (
                        <>
                          <button className="text-gold hover:underline" onClick={() => agir(() => confirmarRetirada(r.id))}>Confirmar retirada</button>
                          <button className="text-danger hover:underline" onClick={() => cancelar(r.id)}>Cancelar</button>
                        </>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
