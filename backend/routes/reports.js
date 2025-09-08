// backend/routes/reports.js
const express = require("express");
const path = require("path");
const fs = require("fs");
const router = express.Router();
const { requireAuth } = require("../middleware/authMiddleware");

// GET /api/reports/:filename  (chráněné tokenem)
router.get("/:filename", requireAuth, (req, res) => {
  const { filename } = req.params;

  // jednoduchá ochrana proti path traversal
  if (filename.includes("..") || filename.includes("/") || filename.includes("\\")) {
    return res.status(400).json({ message: "Invalid filename" });
  }

  const reportsDir = path.join(__dirname, "..", "reports"); // backend/reports
  const filePath = path.join(reportsDir, filename);

  fs.access(filePath, fs.constants.R_OK, (err) => {
    if (err) return res.status(404).json({ message: "File not found" });

    // nastav content-type pro PDF (příp. dle přípony)
    if (path.extname(filename).toLowerCase() === ".pdf") {
      res.setHeader("Content-Type", "application/pdf");
    }
    res.sendFile(filePath);
  });
});

module.exports = router;
