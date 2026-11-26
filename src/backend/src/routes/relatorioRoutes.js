const router = require('express').Router();
const ctrl = require('../controllers/relatorioController');
const verifyToken = require('../middlewares/verifyToken');
const isAdmin = require('../middlewares/isAdmin');
const validate = require('../middlewares/validate');
const { maisReservadosRules } = require('../validators/relatorioValidators');

// Relatórios do painel: somente admin
router.get('/mais-reservados', verifyToken, isAdmin, maisReservadosRules, validate, ctrl.maisReservados);

module.exports = router;
