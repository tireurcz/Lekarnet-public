// backend/routes/admin.js
const express = require("express");
const router = express.Router();
const { requireAuth, requireAdmin } = require("../middleware/authMiddleware");
const {
  listUsers,
  getUser,
  updateAdminFields,
  deleteUser,
} = require("../controllers/adminController");

// Vše admin-only
router.use(requireAuth, requireAdmin);

// Přehled uživatelů + detail
router.get("/users", listUsers);
router.get("/users/:id", getUser);

// Změna role / pharmacyCode
router.patch("/users/:id", updateAdminFields);

// (volitelně) smazání uživatele
router.delete("/users/:id", deleteUser);

module.exports = router;
