// Controle de acesso por papel (RBAC). Rodar DEPOIS do verifyToken.
function isAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ erro: 'Acesso restrito ao administrador.' });
  }
  return next();
}

module.exports = isAdmin;
