const router = require('express').Router();
const ctrl = require('../controllers/productController');
const verifyToken = require('../middlewares/verifyToken');
const isAdmin = require('../middlewares/isAdmin');
const validate = require('../middlewares/validate');
const { createRules, updateRules, idOnlyRules, stockEntryRules } = require('../validators/productValidators');

// Públicas (catálogo)
router.get('/', ctrl.listar);
router.get('/:id', idOnlyRules, validate, ctrl.buscar);

// Protegidas: token válido + papel admin
router.post('/', verifyToken, isAdmin, createRules, validate, ctrl.criar);
router.put('/:id', verifyToken, isAdmin, updateRules, validate, ctrl.atualizar);
router.patch('/:id/estoque', verifyToken, isAdmin, stockEntryRules, validate, ctrl.entradaEstoque);
router.get('/:id/movimentacoes', verifyToken, isAdmin, idOnlyRules, validate, ctrl.movimentacoes);
router.delete('/:id', verifyToken, isAdmin, idOnlyRules, validate, ctrl.remover);

module.exports = router;
