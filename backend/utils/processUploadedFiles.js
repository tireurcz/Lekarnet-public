// 📁 backend/utils/processUploadedFiles.js
const path = require("path");
const xlsx = require("xlsx");
const fs = require("fs");

function readExcelWithSkip(filePath, skipRows) {
  const workbook = xlsx.readFile(filePath);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const data = xlsx.utils.sheet_to_json(sheet, { range: skipRows });
  return data;
}

/**
 * 📦 Zpracuje sklad + pohyby pro danou firmu a pobočku
 * @param {string} firma - např. 'LEMON'
 * @param {string|number} pharmacyCode - např. 64
 * @returns {{ sklad: object[], pohyby: object[] }}
 */
function processUploadedFiles(firma, pharmacyCode) {
  const basePath = path.join(__dirname, `../uploads/${firma}/${pharmacyCode}`);
  const skladPath = path.join(basePath, "sklad.xlsx");
  const pohybyPath = path.join(basePath, "pohyby.xlsx");

  if (!fs.existsSync(skladPath) || !fs.existsSync(pohybyPath)) {
    throw new Error("Skladový nebo pohybový soubor nebyl nalezen.");
  }

  const skladData = readExcelWithSkip(skladPath, 11); // přeskočí 11 řádků
  const pohybyData = readExcelWithSkip(pohybyPath, 9); // přeskočí 9 řádků

  return {
    sklad: skladData,
    pohyby: pohybyData,
  };
}

module.exports = processUploadedFiles;
