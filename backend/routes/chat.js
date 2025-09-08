// backend/routes/chat.js
const express = require("express");
const router = express.Router();
const Message = require("../models/Message");
const { requireAuth } = require("../middleware/authMiddleware");

router.get("/history", requireAuth, async (req, res) => {
  try {
    const user = req.user;
    const scope = String(req.query.scope || "company");
    const limit = Math.min(parseInt(req.query.limit || "50", 10), 200);

    if (!user?.company) {
      return res.status(401).json({ ok: false, error: "Missing company on user (auth mapping/DB)" });
    }

    let filter;
    if (scope === "pharmacy") {
      if (!user?.pharmacyCode) {
        return res.status(401).json({ ok: false, error: "Missing pharmacyCode on user (scope=pharmacy)" });
      }
      filter = { company: user.company, scope: "pharmacy", pharmacyCode: user.pharmacyCode };
    } else {
      filter = { company: user.company, scope: "company" };
    }

    const items = await Message.find(filter).sort({ createdAt: -1 }).limit(limit).lean();
    return res.json({ ok: true, items: items.reverse() });
  } catch (e) {
    return res.status(500).json({ ok: false, error: e.message });
  }
});

module.exports = router;
