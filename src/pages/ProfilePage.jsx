// src/pages/ProfilePage.jsx
import React, { useEffect, useState } from "react";
import API from "../utils/api";

export default function ProfilePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");
  const [data, setData] = useState({
    username: "",
    email: "",
    role: "",
    pharmacyCode: "",
    fullName: "",
    company: "",
    phone: "",
    avatarUrl: "",
    address: { street: "", city: "", zip: "", country: "" },
    settings: { locale: "cs", newsletter: false },
  });

  // Pomocná normalizace (když backend vrátí null/undefined)
  const normalizeUser = (u = {}) => ({
    username: u.username || "",
    email: u.email || "",
    role: u.role || "user",
    pharmacyCode: u.pharmacyCode ?? "",
    fullName: u.fullName || "",
    company: u.company || "",
    phone: u.phone || "",
    avatarUrl: u.avatarUrl || "",
    address: {
      street: u.address?.street || "",
      city: u.address?.city || "",
      zip: u.address?.zip || "",
      country: u.address?.country || "",
    },
    settings: {
      locale: u.settings?.locale || "cs",
      newsletter: !!u.settings?.newsletter,
    },
  });

  useEffect(() => {
    (async () => {
      try {
        // DŮLEŽITÉ: plný profil bereme z /users/me, ne z /protected/me
        const res = await API.get("/users/me");
        setData(normalizeUser(res?.data?.user));
      } catch (e) {
        setError(e?.response?.data?.message || "Nepodařilo se načíst profil.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const onChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith("address.")) {
      const key = name.split(".")[1];
      setData((prev) => ({ ...prev, address: { ...prev.address, [key]: value } }));
    } else {
      setData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const onToggle = (e) => {
    const { name, checked } = e.target;
    setData((prev) => ({ ...prev, settings: { ...prev.settings, [name]: checked } }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setError(""); setOk(""); setSaving(true);
    try {
      // posíláme jen self-update pole (backend má whitelist)
      const payload = {
        fullName: data.fullName,
        company: data.company,
        phone: data.phone,
        avatarUrl: data.avatarUrl,
        address: data.address,
        settings: data.settings,
      };
      const res = await API.patch("/users/me", payload);
      // aktualizuj stav podle toho, co vrátil server
      setData(normalizeUser(res?.data?.user));
      setOk("Změny uloženy.");
    } catch (e) {
      setError(e?.response?.data?.message || "Uložení se nezdařilo.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-6">Načítám profil…</div>;

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Profil</h1>

      {error && <div className="mb-4 p-3 bg-red-50 text-red-700 rounded">{error}</div>}
      {ok && <div className="mb-4 p-3 bg-green-50 text-green-700 rounded">{ok}</div>}

      <form onSubmit={onSubmit} className="space-y-6">
        {/* read-only sekce */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1">Uživatelské jméno</label>
            <input className="w-full border rounded px-3 py-2 bg-gray-100" value={data.username} readOnly />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">E-mail</label>
            <input className="w-full border rounded px-3 py-2 bg-gray-100" value={data.email} readOnly />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Role</label>
            <input className="w-full border rounded px-3 py-2 bg-gray-100" value={data.role} readOnly />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Kód pobočky</label>
            <input className="w-full border rounded px-3 py-2 bg-gray-100" value={data.pharmacyCode} readOnly />
          </div>
        </div>

        {/* editovatelná sekce */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1">Celé jméno</label>
            <input name="fullName" value={data.fullName} onChange={onChange} className="w-full border rounded px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Firma</label>
            <input name="company" value={data.company} onChange={onChange} className="w-full border rounded px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Telefon</label>
            <input name="phone" value={data.phone} onChange={onChange} className="w-full border rounded px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Avatar URL</label>
            <input name="avatarUrl" value={data.avatarUrl} onChange={onChange} className="w-full border rounded px-3 py-2" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1">Ulice</label>
            <input name="address.street" value={data.address.street} onChange={onChange} className="w-full border rounded px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Město</label>
            <input name="address.city" value={data.address.city} onChange={onChange} className="w-full border rounded px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">PSČ</label>
            <input name="address.zip" value={data.address.zip} onChange={onChange} className="w-full border rounded px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Stát</label>
            <input name="address.country" value={data.address.country} onChange={onChange} className="w-full border rounded px-3 py-2" />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <input id="newsletter" type="checkbox" name="newsletter" checked={!!data.settings.newsletter} onChange={onToggle} />
          <label htmlFor="newsletter">Odebírat novinky</label>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-60"
        >
          {saving ? "Ukládám…" : "Uložit změny"}
        </button>
      </form>
    </div>
  );
}
