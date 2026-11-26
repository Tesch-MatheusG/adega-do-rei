// Valida CPF pelos dígitos verificadores (só números, 11 dígitos)
function isValidCPF(cpf) {
  if (!/^\d{11}$/.test(cpf)) return false;
  if (/^(\d)\1{10}$/.test(cpf)) return false; // 11111111111 etc.

  const calcDigit = (base) => {
    let sum = 0;
    for (let i = 0; i < base.length; i++) {
      sum += Number(base[i]) * (base.length + 1 - i);
    }
    const rest = (sum * 10) % 11;
    return rest === 10 ? 0 : rest;
  };

  const d1 = calcDigit(cpf.slice(0, 9));
  const d2 = calcDigit(cpf.slice(0, 10));
  return d1 === Number(cpf[9]) && d2 === Number(cpf[10]);
}

// Confere se a data (AAAA-MM-DD) corresponde a alguém com 18 anos ou mais
function isAdult(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const today = new Date();
  let age = today.getFullYear() - y;
  const hadBirthday =
    today.getMonth() + 1 > m || (today.getMonth() + 1 === m && today.getDate() >= d);
  if (!hadBirthday) age--;
  return age >= 18;
}

module.exports = { isValidCPF, isAdult };
