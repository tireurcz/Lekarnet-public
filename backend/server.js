// backend/server.js (nebo app.js)
require("dotenv").config();

const http = require("http"); // ⬅️ NOVÉ: pro Socket.IO
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

// ROUTES
const authRoutes = require("./routes/auth");
const adminRoutes = require("./routes/admin");
const protectedRoutes = require("./routes/protectedRoutes");
const reportsRoutes = require("./routes/reports");
const pharmacyRoutes = require("./routes/pharmacy");
const userRoutes = require("./routes/userRoutes");

// ⬇️ NOVÉ: router pro úkoly + chat
const tasksRoutes = require("./routes/tasks.routes");
const chatRoutes = require("./routes/chat");

// ⬇️ NOVÉ: Socket.IO inicializátor
const { initSocket } = require("./socket");

const app = express();
const PORT = process.env.PORT || 5000;

// --- CORS ---
// Povolení FE dev serverů; klidně přidej další origin
const ALLOWED_ORIGINS = [
  process.env.CLIENT_ORIGIN || "http://localhost:5173",
  "http://localhost:3000",
];

app.use(
  cors({
    origin: (origin, callback) => {
      // povol i nástroje bez Origin (Thunder/Postman)
      if (!origin) return callback(null, true);
      if (ALLOWED_ORIGINS.includes(origin)) return callback(null, true);
      return callback(null, true); // nebo: callback(new Error("Not allowed by CORS"));
    },
    credentials: false, // nepoužíváme cookies (používej Authorization bearer/JWT)
  })
);

// Parsování JSON body
app.use(express.json({ limit: "1mb" }));

// --- Healthcheck ---
app.get("/api/health", (req, res) => {
  res.json({ ok: true, env: process.env.NODE_ENV || "development" });
});

// --- ROUTE MOUNTS ---
// Login/registrace
app.use("/api/auth", authRoutes);

// Admin funkce
app.use("/api/admin", adminRoutes);

// Chráněné routy: ověření tokenu/role ( /api/protected/me, /api/protected/user, /api/protected/admin )
app.use("/api/protected", protectedRoutes);

// Reporty + lékárenské routy
app.use("/api/reports", reportsRoutes);
app.use("/api/pharmacy", pharmacyRoutes);
app.use("/api/users", userRoutes);

// ⬇️ NOVÉ: Úkoly (to-do pro pobočky)
app.use("/api/tasks", tasksRoutes);

// ⬇️ NOVÉ: Chat (historie zpráv)
app.use("/api/chat", chatRoutes);

// --- Start serveru po připojení k DB ---
if (!process.env.MONGO_URI) {
  console.error("❌ MONGO_URI není definované v .env");
  process.exit(1);
}

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log(`✅ MongoDB connected: ${mongoose.connection.host}`);

    // ⬇️ NOVÉ: vytvoř HTTP server a předej ho Socket.IO
    const server = http.createServer(app);
    initSocket(server); // inicializuj socket.io (ověření JWT, roomy, eventy)

    server.listen(PORT, () => {
      console.log(`✅ API + Socket.IO běží na http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err?.message || err);
    process.exit(1);
  });

// Volitelné: logni neodchycené promise chyby
process.on("unhandledRejection", (reason) => {
  console.error("Unhandled Rejection:", reason);
});
