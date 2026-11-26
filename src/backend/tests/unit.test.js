const { isValidCPF, isAdult } = require('../src/utils/cpf');
const { cleanText, normalizeCategoria, emptyToNull, roundMoney } = require('../src/utils/normalize');

describe('Validação de CPF (utils/cpf)', () => {
  test.each(['52998224725', '11144477735', '12345678909'])('aceita CPF válido %s', (cpf) => {
    expect(isValidCPF(cpf)).toBe(true);
  });
  test.each([
    ['dígito verificador errado', '52998224726'],
    ['sequência repetida', '11111111111'],
    ['menos de 11 dígitos', '1234567890'],
    ['com letras', '5299822472a'],
    ['com máscara (a máscara é removida antes, no validator)', '529.982.247-25'],
  ])('rejeita CPF inválido: %s', (_, cpf) => {
    expect(isValidCPF(cpf)).toBe(false);
  });
});

describe('Maioridade (RN01)', () => {
  const dataComIdade = (anos, diasAMais = 0) => {
    const d = new Date();
    d.setFullYear(d.getFullYear() - anos);
    d.setDate(d.getDate() + diasAMais);
    return d.toISOString().slice(0, 10);
  };
  test('aceita quem completa 18 anos hoje', () => expect(isAdult(dataComIdade(18))).toBe(true));
  test('rejeita quem faz 18 anos amanhã', () => expect(isAdult(dataComIdade(18, 1))).toBe(false));
  test('rejeita menor de idade', () => expect(isAdult(dataComIdade(15))).toBe(false));
});

describe('Transformações (utils/normalize)', () => {
  test('cleanText remove tags, espaços repetidos e preserva apóstrofo', () => {
    expect(cleanText("  Jack   Daniel's <b>Old</b> No.7 ")).toBe("Jack Daniel's Old No.7");
  });
  test('cleanText trata null/undefined como texto vazio', () => {
    expect(cleanText(null)).toBe('');
    expect(cleanText(undefined)).toBe('');
  });
  test('normalizeCategoria padroniza capitalização e mantém siglas', () => {
    expect(normalizeCategoria('  vinho   tinto ')).toBe('Vinho Tinto');
    expect(normalizeCategoria('cerveja IPA')).toBe('Cerveja IPA');
    expect(normalizeCategoria('espumante')).toBe('Espumante');
  });
  test('emptyToNull converte vazio em null', () => {
    expect(emptyToNull('   ')).toBeNull();
    expect(emptyToNull(' Safra 2019 ')).toBe('Safra 2019');
  });
  test('roundMoney arredonda para 2 casas', () => {
    expect(roundMoney(19.989999)).toBe(19.99);
    expect(roundMoney(10.005)).toBe(10.01);
    expect(roundMoney('89.9')).toBe(89.9);
  });
});
