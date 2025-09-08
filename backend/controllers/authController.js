const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

function signToken(user) {
  // Token nese jen to, co potřebujeme pro guardy a UX
  const payload = {
    id: user._id.toString(),
    username: user.username,
    role: user.role || "user",
    pharmacyCode: user.pharmacyCode ?? null,
  };
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "7d" });
}

// POST /api/auth/register
exports.register = async (req, res) => {
  console.log("🔧 [REGISTER] Přijatý požadavek:", req.body);
  try {
    let { username, email, password, role = "user", pharmacyCode } = req.body;

    if (!username || !password) {
      return res.status(400).json({ ok: false, message: "Vyplňte username i password." });
    }

    if (email && typeof email === "string") {
      email = email.trim().toLowerCase();
    }

    // Kontrola duplicity na username NEBO email (pokud je zadán)
    const or = [{ username }];
    if (email) or.push({ email });
    const exists = await User.findOne({ $or: or });
    if (exists) {
      return res.status(400).json({ ok: false, message: "Uživatel už existuje." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      username,
      email: email || undefined, // pokud není, neukládej null
      password: hashedPassword,
      role,
      pharmacyCode: pharmacyCode ?? null,
    });

    const token = signToken(newUser);

    return res.status(201).json({
      ok: true,
      token,
      user: {
        id: newUser._id,
        username: newUser.username,
        email: newUser.email || null,
        role: newUser.role || "user",
        pharmacyCode: newUser.pharmacyCode ?? null,
      },
    });
  } catch (err) {
    console.error("❌ Chyba serveru při registraci:", err?.message || err);
    return res.status(500).json({ ok: false, message: "Chyba serveru při registraci." });
  }
};

// POST /api/auth/login
exports.login = async (req, res) => {
  console.log("🔐 [LOGIN] Přihlášení požadavek:", req.body);
  try {
    const { username, email, password } = req.body;

    if (!password || (!username && !email)) {
      return res.status(400).json({ ok: false, message: "Vyplňte přihlašovací údaje." });
    }

    const query = username ? { username } : { email: String(email).trim().toLowerCase() };
    const user = await User.findOne(query).select("+password");
    if (!user) {
      return res.status(400).json({ ok: false, message: "Neplatné přihlašovací údaje." });
    }

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) {
      return res.status(400).json({ ok: false, message: "Neplatné přihlašovací údaje." });
    }

    const token = signToken(user);

    return res.status(200).json({
      ok: true,
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email || null,
        role: user.role || "user",
        pharmacyCode: user.pharmacyCode ?? null,
      },
    });
  } catch (err) {
    console.error("❌ Chyba serveru při přihlášení:", err?.message || err);
    return res.status(500).json({ ok: false, message: "Chyba serveru při přihlášení." });
  }
};