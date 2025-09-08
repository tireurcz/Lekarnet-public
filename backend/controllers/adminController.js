// backend/controllers/adminController.js
const User = require("../models/User");

// GET /api/admin/users?q=&page=1&limit=20
exports.listUsers = async (req, res) => {
  try {
    const { q = "", page = 1, limit = 20 } = req.query;
    const find = q
      ? { $or: [{ username: new RegExp(q, "i") }, { email: new RegExp(q, "i") }] }
      : {};
    const total = await User.countDocuments(find);
    const users = await User.find(find)
      .select("username email role pharmacyCode fullName company phone createdAt")
      .sort({ createdAt: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit))
      .lean();

    return res.json({ ok: true, total, page: Number(page), limit: Number(limit), users });
  } catch (err) {
    console.error("❌ listUsers error:", err);
    return res.status(500).json({ ok: false, message: "Chyba serveru" });
  }
};

// GET /api/admin/users/:id
exports.getUser = async (req, res) => {
  try {
    const u = await User.findById(req.params.id)
      .select("username email role pharmacyCode fullName company phone address settings createdAt")
      .lean();
    if (!u) return res.status(404).json({ ok: false, message: "Uživatel nenalezen" });
    return res.json({ ok: true, user: u });
  } catch (err) {
    console.error("❌ getUser error:", err);
    return res.status(500).json({ ok: false, message: "Chyba serveru" });
  }
};

// PATCH /api/admin/users/:id   body: { role?, pharmacyCode? }
exports.updateAdminFields = async (req, res) => {
  try {
    const updates = {};
    if (typeof req.body.role === "string") {
      const r = req.body.role.trim();
      if (!["user", "admin"].includes(r)) {
        return res.status(400).json({ ok: false, message: "Neplatná role." });
      }
      updates.role = r;
    }
    if ("pharmacyCode" in req.body) {
      // přijmeme "" jako null
      const raw = req.body.pharmacyCode;
      updates.pharmacyCode = raw === "" || raw === null ? null : String(raw).trim();
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ ok: false, message: "Nebylo co změnit." });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true, runValidators: true }
    ).select("username email role pharmacyCode");

    if (!user) return res.status(404).json({ ok: false, message: "Uživatel nenalezen" });
    return res.json({ ok: true, user });
  } catch (err) {
    console.error("❌ updateAdminFields error:", err);
    return res.status(500).json({ ok: false, message: "Chyba serveru" });
  }
};

// (volitelné) DELETE /api/admin/users/:id
exports.deleteUser = async (req, res) => {
  try {
    const del = await User.findByIdAndDelete(req.params.id);
    if (!del) return res.status(404).json({ ok: false, message: "Uživatel nenalezen" });
    return res.json({ ok: true });
  } catch (err) {
    console.error("❌ deleteUser error:", err);
    return res.status(500).json({ ok: false, message: "Chyba serveru" });
  }
};
