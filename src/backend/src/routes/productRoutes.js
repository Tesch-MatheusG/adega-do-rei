const router = require('express').Router();
const ctrl = require('../controllers/productController');
const verifyToken = require('../middlewares/verifyToken');
const isAdmin = require('../middlewares/isAdmin');
const validate = require('../middlewares/validate');
const { uploadImagem } = require('../middlewares/uploadImagem');
const { createRules, updateRules, idOnlyRules, stockEntryRules, stockWriteOffRules } = require('../validators/productValidators');

// Públicas (catálogo)
router.get('/', ctrl.listar);
router.get('/:id', idOnlyRules, validate, ctrl.buscar);
router.get('/:id/imagem', idOnlyRules, validate, ctrl.imagem);

// Protegidas: token válido + papel admin
router.post('/', verifyToken, isAdmin, createRules, validate, ctrl.criar);
router.put('/:id', verifyToken, isAdmin, updateRules, validate, ctrl.atualizar);
router.patch('/:id/estoque', verifyToken, isAdmin, stockEntryRules, validate, ctrl.entradaEstoque);
router.patch('/:id/baixa', verifyToken, isAdmin, stockWriteOffRules, validate, ctrl.baixaEstoque);
router.get('/:id/movimentacoes', verifyToken, isAdmin, idOnlyRules, validate, ctrl.movimentacoes);
router.put('/:id/imagem', verifyToken, isAdmin, idOnlyRules, validate, uploadImagem, ctrl.salvarImagem);
router.delete('/:id/imagem', verifyToken, isAdmin, idOnlyRules, validate, ctrl.removerImagem);
router.delete('/:id', verifyToken, isAdmin, idOnlyRules, validate, ctrl.remover);

module.exports = router;
