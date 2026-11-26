const router = require('express').Router();
const { register, login, me, atualizarPerfil, alterarSenha } = require('../controllers/authController');
const verifyToken = require('../middlewares/verifyToken');
const validate = require('../middlewares/validate');
const { registerRules, loginRules, updateProfileRules, changePasswordRules } = require('../validators/authValidators');

router.post('/register', registerRules, validate, register);
router.post('/login', loginRules, validate, login);
router.get('/me', verifyToken, me); // protegida
router.patch('/me', verifyToken, updateProfileRules, validate, atualizarPerfil); // edita nome/e-mail
router.patch('/senha', verifyToken, changePasswordRules, validate, alterarSenha);

module.exports = router;
