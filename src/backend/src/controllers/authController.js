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

// PATCH /api/auth/me  (rota protegida) - o próprio usuário edita nome e/ou e-mail.
// Só esses dois campos são lidos: CPF, nascimento e papel não mudam por aqui (RN01/RN02).
async function atualizarPerfil(req, res) {
  try {
    const { nome, email, senhaAtual } = req.body;
    if (nome === undefined && email === undefined) {
      return res.status(400).json({ erro: 'Informe o nome ou o e-mail a ser alterado.' });
    }

    const user = await User.scope('comSenha').findByPk(req.user.id);
    if (!user) return res.status(404).json({ erro: 'Usuário não encontrado.' });

    const campos = {};
    if (nome !== undefined) campos.nome = nome;

    if (email !== undefined && email !== user.email) {
      // O e-mail é o login: trocar exige a senha atual, para que um token roubado não consiga mudá-lo
      if (!senhaAtual || !(await bcrypt.compare(senhaAtual, user.senha))) {
        return res.status(403).json({ erro: 'Para alterar o e-mail, informe sua senha atual corretamente.' });
      }
      const emUso = await User.findOne({ where: { email, id: { [Op.ne]: user.id } } });
      if (emUso) return res.status(409).json({ erro: 'Esse e-mail já está em uso por outra conta.' });
      campos.email = email;
    }

    await user.update(campos);
    return res.json(await User.findByPk(user.id)); // sem o hash da senha
  } catch (err) {
    // Duas requisições juntas com o mesmo e-mail: o índice único barra
    if (err.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({ erro: 'Esse e-mail já está em uso por outra conta.' });
    }
    console.error(err);
    return res.status(500).json({ erro: 'Erro interno ao atualizar o perfil.' });
  }
}

// PATCH /api/auth/senha  (rota protegida) - troca de senha com confirmação da atual
async function alterarSenha(req, res) {
  try {
    const { senhaAtual, novaSenha } = req.body;
    const user = await User.scope('comSenha').findByPk(req.user.id);
    if (!user) return res.status(404).json({ erro: 'Usuário não encontrado.' });

    if (!(await bcrypt.compare(senhaAtual, user.senha))) {
      return res.status(403).json({ erro: 'Senha atual incorreta.' });
    }
    if (senhaAtual === novaSenha) {
      return res.status(400).json({ erro: 'A nova senha deve ser diferente da atual.' });
    }

    await user.update({ senha: await bcrypt.hash(novaSenha, SALT_ROUNDS) });
    return res.json({ mensagem: 'Senha alterada com sucesso.' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ erro: 'Erro interno ao alterar a senha.' });
  }
}

module.exports = { register, login, me, atualizarPerfil, alterarSenha };
