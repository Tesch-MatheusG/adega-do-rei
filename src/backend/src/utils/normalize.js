// Funções de tratamento (limpeza e padronização) aplicadas aos dados ANTES de
// chegarem ao banco. Usadas pelos validators (sanitizers) e pelos controllers.

// Remove caracteres de controle, tags HTML e espaços repetidos.
// Não usa escape de HTML: o React já escapa na exibição, e gravar "&#x27;" no
// banco corromperia nomes como "Jack Daniel's".
function cleanText(value) {
  return String(value ?? '')
    .replace(/[\u0000-\u001F\u007F]/g, ' ')
    .replace(/<[^>]*>/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// Padroniza categoria: "vinho   tinto" -> "Vinho Tinto" (mantém siglas como "IPA")
function normalizeCategoria(value) {
  return cleanText(value).replace(/(^|\s)(\p{L})/gu, (_, sep, letra) => sep + letra.toUpperCase());
}

// Texto opcional: vazio vira null (evita guardar "" e null misturados)
function emptyToNull(value) {
  const texto = cleanText(value);
  return texto === '' ? null : texto;
}

// Dinheiro com 2 casas decimais (evita 19.989999 / 10.005 virar valor quebrado)
function roundMoney(value) {
  return Math.round((Number(value) + Number.EPSILON) * 100) / 100;
}

module.exports = { cleanText, normalizeCategoria, emptyToNull, roundMoney };
