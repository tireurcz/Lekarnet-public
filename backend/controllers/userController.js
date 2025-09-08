// backend/controllers/userController.js
const User = require("../models/User");

// pouze povolená pole k self-update
const SELF_UPDATABLE_FIELDS = [
  "fullName",
  "company",
  "phone",
  "address",
  "avatarUrl",
  "settings",
];

function pick(obj, keys) {
  const out = {};
  for (const k of keys) if (Object.prototype.hasOwnProperty.call(obj, k)) out[k] = obj[k];
  return out;
}

exports.getMyProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select("username email role pharmacyCode fullName company phone address avatarUrl settings")
      .lean();

    if (!user) return res.status(404).json({ ok: false, message: "Uživatel nenalezen" });
    return res.json({ ok: true, user });
  } catch (err) {
    console.error("❌ getMyProfile error:", err);
    return res.status(500).json({ ok: false, message: "Chyba serveru" });
  }
};

exports.updateMyProfile = async (req, res) => {
  try {
    const updates = pick(req.body, SELF_UPDATABLE_FIELDS);

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: updates },
      { new: true, runValidators: true }
    ).select("username email role pharmacyCode fullName company phone address avatarUrl settings");

    if (!user) return res.status(404).json({ ok: false, message: "Uživatel nenalezen" });
    return res.json({ ok: true, user });
  } catch (err) {
    console.error("❌ updateMyProfile error:", err);
    return res.status(500).json({ ok: false, message: "Chyba serveru" });
  }
};
