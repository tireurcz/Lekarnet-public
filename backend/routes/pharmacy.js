// backend/routes/pharmacy.js
const express = require("express");
const path = require("path");
const fs = require("fs");
const XLSX = require("xlsx");
const { requireAuth } = require("../middleware/authMiddleware");

const router = express.Router();

// Pomocné – převod CZ čísel a prázdných polí
const toNum = (v) => {
  if (v === null || v === undefined || v === "") return 0;
  if (typeof v === "number") return v;
  const n = Number(String(v).replace(/\s/g, "").replace(",", "."));
  return Number.isNaN(n) ? 0 : n;
};

// Očekávané hlavičky dle tvého vzoru:
// KOD_VZP | NÁZEV | DOPLNĚK | STARÁ ÚHRADA | NOVÁ ÚHRADA | ZBÝVÁ DNÍ | PLATNOST OD |
// 64 | 67 | 65 | 66 | 63 | 71 | 74 | 30 | CELKEM
router.get("/inventory", requireAuth, (req, res) => {
  try {
    const pharmacyCode = req.user?.pharmacyCode ? String(req.user.pharmacyCode) : null;
    if (!pharmacyCode) {
      return res.status(400).json({ message: "Uživatel nemá přiřazenou pobočku (pharmacyCode)." });
    }

    const filePath = path.join(__dirname, "..", "data", "zmeny_uhrad.xlsx");
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: "Soubor zmeny_uhrad.xlsx nebyl nalezen v backend/data." });
    }

    // Načtení prvního listu
    const wb = XLSX.readFile(filePath);
    const sheetName = wb.SheetNames[0];
    const ws = wb.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(ws, { defval: "" });

    // Z hlavičky ověříme, že existuje sloupec pro danou pobočku
    // (vezmeme klíče z prvního řádku)
    const headerKeys = Object.keys(rows[0] || {});
    // pharmacyCode může být ve formátu "64" – hlavička je string "64"
    const hasBranchCol = headerKeys.includes(pharmacyCode);
    if (!hasBranchCol) {
      return res.status(400).json({
        message: `V souboru není sloupec pro pobočku "${pharmacyCode}". K dispozici: ${headerKeys
          .filter((k) => /^\d+$/.test(k))
          .join(", ")}`,
      });
    }

    // Namapujeme řádky – pro každou položku vytáhneme "stock" z daného sloupce pobočky
    const mapped = rows.map((r) => {
      const stock = toNum(r[pharmacyCode]); // ← hodnota ze sloupce pobočky
      return {
        code: String(r["KOD_VZP"] ?? ""),               // kód přípravku
        name: String(r["NÁZEV"] ?? ""),                 // název
        supplement: String(r["DOPLNĚK"] ?? ""),         // doplněk
        oldReimb: r["STARÁ ÚHRADA"] === "" ? null : toNum(r["STARÁ ÚHRADA"]),
        newReimb: r["NOVÁ ÚHRADA"] === "" ? null : toNum(r["NOVÁ ÚHRADA"]),
        daysLeft: toNum(r["ZBÝVÁ DNÍ"]),
        validFrom: String(r["PLATNOST OD"] ?? ""),      // např. "01.09.2025"
        stock,                                          // sklad pro přihlášenou pobočku
        total: toNum(r["CELKEM"]),                      // celkem napříč pobočkami
        pharmacyCode,                                   // která pobočka byla použita
      };
    });

    // Můžeš případně filtrovat jen položky, kde je stock > 0:
    // const filtered = mapped.filter((x) => x.stock > 0);

    return res.json(mapped);
  } catch (e) {
    console.error("❌ /api/pharmacy/inventory error:", e);
    return res.status(500).json({ message: "Chyba při čtení skladových dat." });
  }
});

module.exports = router;
