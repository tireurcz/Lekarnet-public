// backend/routes/chat.js
const express = require("express");
const router = express.Router();
const Message = require("../models/Message");
const { requireAuth } = require("../middleware/authMiddleware"); // nebo default export, dle tvého souboru

router.get("/history", requireAuth, async (req, res) => {
  try {
    const user = req.user;
    const scope = String(req.query.scope || "company"); // company|pharmacy
    const limit = Math.min(parseInt(req.query.limit || "50", 10), 200);

    if (!user?.company) {
      return res.status(400).json({ ok: false, error: "Missing company on user" });
    }

    let filter;
    if (scope === "pharmacy") {
      if (!user?.pharmacyCode) {
        return res.status(400).json({ ok: false, error: "Missing pharmacyCode on user" });
      }
      filter = {
        company: String(user.company),
        scope: "pharmacy",
        pharmacyCode: String(user.pharmacyCode),
      };
    } else {
      filter = { company: String(user.company), scope: "company" };
    }

    const items = await Message.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    res.json({ ok: true, items: items.reverse() });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

module.exports = router;
