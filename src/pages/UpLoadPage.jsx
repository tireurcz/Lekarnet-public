// 📁 src/pages/UpLoadPage.jsx
import { useState, useEffect } from "react";
import getUserFromToken from "../utils/getUserFromToken";
import { FileUp } from "lucide-react";

export default function UpLoadPage() {
  const me = getUserFromToken();
  const pharmacyCode = me?.pharmacyCode;
  const firma = me?.firma || "LEMON";

  const [skladFile, setSkladFile] = useState(null);
  const [pohybyFile, setPohybyFile] = useState(null);
  const [uploadResult, setUploadResult] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [lastExport, setLastExport] = useState(null);

  // 🟡 Fetch latest timestamp after page load
  useEffect(() => {
    async function fetchMeta() {
      try {
        const res = await fetch(`http://localhost:5000/api/upload/${firma}/${pharmacyCode}/meta`);
        if (res.ok) {
          const meta = await res.json();
          setLastExport(meta?.latestTimestamp || null);
        }
      } catch (err) {
        console.warn("Nepodařilo se načíst metadata:", err.message);
      }
    }
    if (firma && pharmacyCode) fetchMeta();
  }, [firma, pharmacyCode]);

  // 🟢 Upload handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!skladFile || !pohybyFile) return alert("Vyber oba soubory.");

    const formData = new FormData();
    formData.append("sklad", skladFile);
    formData.append("pohyby", pohybyFile);

    setIsUploading(true);
    setUploadResult(null);

    try {
      const res = await fetch(`http://localhost:5000/api/upload/${firma}/${pharmacyCode}`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Chyba při nahrávání");

      setUploadResult(data);
      setLastExport(data?.latestTimestamp || null);
    } catch (err) {
      alert("Chyba: " + err.message);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-xl font-semibold flex items-center gap-2">
        <FileUp className="w-6 h-6" /> Nahrát exporty
      </h1>

      {lastExport && (
        <div className="text-sm text-gray-600">
          Poslední export: {new Date(lastExport).toLocaleString("cs-CZ")}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Sklad</label>
          <input
            type="file"
            accept=".xlsx"
            onChange={(e) => setSkladFile(e.target.files[0])}
            required
            className="block border rounded px-3 py-1"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Pohyby</label>
          <input
            type="file"
            accept=".xlsx"
            onChange={(e) => setPohybyFile(e.target.files[0])}
            required
            className="block border rounded px-3 py-1"
          />
        </div>
        <button
          type="submit"
          disabled={isUploading}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
        >
          {isUploading ? "Nahrávám…" : "Nahrát"}
        </button>

        {isUploading && (
          <div className="flex items-center gap-2 text-sm text-gray-600 mt-2">
            <svg className="animate-spin h-5 w-5 text-blue-500" viewBox="0 0 24 24">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v8H4z"
              />
            </svg>
            Nahrávám soubory…
          </div>
        )}
      </form>

      {uploadResult && (
        <div className="text-sm text-green-700 bg-green-100 border border-green-300 rounded p-3">
          ✅ Soubory byly úspěšně nahrány.
        </div>
      )}
    </div>
  );
}
