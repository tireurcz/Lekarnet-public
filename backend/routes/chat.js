// backend/routes/chat.js
const express = require("express");
const router = express.Router();
const Message = require("../models/Message");

// 🔒 robustní import auth middleware (podrží default i pojmenovaný export)
const authMod = require("../middleware/authMiddleware");
const requireAuth =
  typeof authMod === "function"
    ? authMod
    : authMod?.requireAuth || authMod?.default;

if (typeof requireAuth !== "function") {
  throw new Error(
    "requireAuth middleware is not a function. Check export in middleware/authMiddleware.js"
  );
}

// Pomocný helper – bezpečný string (ne null/undefined)
const s = (v) => (v == null ? "" : String(v));

// ✅ GET /api/chat/history?scope=company|pharmacy&limit=50
router.get("/history", requireAuth, async (req, res) => {
  try {
    const user = req.user;
    const rawScope = s(req.query.scope || "company").toLowerCase();
    const scope = rawScope === "pharmacy" ? "pharmacy" : "company";
    const limit = Math.min(parseInt(req.query.limit || "50", 10) || 50, 200);

    if (!user?.company) {
      return res
        .status(401)
        .json({ ok: false, error: "Missing company on user (auth mapping/DB)" });
    }

    let filter;
    if (scope === "pharmacy") {
      if (!user?.pharmacyCode) {
        return res
          .status(401)
          .json({ ok: false, error: "Missing pharmacyCode on user (scope=pharmacy)" });
      }
      filter = {
        company: s(user.company),
        scope: "pharmacy",
        pharmacyCode: s(user.pharmacyCode),
      };
    } else {
      filter = { company: s(user.company), scope: "company" };
    }

    const items = await Message.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    // vracíme od nejstarší po nejnovější
    return res.json({ ok: true, items: items.reverse() });
  } catch (e) {
    return res.status(500).json({ ok: false, error: e.message });
  }
});

// ✅ POST /api/chat/message  { scope: "company"|"pharmacy", text: "..." }
router.post("/message", requireAuth, async (req, res) => {
  try {
    const user = req.user;
    const rawScope = s(req.body?.scope || "company").toLowerCase();
    const scope = rawScope === "pharmacy" ? "pharmacy" : "company";
    const text = s(req.body?.text).trim();

    if (!text) {
      return res.status(400).json({ ok: false, error: "Text required" });
    }
    if (!user?.company) {
      return res
        .status(401)
        .json({ ok: false, error: "Missing company on user (auth mapping/DB)" });
    }
    if (scope === "pharmacy" && !user?.pharmacyCode) {
      return res
        .status(401)
        .json({ ok: false, error: "Missing pharmacyCode on user (scope=pharmacy)" });
    }

    const doc = await Message.create({
      company: s(user.company),
      pharmacyCode: scope === "pharmacy" ? s(user.pharmacyCode) : null,
      scope,
      authorId: s(user.id),
      authorName: s(user.name || "Uživatel"),
      text,
    });

    // vrátíme minimalistický objekt
    return res.json({
      ok: true,
      message: {
        _id: String(doc._id),
        company: doc.company,
        pharmacyCode: doc.pharmacyCode,
        scope: doc.scope,
        authorId: doc.authorId,
        authorName: doc.authorName,
        text: doc.text,
        createdAt: doc.createdAt,
      },
    });
  } catch (e) {
    return res.status(500).json({ ok: false, error: e.message });
  }
});

// (volitelné) rychlý ping endpoint pro debug
router.get("/_health", (_req, res) => {
  res.json({ ok: true, service: "chat-routes" });
});

module.exports = router;
