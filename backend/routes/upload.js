// 📁 backend/routes/upload.js
const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const xlsx = require("xlsx");

const router = express.Router();

// 🧠 Storage engine
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const { firma, pharmacyCode } = req.params;
    const uploadPath = path.join(__dirname, `../uploads/${firma}/${pharmacyCode}`);
    fs.mkdirSync(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    if (file.fieldname === "sklad") {
      cb(null, "sklad" + ext);
    } else if (file.fieldname === "pohyby") {
      cb(null, "pohyby" + ext);
    } else {
      cb(new Error("Neplatné jméno pole pro soubor."));
    }
  },
});

const upload = multer({ storage });

// 📅 Timestamp extractor
function extractTimestamp(filePath, source) {
  try {
    const workbook = xlsx.readFile(filePath, { cellDates: true });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];

    if (source === "sklad") {
      return sheet["T8"]?.v || null;
    } else if (source === "pohyby") {
      const text = sheet["A8"]?.v || "";
      const match = text.match(/\d{2}\.\d{2}\.\d{4} \d{1,2}:\d{2}/);
      return match ? match[0] : null;
    }
  } catch (err) {
    console.error(`Nepodařilo se zpracovat ${source} soubor:`, err);
    return null;
  }
}

// ✅ Upload endpoint
// POST /api/upload/:firma/:pharmacyCode
router.post(
  "/:firma/:pharmacyCode",
  upload.fields([
    { name: "sklad", maxCount: 1 },
    { name: "pohyby", maxCount: 1 },
  ]),
  (req, res) => {
    try {
      const { firma, pharmacyCode } = req.params;
      if (!req.files.sklad || !req.files.pohyby) {
        return res.status(400).json({ error: "Oba soubory (sklad i pohyby) jsou povinné." });
      }

      const uploadPath = path.join(__dirname, `../uploads/${firma}/${pharmacyCode}`);
      const skladPath = path.join(uploadPath, req.files.sklad[0].filename);
      const pohybyPath = path.join(uploadPath, req.files.pohyby[0].filename);

      const skladTimestamp = extractTimestamp(skladPath, "sklad");
      const pohybyTimestamp = extractTimestamp(pohybyPath, "pohyby");

      // spočítat nejnovější timestamp
      const latestTimestamp = [skladTimestamp, pohybyTimestamp]
        .map((s) => (s ? new Date(s) : null))
        .filter((d) => d instanceof Date && !isNaN(d))
        .sort((a, b) => b - a)[0]?.toISOString() || null;

      const meta = {
        skladTimestamp,
        pohybyTimestamp,
        latestTimestamp,
        lastUpload: new Date().toISOString(),
      };

      fs.writeFileSync(path.join(uploadPath, ".meta.json"), JSON.stringify(meta, null, 2));

      return res.json({
        message: "Soubory úspěšně nahrány.",
        uploaded: Object.keys(req.files),
        path: `/uploads/${firma}/${pharmacyCode}/`,
        ...meta,
      });
    } catch (err) {
      console.error("Chyba při uploadu:", err);
      return res.status(500).json({ error: "Chyba při zpracování souborů." });
    }
  }
);

// ✅ Metadata fetch endpoint
// GET /api/upload/:firma/:pharmacyCode/meta
router.get("/:firma/:pharmacyCode/meta", (req, res) => {
  const { firma, pharmacyCode } = req.params;
  const metaPath = path.join(__dirname, `../uploads/${firma}/${pharmacyCode}/.meta.json`);

  try {
    if (!fs.existsSync(metaPath)) {
      return res.json({
        skladTimestamp: null,
        pohybyTimestamp: null,
        latestTimestamp: null,
        lastUpload: null,
      });
    }

    const meta = JSON.parse(fs.readFileSync(metaPath, "utf-8"));
    return res.json(meta);
  } catch (err) {
    console.error("Chyba při čtení .meta.json:", err);
    return res.status(500).json({ error: "Nepodařilo se načíst metadata." });
  }
});

module.exports = router;
