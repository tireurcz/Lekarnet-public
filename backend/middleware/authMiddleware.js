const jwt = require("jsonwebtoken");
const User = require("../models/User"); // ⬅️ uprav cestu na svůj model uživatele

async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : (req.query.token || null);

    if (!token) {
      return res.status(401).json({ ok: false, error: "No token" });
    }

    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const u = payload?.user || payload || {};

    // 1) Základ z tokenu (co kdyby tam bylo všechno)
    let userObj = {
      id: String(u.id || u._id || ""),
      name: u.name || u.username || "Uživatel",
      role: u.role || "user",
      company:
        u.company ?? u.companyName ?? u.companyCode ?? u.firma ?? "",
      pharmacyCode:
        u.pharmacyCode != null ? String(u.pharmacyCode) : null,
    };

    // 2) Když v tokenu chybí company/pharmacyCode, doplň z DB
    if (!userObj.company || userObj.pharmacyCode == null) {
      if (!userObj.id) {
        return res.status(401).json({ ok: false, error: "Invalid token (no user id)" });
      }
      const dbUser = await User.findById(userObj.id)
        .select("name role company pharmacyCode")
        .lean();

      if (!dbUser) {
        return res.status(401).json({ ok: false, error: "User not found" });
      }

      userObj = {
        id: userObj.id,
        name: dbUser.name || userObj.name,
        role: dbUser.role || userObj.role,
        company: String(dbUser.company ?? userObj.company ?? ""),
        pharmacyCode:
          dbUser.pharmacyCode != null
            ? String(dbUser.pharmacyCode)
            : (userObj.pharmacyCode != null ? String(userObj.pharmacyCode) : null),
      };
    }

    // 3) Ulož do req a pokračuj
    req.user = userObj;
    return next();
  } catch (e) {
    return res.status(401).json({ ok: false, error: "Invalid token" });
  }
}

module.exports = { requireAuth };
