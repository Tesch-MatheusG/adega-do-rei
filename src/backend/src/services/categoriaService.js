const { fn, col } = require('sequelize');
const { Categoria, Product } = require('../models');
const { normalizeCategoria } = require('../utils/normalize');

// Categorias iniciais, usadas só quando o banco ainda não tem nenhuma.
const CATEGORIAS_PADRAO = ['Cerveja', 'Vinho', 'Whisky', 'Vodka', 'Gin', 'Espumante', 'Refrigerante', 'Outros'];

// Roda uma vez na inicialização do servidor e pode rodar quantas vezes for preciso:
//  1) cadastra na tabela as categorias que os produtos JÁ existentes usam, para nada
//     que já estava no ar ficar de fora da lista;
//  2) se mesmo assim não houver nenhuma categoria, cria as padrão.
// Assim a mudança funciona num banco que já tem dados, sem ALTER TABLE manual.
async function sincronizarCategorias() {
  const usadas = await Product.findAll({ attributes: [[fn('DISTINCT', col('categoria')), 'categoria']], raw: true });
  const existentes = await Categoria.findAll();
  const chaves = new Set(existentes.map((c) => c.nome.toLowerCase()));
  let criadas = 0;

  const criar = async (nome) => {
    if (!nome || chaves.has(nome.toLowerCase())) return;
    try {
      await Categoria.create({ nome });
      chaves.add(nome.toLowerCase());
      criadas += 1;
    } catch (err) {
      // Ex.: o MySQL considera "Água" e "Agua" iguais (collation sem acento). Ignora a repetida.
      if (err.name !== 'SequelizeUniqueConstraintError') throw err;
    }
  };

  for (const { categoria } of usadas) await criar(normalizeCategoria(categoria));
  if (chaves.size === 0) for (const nome of CATEGORIAS_PADRAO) await criar(nome);

  return criadas;
}

module.exports = { sincronizarCategorias, CATEGORIAS_PADRAO };
