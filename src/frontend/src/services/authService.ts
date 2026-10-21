import type { Usuario } from '../types';
import { db } from './mockDb';
import { isValidCPF, isAdult } from '../lib/cpf';

const atraso = (ms = 300) => new Promise((resolve) => setTimeout(resolve, ms));

// "Token" simulado: aqui é só o id do usuário em texto. Quando a API real
// entrar, isso vira o JWT de verdade vindo do backend — o resto do app
// (AuthContext) não precisa mudar, porque só lida com a string do token.
const FAKE_TOKEN_PREFIX = 'mock-token-';

export interface RegisterInput {
  nome: string;
  email: string;
  cpf: string;
  dataNascimento: string; // AAAA-MM-DD
  senha: string;
}

export async function login(email: string, senha: string): Promise<{ token: string; usuario: Usuario }> {
  await atraso();
  const { usuarios } = db.get();
  const user = usuarios.find((u) => u.email.toLowerCase() === email.toLowerCase() && u.senha === senha);
  if (!user) throw new Error('E-mail ou senha incorretos.');

  const { senha: _s, ...usuario } = user;
  return { token: FAKE_TOKEN_PREFIX + user.id, usuario };
}

export async function register(dados: RegisterInput): Promise<void> {
  await atraso();
  const cpfLimpo = dados.cpf.replace(/\D/g, '');

  if (!isValidCPF(cpfLimpo)) throw new Error('CPF inválido.');
  if (!isAdult(dados.dataNascimento)) throw new Error('É necessário ter 18 anos ou mais.');
  if (dados.senha.length < 8) throw new Error('A senha deve ter no mínimo 8 caracteres.');

  const base = db.get();
  const existe = base.usuarios.some((u) => u.email.toLowerCase() === dados.email.toLowerCase() || u.cpf === cpfLimpo);
  if (existe) throw new Error('E-mail ou CPF já cadastrado.');

  base.usuarios.push({
    id: base.proximoIdUsuario,
    nome: dados.nome,
    email: dados.email,
    cpf: cpfLimpo,
    dataNascimento: dados.dataNascimento,
    role: 'cliente',
    senha: dados.senha,
  });
  base.proximoIdUsuario += 1;
  db.set(base);
}

export async function me(token: string): Promise<Usuario> {
  await atraso(100);
  if (!token.startsWith(FAKE_TOKEN_PREFIX)) throw new Error('Token inválido.');
  const id = Number(token.replace(FAKE_TOKEN_PREFIX, ''));
  const { usuarios } = db.get();
  const user = usuarios.find((u) => u.id === id);
  if (!user) throw new Error('Usuário não encontrado.');
  const { senha: _s, ...usuario } = user;
  return usuario;
}
