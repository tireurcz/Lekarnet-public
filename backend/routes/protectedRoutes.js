// backend/routes/protectedRoutes.js

const express = require("express");
const router = express.Router();
const { requireAuth, requireAdmin } = require("../middleware/authMiddleware");
const User = require("../models/User");

/**
 * Normalizuje roli na string.
 */
function normalizeRole(role) {
  if (typeof role === "string" && role.trim()) return role.trim();
  return "user";
}

/**
 * Pomocná funkce – vrátí bezpečné info o uživateli.
 * Preferuje data z req.user (z JWT), případně dohledá v DB.
 * VŽDY vrací { id, username, role, pharmacyCode } s role jako string.
 */
async function buildSafeUser(req) {
  // Základ z JWT (naplněné v requireAuth)
  const base = {
    id: req.user?.id || req.user?._id || null,
    username: req.user?.username ?? null,
    role: normalizeRole(req.user?.role),
    pharmacyCode:
      req.user?.pharmacyCode !== undefined ? req.user.pharmacyCode : null,
  };

  // Pokud chybí username nebo pharmacyCode a máme id, dohledáme v DB
  if ((!base.username || base.pharmacyCode === null) && base.id) {
    const fromDb = await User.findById(base.id)
      .select("username role pharmacyCode")
      .lean();

    if (fromDb) {
      base.username = base.username || fromDb.username || null;
      base.role =
        base.role && base.role !== "user"
          ? base.role
          : normalizeRole(fromDb.role);
      if (base.pharmacyCode === null) {
        base.pharmacyCode =
          fromDb.pharmacyCode !== undefined ? fromDb.pharmacyCode : null;
      }
    }
  }

  // Jistota, že role je string
  base.role = normalizeRole(base.role);

  return base;
}

/**
 * GET /api/protected/user
 * – přístup jen pro přihlášené (jakákoliv role)
 * – vrací info o uživateli vč. pharmacyCode (kód pobočky)
 * – role je vždy string (fallback "user")
 */
router.get("/user", requireAuth, async (req, res) => {
  try {
    const user = await buildSafeUser(req);
    return res.json({
      ok: true,
      user: {
        ...user,
        role: normalizeRole(user.role),
      },
      message: `Vítej, ${user.username || "uživateli"}!`,
    });
  } catch (err) {
    console.error("❌ /api/protected/user error:", err);
    return res.status(500).json({ ok: false, message: "Chyba serveru." });
  }
});

/**
 * GET /api/protected/admin
 * – přístup jen pro adminy (kontrola v requireAdmin)
 * – vrací info o uživateli (role vždy string)
 */
router.get("/admin", requireAuth, requireAdmin, async (req, res) => {
  try {
    const user = await buildSafeUser(req);
    return res.json({
      ok: true,
      user: {
        ...user,
        role: normalizeRole(user.role),
      },
      message: `Vítej, admine ${user.username || ""}!`,
    });
  } catch (err) {
    console.error("❌ /api/protected/admin error:", err);
    return res.status(500).json({ ok: false, message: "Chyba serveru." });
  }
});

/**
 * GET /api/protected/me
 * – univerzální endpoint pro frontend (ověření tokenu + identita)
 * – role je vždy string (fallback "user")
 */
router.get("/me", requireAuth, async (req, res) => {
  try {
    const user = await buildSafeUser(req);
    return res.json({
      ok: true,
      user: {
        ...user,
        role: normalizeRole(user.role),
      },
    });
  } catch (err) {
    console.error("❌ /api/protected/me error:", err);
    return res.status(500).json({ ok: false, message: "Chyba serveru." });
  }
});

module.exports = router;
