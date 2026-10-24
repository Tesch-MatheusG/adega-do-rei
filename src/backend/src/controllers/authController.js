const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { Op } = require('sequelize');
const { User } = require('../models');

const SALT_ROUNDS = 10;

// POST /api/auth/register
async function register(req, res) {
  try {
    const { nome, email, cpf, dataNascimento, senha } = req.body;

    const existente = await User.findOne({ where: { [Op.or]: [{ email }, { cpf }] } });
    if (existente) {
      return res.status(409).json({ erro: 'E-mail ou CPF já cadastrado.' });
    }

    const hash = await bcrypt.hash(senha, SALT_ROUNDS);

    // O papel NUNCA vem do body: todo cadastro público é "cliente".
    // (senão qualquer um poderia se cadastrar como admin)
    const user = await User.create({
      nome, email, cpf, dataNascimento, senha: hash, role: 'cliente',
    });

    return res.status(201).json({
      mensagem: 'Usuário cadastrado com sucesso.',
      usuario: { id: user.id, nome: user.nome, email: user.email, role: user.role },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ erro: 'Erro interno ao cadastrar usuário.' });
  }
}

// POST /api/auth/login
async function login(req, res) {
  try {
    const { email, senha } = req.body;

    const user = await User.scope('comSenha').findOne({ where: { email } });
    const senhaOk = user && (await bcrypt.compare(senha, user.senha));

    // Mensagem genérica de propósito: não revela se o e-mail existe
    if (!senhaOk) {
      return res.status(401).json({ erro: 'E-mail ou senha incorretos.' });
    }

    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '2h' }
    );

    return res.json({
      token,
      usuario: { id: user.id, nome: user.nome, email: user.email, role: user.role },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ erro: 'Erro interno ao fazer login.' });
  }
}

// GET /api/auth/me  (rota protegida)
async function me(req, res) {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user) return res.status(404).json({ erro: 'Usuário não encontrado.' });
    return res.json(user);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ erro: 'Erro interno.' });
  }
}

module.exports = { register, login, me };
