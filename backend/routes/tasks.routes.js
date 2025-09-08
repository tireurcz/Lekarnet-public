const express = require("express");
const router = express.Router();

// robustní import auth
const authMod = require("../middleware/authMiddleware");
const requireAuth =
  typeof authMod === "function"
    ? authMod
    : authMod?.requireAuth || authMod?.default;

if (typeof requireAuth !== "function") {
  throw new Error("requireAuth is not a function (authMiddleware export).");
}

// (volitelné) import controlleru, pokud ho máš
let tasksCtrl = null;
try { tasksCtrl = require("../controllers/tasks.controller"); } catch {}
try { if (!tasksCtrl) tasksCtrl = require("../controllers/tasksController"); } catch {}
try { if (!tasksCtrl) tasksCtrl = require("../controllers/taskController"); } catch {}

// helper – vždy vrátí funkci (když controller chybí, vrátí 501)
const ensure = (name, fallback) => {
  if (typeof tasksCtrl?.[name] === "function") return tasksCtrl[name];
  if (fallback) return fallback;
  return (_req, res) => res.status(501).json({ ok:false, error:`Tasks controller '${name}' not implemented` });
};

// --- ROUTES ---
// seznam všech (pokud používáš)
router.get("/", requireAuth, ensure("listTasks", (_req, res)=>res.json({ ok:true, items:[] })));

// ✅ NOVÉ: úkoly přihlášeného uživatele
router.get("/my", requireAuth, ensure("listMyTasks", (req, res) => {
  // jednoduchý placeholder – vrať prázdný seznam, ale s kontextem uživatele
  res.json({
    ok: true,
    user: { id: req.user?.id, company: req.user?.company, pharmacyCode: req.user?.pharmacyCode },
    items: [], // sem časem dosadíš reálná data z DB
  });
}));

// vytvoření/aktualizace/smazání – nechávám jako dřív, nebo fallback 501
router.post("/", requireAuth, ensure("createTask"));
router.patch("/:id", requireAuth, ensure("updateTask"));
router.post("/:id/complete", requireAuth, ensure("completeTask"));
router.delete("/:id", requireAuth, ensure("deleteTask"));

module.exports = router;
