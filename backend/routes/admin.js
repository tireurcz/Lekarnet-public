// backend/routes/admin.js
const express = require("express");
const router = express.Router();

const authMod = require("../middleware/authMiddleware");

// Robustní import middleware – vezme správnou variantu exportu
const requireAuth =
  typeof authMod === "function"
    ? authMod
    : authMod?.requireAuth || authMod?.default;

const requireAdmin = authMod?.requireAdmin || ((req, res, next) => {
  if (req.user?.role !== "admin") {
    return res.status(403).json({ ok: false, error: "Admin only" });
  }
  next();
});

// Controllers
const {
  listUsers,
  getUser,
  updateAdminFields,
  deleteUser,
} = require("../controllers/adminController");

// Všechny cesty chráněné – jen pro adminy
router.use(requireAuth, requireAdmin);

// Přehled uživatelů + detail
router.get("/users", listUsers);
router.get("/users/:id", getUser);

// Změna role / pharmacyCode
router.patch("/users/:id", updateAdminFields);

// (volitelně) smazání uživatele
router.delete("/users/:id", deleteUser);

module.exports = router;
