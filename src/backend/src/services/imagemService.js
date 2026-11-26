const { Product, ProdutoImagem } = require('../models');

// Caminho (relativo à base da API, ex: https://.../api) que o frontend usa no <img>.
// O "v" muda quando a foto é trocada, para o navegador não mostrar a antiga do cache.
function montarUrl(produtoId, atualizadaEm) {
  return `/produtos/${produtoId}/imagem?v=${new Date(atualizadaEm).getTime()}`;
}

// Acrescenta "imagemUrl" (ou null) no JSON de um produto ou de uma lista de produtos.
// Uma única consulta, sem carregar os bytes das fotos.
async function comImagem(entrada) {
  const lista = Array.isArray(entrada) ? entrada : [entrada];
  const ids = lista.map((p) => p.id);
  const fotos = ids.length
    ? await ProdutoImagem.findAll({ where: { produtoId: ids }, attributes: ['produtoId', 'updatedAt'], raw: true })
    : [];
  const porProduto = new Map(fotos.map((f) => [f.produtoId, f.updatedAt]));

  const resultado = lista.map((p) => {
    const json = typeof p.toJSON === 'function' ? p.toJSON() : p;
    return { ...json, imagemUrl: porProduto.has(p.id) ? montarUrl(p.id, porProduto.get(p.id)) : null };
  });
  return Array.isArray(entrada) ? resultado : resultado[0];
}

// Grava (ou troca) a foto do produto
async function salvarImagem(produtoId, buffer, tipo) {
  const existente = await ProdutoImagem.findOne({ where: { produtoId }, attributes: ['id'] });
  if (existente) {
    await ProdutoImagem.update({ tipo, tamanho: buffer.length, dados: buffer }, { where: { produtoId } });
  } else {
    await ProdutoImagem.create({ produtoId, tipo, tamanho: buffer.length, dados: buffer });
  }
}

function removerImagem(produtoId) {
  return ProdutoImagem.destroy({ where: { produtoId } });
}

function buscarImagem(produtoId) {
  return ProdutoImagem.findOne({ where: { produtoId } });
}

// Foto de produto que foi removido do catálogo (exclusão lógica) não deve ser servida
function produtoAtivo(id) {
  return Product.findOne({ where: { id, ativo: true }, attributes: ['id'] });
}

module.exports = { comImagem, salvarImagem, removerImagem, buscarImagem, produtoAtivo };
