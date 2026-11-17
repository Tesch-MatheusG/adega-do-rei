// Horário de funcionamento da adega: todos os dias, das 08h às 23h (horário de Brasília).
// O backend valida de novo; aqui só montamos as opções para o cliente não escolher um horário inválido.
export const FUSO = 'America/Sao_Paulo';
export const ABRE = '08:00';
export const ULTIMO_HORARIO = '22:30'; // às 23h a loja já está fechando
export const TEXTO_FUNCIONAMENTO = 'Todos os dias, das 8h às 23h';

const PASSO_MIN = 30;                  // intervalo entre os horários oferecidos
const ANTECEDENCIA_MIN_MS = 30 * 60 * 1000; // tempo mínimo para a adega separar o pedido
const MAX_DIAS = 7;                    // o backend só aceita retirada em até 7 dias

export interface OpcaoDia { valor: string; rotulo: string } // valor = AAAA-MM-DD

// Horários do dia: 08:00, 08:30, ... 22:30
const TODOS_HORARIOS: string[] = (() => {
  const lista: string[] = [];
  const [hIni, mIni] = ABRE.split(':').map(Number);
  const [hFim, mFim] = ULTIMO_HORARIO.split(':').map(Number);
  for (let m = hIni * 60 + mIni; m <= hFim * 60 + mFim; m += PASSO_MIN) {
    lista.push(`${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`);
  }
  return lista;
})();

// Instante exato de "dia + hora" em Brasília (UTC-3, sem horário de verão desde 2019)
export function montarISO(dia: string, hora: string): string {
  return new Date(`${dia}T${hora}:00-03:00`).toISOString();
}

function horariosValidos(dia: string, agora: Date): string[] {
  const minimo = agora.getTime() + ANTECEDENCIA_MIN_MS;
  const maximo = agora.getTime() + MAX_DIAS * 24 * 3600 * 1000;
  return TODOS_HORARIOS.filter((h) => {
    const t = new Date(`${dia}T${h}:00-03:00`).getTime();
    return t >= minimo && t <= maximo;
  });
}

export function gerarHorarios(dia: string, agora: Date = new Date()): string[] {
  return horariosValidos(dia, agora);
}

// Dias com pelo menos um horário disponível (hoje só aparece se ainda der tempo)
export function gerarDias(agora: Date = new Date()): OpcaoDia[] {
  const dias: OpcaoDia[] = [];
  for (let k = 0; k <= MAX_DIAS; k++) {
    const d = new Date(agora.getTime() + k * 24 * 3600 * 1000);
    const valor = d.toLocaleDateString('en-CA', { timeZone: FUSO }); // AAAA-MM-DD
    if (horariosValidos(valor, agora).length === 0) continue;
    const data = d.toLocaleDateString('pt-BR', { timeZone: FUSO, weekday: 'short', day: '2-digit', month: '2-digit' });
    const prefixo = k === 0 ? 'Hoje' : k === 1 ? 'Amanhã' : '';
    dias.push({ valor, rotulo: prefixo ? `${prefixo} (${data})` : data });
  }
  return dias;
}
