// backend/socket.js
const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const Message = require("./models/Message");

function initSocket(server) {
  const io = new Server(server, {
    cors: { origin: true, credentials: true },
    path: "/socket.io",
  });

  io.use((socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.query?.token ||
        socket.handshake.headers?.authorization?.replace("Bearer ", "");

      if (!token) return next(new Error("No token"));

      const payload = jwt.verify(token, process.env.JWT_SECRET);
      const u = payload?.user || payload || {};

      const user = {
        id: String(u.id || u._id || ""),
        name: u.name || u.username || "Uživatel",
        role: u.role || "user",
        company: u.company != null ? String(u.company) : "",
        pharmacyCode:
          u.pharmacyCode != null ? String(u.pharmacyCode) : null,
      };

      if (!user.company) return next(new Error("No company in token"));

      socket.user = user;
      next();
    } catch (e) {
      next(new Error("Invalid token"));
    }
  });

  io.on("connection", (socket) => {
    const { company, pharmacyCode } = socket.user;

    const companyRoom = `company:${company}`;
    socket.join(companyRoom);

    let pharmacyRoom = null;
    if (pharmacyCode) {
      pharmacyRoom = `pharmacy:${company}:${pharmacyCode}`;
      socket.join(pharmacyRoom);
    }

    socket.on("chat:message", async (payload, ack) => {
      try {
        const { scope, text } = payload || {};
        if (!text || !scope) return ack?.({ ok: false, error: "Bad payload" });

        const isCompany = scope === "company";
        const room = isCompany ? companyRoom : pharmacyRoom;
        if (!room) return ack?.({ ok: false, error: "No room" });

        const doc = await Message.create({
          company,
          pharmacyCode: isCompany ? null : pharmacyCode,
          scope,
          authorId: socket.user.id,
          authorName: socket.user.name,
          text,
        });

        const message = {
          _id: String(doc._id),
          company,
          pharmacyCode: doc.pharmacyCode,
          scope,
          authorId: doc.authorId,
          authorName: doc.authorName,
          text,
          createdAt: doc.createdAt,
        };

        io.to(room).emit("chat:message", message);
        ack?.({ ok: true, message });
      } catch (e) {
        ack?.({ ok: false, error: e.message });
      }
    });
  });

  return io;
}

module.exports = { initSocket };
