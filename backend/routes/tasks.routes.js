// routes/tasks.routes.js (CommonJS)
const express = require("express");
const router = express.Router();

// GET /api/tasks  → prázdný seznam místo 404
router.get("/", (req, res) => {
  res.json([]); // až budeš mít DB, vrať reálná data
});

// POST /api/tasks  → mock vytvoření
router.post("/", (req, res) => {
  const { title, completed = false } = req.body || {};
  const now = new Date().toISOString();
  const mock = {
    _id: String(Date.now()),
    title: title || "(bez názvu)",
    completed,
    createdAt: now,
    updatedAt: now,
  };
  res.status(201).json(mock);
});

// PATCH /api/tasks/:id  → mock update
router.patch("/:id", (req, res) => {
  const { id } = req.params;
  const patch = req.body || {};
  res.json({ _id: id, ...patch, updatedAt: new Date().toISOString() });
});

// DELETE /api/tasks/:id  → 204
router.delete("/:id", (req, res) => {
  res.status(204).end();
});

module.exports = router;
