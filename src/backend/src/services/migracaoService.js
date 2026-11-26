const { DataTypes } = require('sequelize');
const { sequelize } = require('../models');

// O sequelize.sync() cria tabelas que faltam, mas NÃO altera as que já existem. Quando um Model
// ganha uma coluna nova, o banco que já está no ar (Aiven) precisa dela também. Em vez de pedir
// um ALTER TABLE manual, a API confere e cria a coluna sozinha na inicialização.
// Pode rodar quantas vezes for preciso: se a coluna já existe, não faz nada.

async function garantirColuna(tabela, coluna, definicao) {
  const qi = sequelize.getQueryInterface();
  const colunas = await qi.describeTable(tabela);
  if (colunas[coluna]) return false;
  try {
    await qi.addColumn(tabela, coluna, definicao);
    return true;
  } catch (err) {
    // Duas instâncias subindo ao mesmo tempo (deploy no Render): a outra já criou a coluna.
    if (/duplicate column/i.test(err.message)) return false;
    throw err;
  }
}

// Retorna quantas colunas foram criadas nesta execução
async function aplicarMigracoes() {
  let criadas = 0;
  // Limite do alerta de estoque baixo, por produto. Os produtos que já existem ficam com 5 (o antigo limite fixo).
  if (await garantirColuna('produtos', 'estoqueMinimo', { type: DataTypes.INTEGER, allowNull: false, defaultValue: 5 })) criadas += 1;
  return criadas;
}

module.exports = { aplicarMigracoes, garantirColuna };
