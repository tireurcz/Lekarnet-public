// backend/middleware/authMiddleware.js
const jwt = require('jsonwebtoken');

function normalizeUser(decoded) {
  const payload = decoded && typeof decoded === 'object' ? decoded : {};

  const id =
    payload.id ||
    payload._id ||
    payload.sub ||
    null;

  const role =
    typeof payload.role === 'string' && payload.role.trim()
      ? payload.role.trim()
      : 'user';

  return {
    ...payload,
    id,                 // sjednocený identifikátor
    _id: id,            // kompatibilita, pokud někde čteš _id
    role,               // vždy string
    username: payload.username ?? payload.name ?? payload.user ?? null,
    pharmacyCode:
      payload.pharmacyCode !== undefined ? payload.pharmacyCode : null,
  };
}

const requireAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res
      .status(401)
      .json({ ok: false, error: 'Chybí nebo neplatný token' });
  }

  const token = authHeader.split(' ')[1];

  try {
    if (!process.env.JWT_SECRET) {
      return res
        .status(500)
        .json({ ok: false, error: 'Chybí JWT_SECRET na serveru' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = normalizeUser(decoded); // { id, _id, role, username, pharmacyCode, ... }
    next();
  } catch (err) {
    return res
      .status(401)
      .json({ ok: false, error: 'Neplatný nebo expirovaný token' });
  }
};

const requireAdmin = (req, res, next) => {
  if (req.user?.role !== 'admin') {
    return res
      .status(403)
      .json({ ok: false, error: 'Pouze pro adminy' });
  }
  next();
};

module.exports = {
  requireAuth,
  requireAdmin,
};
