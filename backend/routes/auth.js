const express = require('express');
const router = express.Router();
const { register, login } = require('../controllers/authController');

// Health/test
router.get('/test', (req, res) => {
  return res.json({ ok: true, message: 'Auth API OK' });
});

// POST /api/auth/register
router.post('/register', register);

// POST /api/auth/login
router.post('/login', login);

module.exports = router;