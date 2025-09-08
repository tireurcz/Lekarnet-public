// routes/chat.routes.js (CommonJS)
const express = require("express");
const router = express.Router();

// GET /api/chat/history → prázdná historie místo 404
router.get("/history", (req, res) => {
  res.json([]); // až napojíš DB, vrať reálné zprávy podle uživatele
});

module.exports = router;
