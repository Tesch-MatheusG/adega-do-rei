const router = require('express').Router();
const ctrl = require('../controllers/reservaController');
const verifyToken = require('../middlewares/verifyToken');
const isAdmin = require('../middlewares/isAdmin');
const validate = require('../middlewares/validate');
const loadReserva = require('../middlewares/ownerOrAdmin');
const { createRules, idOnlyRules, listRules } = require('../validators/reservaValidators');

// Todas exigem login
router.use(verifyToken);

router.post('/', createRules, validate, ctrl.criar);
router.get('/minhas', ctrl.minhas); // antes de '/:id', senão "minhas" seria lido como id

// Somente admin
router.get('/', isAdmin, listRules, validate, ctrl.listarTodas);
router.patch('/:id/pronta', isAdmin, idOnlyRules, validate, loadReserva, ctrl.marcarPronta);
router.patch('/:id/retirada', isAdmin, idOnlyRules, validate, loadReserva, ctrl.confirmarRetirada);

// Dono da reserva ou admin
router.get('/:id', idOnlyRules, validate, loadReserva, ctrl.buscar);
router.patch('/:id/cancelar', idOnlyRules, validate, loadReserva, ctrl.cancelar);

module.exports = router;
