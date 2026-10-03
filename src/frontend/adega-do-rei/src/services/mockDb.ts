import type { Produto, Usuario } from '../types';

// ============================================================================
// "Banco de dados" simulado em memória + localStorage.
//
// Nesta etapa do projeto (entrega de Interfaces), a atividade não exige
// integração com a API REST — recomenda, inclusive, usar dados simulados.
// Este arquivo concentra TODOS os dados falsos da aplicação. Quando o
// backend (Node/Express/MySQL) for integrado na próxima fase, só os
// arquivos dentro de src/services/ precisam mudar (trocando o acesso ao
// mockDb por chamadas axios) — as páginas e componentes não mudam.
// ============================================================================

const STORAGE_KEY = 'adega-mock-db';

interface MockUser extends Usuario {
  senha: string; // só existe aqui porque é tudo simulado; nunca faríamos isso com um backend real
}

interface MockDb {
  produtos: Produto[];
  usuarios: MockUser[];
  proximoIdProduto: number;
  proximoIdUsuario: number;
}

const SEED: MockDb = {
  produtos: [
    { id: 1, nome: 'Glenfiddich 21 Anos Gran Reserva Rum Cask', categoria: 'Whisky', preco: 1290, volumeMl: 700, estoque: 18, ativo: true, descricao: 'Este whisky escocês de 21 anos é a expressão máxima do envelhecimento em barris de rum caribenho. Apresenta corpo rico e aveludado, com notas de frutas tropicais, baunilha e especiarias, finalização longa e aquecida com suaves toques de carvalho tostado.' },
    { id: 2, nome: 'Château Marquês Cabernet Sauvignon', categoria: 'Vinho', preco: 499, volumeMl: 750, estoque: 42, ativo: true, descricao: 'Vinho tinto encorpado, com taninos macios e notas de frutas vermelhas maduras.' },
    { id: 3, nome: 'Chimay Grande Réserve Tripel Belga', categoria: 'Cerveja', preco: 85, volumeMl: 330, estoque: 3, ativo: true, descricao: 'Cerveja trapista belga de alta fermentação, com notas frutadas e final seco.' },
    { id: 4, nome: "Hendrick's Orbium London Dry Gin", categoria: 'Gin', preco: 320, volumeMl: 700, estoque: 10, ativo: true, descricao: 'Gin inglês com toque floral de pepino e rosas.' },
    { id: 5, nome: 'Beluga Gold Line Vodka de Luxo', categoria: 'Vodka', preco: 480, volumeMl: 700, estoque: 6, ativo: true, descricao: 'Vodka russa premium, triplamente destilada.' },
    { id: 6, nome: 'Seleta Ouro Cachaça Envelhecida', categoria: 'Cachaça', preco: 150, volumeMl: 700, estoque: 22, ativo: true, descricao: 'Cachaça artesanal mineira, envelhecida em tonéis de carvalho.' },
  ],
  usuarios: [
    { id: 1, nome: 'Dom Augusto', email: 'admin@adegadorei.com', cpf: '52998224725', dataNascimento: '1980-01-15', role: 'admin', senha: 'Admin@1234' },
    { id: 2, nome: 'Maria Cliente', email: 'cliente@teste.com', cpf: '39053344705', dataNascimento: '1998-03-10', role: 'cliente', senha: 'Senha123' },
  ],
  proximoIdProduto: 7,
  proximoIdUsuario: 3,
};

function carregar(): MockDb {
  try {
    const salvo = localStorage.getItem(STORAGE_KEY);
    if (salvo) return JSON.parse(salvo);
  } catch { /* ignora e recria */ }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED));
  return structuredClone(SEED);
}

function salvar(db: MockDb) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
}

export const db = {
  get: carregar,
  set: salvar,
  // Útil para "zerar" o estado e voltar aos dados de exemplo (ex: antes de uma demo)
  reset: () => { localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED)); },
};

export type { MockUser, MockDb };
