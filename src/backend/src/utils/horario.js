// Horário de funcionamento da adega: todos os dias, das 08h às 23h (horário de Brasília).
// O servidor (Render) roda em UTC, então a conversão usa o fuso explicitamente.
const FUSO = 'America/Sao_Paulo';
const ABRE_MIN = 8 * 60;   // 08:00
const FECHA_MIN = 23 * 60; // 23:00 — às 23h já está fechando, então o último horário de retirada é antes disso

const formatador = new Intl.DateTimeFormat('en-GB', { timeZone: FUSO, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });

function minutosDoDia(data) {
  const partes = Object.fromEntries(formatador.formatToParts(data).map((p) => [p.type, p.value]));
  return Number(partes.hour) * 60 + Number(partes.minute);
}

// true se o instante cai entre 08:00 (inclusive) e 23:00 (exclusive) no horário de Brasília
function dentroDoHorarioDeFuncionamento(data) {
  const min = minutosDoDia(data);
  return min >= ABRE_MIN && min < FECHA_MIN;
}

module.exports = { FUSO, ABRE_MIN, FECHA_MIN, dentroDoHorarioDeFuncionamento };
