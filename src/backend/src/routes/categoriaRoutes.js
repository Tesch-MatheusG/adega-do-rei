const router = require('express').Router();
const ctrl = require('../controllers/categoriaController');
const verifyToken = require('../middlewares/verifyToken');
const isAdmin = require('../middlewares/isAdmin');
const validate = require('../middlewares/validate');
const { createRules } = require('../validators/categoriaValidators');

router.get('/', ctrl.listar); // pública
router.post('/', verifyToken, isAdmin, createRules, validate, ctrl.criar); // só admin

module.exports = router;
