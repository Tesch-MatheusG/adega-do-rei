import type { Produto } from '../types';

// Minúsculas e sem acento: "Café" e "cafe" passam a ser iguais.
function normalizar(texto: string): string {
  return texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
}

// Variações da palavra digitada para tolerar singular/plural:
// "vinhos" -> "vinho", "gins" -> "gin", "whisky" -> "whiskie" (para achar "Whiskies")
function variacoes(palavra: string): string[] {
  const lista = [palavra];
  if (palavra.length > 3 && palavra.endsWith('s')) lista.push(palavra.slice(0, -1));
  if (palavra.length > 3 && palavra.endsWith('y')) lista.push(`${palavra.slice(0, -1)}ie`);
  return lista;
}

function palavrasDe(texto: string): string[] {
  return normalizar(texto).split(/[^a-z0-9]+/).filter(Boolean);
}

// Uma palavra digitada "bate" se ela (ou seu singular) aparece dentro de alguma palavra do texto.
function bate(palavraDigitada: string, textoNormalizado: string): boolean {
  return variacoes(palavraDigitada).some((v) => textoNormalizado.includes(v));
}

// Pesquisa por NOME e por CATEGORIA ao mesmo tempo.
// - "vinho"        -> todos da categoria Vinhos + produtos com "vinho" no nome
// - "heineken"     -> só produtos com esse nome (não existe categoria assim)
// - "vinho tinto"  -> cada palavra precisa aparecer no nome ou na categoria
// Ordem do resultado: primeiro quem bate pela categoria, depois quem bate só pelo nome
// (dentro de cada grupo mantém a ordem recebida, que já vem alfabética da API).
export function buscarProdutos(produtos: Produto[], termo: string): Produto[] {
  const palavras = palavrasDe(termo);
  if (palavras.length === 0) return produtos;

  const resultado: { produto: Produto; porCategoria: boolean }[] = [];
  for (const produto of produtos) {
    const nome = normalizar(produto.nome);
    const categoria = normalizar(produto.categoria);

    const todasBatem = palavras.every((p) => bate(p, nome) || bate(p, categoria));
    if (!todasBatem) continue;

    resultado.push({ produto, porCategoria: palavras.some((p) => bate(p, categoria)) });
  }

  return [
    ...resultado.filter((r) => r.porCategoria),
    ...resultado.filter((r) => !r.porCategoria),
  ].map((r) => r.produto);
}
