import React, { useEffect, useState } from "react";
import API from "../utils/api";

export default function PharmacyReportPage() {
  const [blobUrl, setBlobUrl] = useState("");
  const [err, setErr] = useState("");

  useEffect(() => {
    let url = "";
    (async () => {
      try {
        setErr("");
        // stáhni PDF jako blob (token jde automaticky přes interceptor)
        const res = await API.get("/reports/zmeny_uhrad.pdf", { responseType: "blob" });
        url = URL.createObjectURL(res.data);
        setBlobUrl(url);
      } catch (e) {
        console.error(e);
        setErr("Nelze načíst PDF. Zkontrolujte přihlášení a oprávnění.");
      }
    })();
    return () => {
      if (url) URL.revokeObjectURL(url);
    };
  }, []);

  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-blue-100">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-blue-900">Report pro lékárny</h2>
        {blobUrl && (
          <a
            href={blobUrl}
            download="zmeny_uhrad.pdf"
            className="text-sm px-3 py-2 rounded-lg border border-blue-200 hover:bg-blue-50"
          >
            Stáhnout PDF
          </a>
        )}
      </div>

      {err ? (
        <div className="p-4 text-red-600">{err}</div>
      ) : !blobUrl ? (
        <div className="p-4">Načítání…</div>
      ) : (
        <div className="rounded-lg overflow-hidden border border-blue-100">
          <object data={blobUrl} type="application/pdf" className="w-full" style={{ height: "80vh" }}>
            <p className="p-4">
              Nelze zobrazit PDF.{" "}
              <a href={blobUrl} download="zmeny_uhrad.pdf" className="text-blue-700 underline">
                Stáhnout PDF
              </a>
            </p>
          </object>
        </div>
      )}
    </div>
  );
}
