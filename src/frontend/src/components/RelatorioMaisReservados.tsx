import { useEffect, useState } from 'react';
import { listarMaisReservados } from '../services/relatoriosService';
import type { ProdutoMaisReservado } from '../types';

const PERIODOS = [
  { chave: '30', rotulo: 'Últimos 30 dias', dias: 30 },
  { chave: 'tudo', rotulo: 'Todo o período', dias: undefined },
] as const;

// Relatório do painel: produtos mais reservados. Conta as unidades de reservas pendentes, prontas e
// retiradas; reservas canceladas e expiradas não entram.
export default function RelatorioMaisReservados() {
  const [periodo, setPeriodo] = useState<(typeof PERIODOS)[number]['chave']>('30');
  const [resultado, setResultado] = useState<{ periodo: string; itens: ProdutoMaisReservado[]; erro: string } | null>(null);

  useEffect(() => {
    let atual = true; // ignora a resposta de um período que o admin já trocou
    const dias = PERIODOS.find((p) => p.chave === periodo)?.dias;
    listarMaisReservados(dias, 5)
      .then((itens) => atual && setResultado({ periodo, itens, erro: '' }))
      .catch((e: Error) => atual && setResultado({ periodo, itens: [], erro: e.message }));
    return () => { atual = false; };
  }, [periodo]);

  const carregando = resultado?.periodo !== periodo;
  const itens = resultado?.itens ?? [];
  const maior = Math.max(1, ...itens.map((i) => i.unidades)); // a barra do 1º lugar ocupa 100%

  return (
    <section className="mt-10">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <p className="font-serif text-lg">Produtos Mais Reservados</p>
        <div className="flex gap-2" role="group" aria-label="Período do relatório">
          {PERIODOS.map((p) => (
            <button
              key={p.chave}
              className={`text-sm px-3 py-1 rounded border ${periodo === p.chave ? 'border-gold text-gold' : 'border-border text-muted hover:text-ink'}`}
              aria-pressed={periodo === p.chave}
              onClick={() => setPeriodo(p.chave)}
            >
              {p.rotulo}
            </button>
          ))}
        </div>
      </div>

      <div className="card p-4">
        {carregando && <p className="text-muted text-sm">Carregando...</p>}
        {!carregando && resultado?.erro && <p className="text-danger text-sm">{resultado.erro}</p>}
        {!carregando && !resultado?.erro && itens.length === 0 && (
          <p className="text-muted text-sm">Nenhuma reserva neste período.</p>
        )}

        {!carregando && itens.length > 0 && (
          <ol className="space-y-4">
            {itens.map((item, i) => (
              <li key={item.produtoId}>
                <div className="flex items-baseline justify-between gap-4 text-sm mb-1">
                  <span><span className="text-gold mr-2">{i + 1}º</span>{item.nome} <span className="text-muted">· {item.categoria}</span></span>
                  <span className="text-muted whitespace-nowrap">
                    <strong className="text-ink">{item.unidades}</strong> un. em {item.reservas} {item.reservas === 1 ? 'reserva' : 'reservas'}
                  </span>
                </div>
                <div className="h-2 rounded bg-surface-2 overflow-hidden">
                  <div className="h-full bg-wine" style={{ width: `${(item.unidades / maior) * 100}%` }} />
                </div>
              </li>
            ))}
          </ol>
        )}
      </div>
    </section>
  );
}
