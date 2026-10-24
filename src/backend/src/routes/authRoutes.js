const router = require('express').Router();
const { register, login, me } = require('../controllers/authController');
const verifyToken = require('../middlewares/verifyToken');
const validate = require('../middlewares/validate');
const { registerRules, loginRules } = require('../validators/authValidators');

router.post('/register', registerRules, validate, register);
router.post('/login', loginRules, validate, login);
router.get('/me', verifyToken, me); // protegida

module.exports = router;
