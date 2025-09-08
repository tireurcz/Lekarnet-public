// backend/routes/protectedRoutes.js
const express = require("express");
const router = express.Router();

// 🔒 robustní import (podrží default i pojmenované exporty)
const authMod = require("../middleware/authMiddleware");
const requireAuth =
  typeof authMod === "function"
    ? authMod
    : authMod?.requireAuth || authMod?.default;

const requireAdmin =
  authMod?.requireAdmin ||
  ((req, res, next) => {
    if (req.user?.role !== "admin") {
      return res.status(403).json({ ok: false, error: "Admin only" });
    }
    next();
  });

if (typeof requireAuth !== "function") {
  throw new Error(
    "requireAuth middleware is not a function. Check export in middleware/authMiddleware.js"
  );
}

/**
 * GET /api/protected/me
 */
router.get("/me", requireAuth, (req, res) => {
  return res.json({ ok: true, user: req.user });
});

/**
 * GET /api/protected/user
 */
router.get("/user", requireAuth, (req, res) => {
  return res.json({
    ok: true,
    role: req.user?.role || "user",
    message: "Protected: user",
  });
});

/**
 * GET /api/protected/admin
 */
router.get("/admin", requireAuth, requireAdmin, (req, res) => {
  return res.json({
    ok: true,
    role: req.user?.role,
    message: "Protected: admin",
  });
});

module.exports = router;
