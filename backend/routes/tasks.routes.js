// backend/routes/tasks.routes.js
const express = require("express");
const router = express.Router();

// ✅ Použij tvůj existující middleware
const { requireAuth, requireAdmin } = require("../middleware/authMiddleware");

// ✅ Tvůj Mongoose model
const Task = require("../models/task.model");

// ADMIN: vytvořit úkol
router.post("/", requireAuth, requireAdmin, async (req, res) => {
  try {
    const { title, description, dueDate, pharmacyCodes = [], userIds = [] } = req.body;

    const task = await Task.create({
      title,
      description: description || "",
      dueDate: dueDate ? new Date(dueDate) : null,
      pharmacyCodes,
      userIds,
      createdBy: req.user._id || req.user.id,
    });

    // Předinicializuj stav pro každou cílovou pobočku
    const setOps = {};
    pharmacyCodes.forEach((code) => {
      setOps[`completions.${code}`] = { done: false, doneAt: null, doneBy: null, note: "" };
    });
    if (Object.keys(setOps).length) {
      await Task.updateOne({ _id: task._id }, { $set: setOps });
    }

    const fresh = await Task.findById(task._id);
    res.status(201).json(fresh);
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: "Failed to create task" });
  }
});

// ADMIN: list (filtry: pharmacyCode, status, q)
router.get("/", requireAuth, requireAdmin, async (req, res) => {
  try {
    const { pharmacyCode, status, q } = req.query;
    const filter = { deletedAt: null };
    if (status) filter.status = status;
    if (pharmacyCode) filter.pharmacyCodes = pharmacyCode;
    if (q) filter.title = { $regex: q, $options: "i" };

    const tasks = await Task.find(filter).sort({ dueDate: 1, createdAt: -1 });
    res.json(tasks);
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: "Failed to list tasks" });
  }
});

// ADMIN: update
router.put("/:id", requireAuth, requireAdmin, async (req, res) => {
  try {
    const { title, description, dueDate, status, pharmacyCodes, userIds } = req.body;
    const update = {};
    if (title !== undefined) update.title = title;
    if (description !== undefined) update.description = description;
    if (dueDate !== undefined) update.dueDate = dueDate ? new Date(dueDate) : null;
    if (status !== undefined) update.status = status;
    if (pharmacyCodes !== undefined) update.pharmacyCodes = pharmacyCodes;
    if (userIds !== undefined) update.userIds = userIds;

    const task = await Task.findOneAndUpdate(
      { _id: req.params.id, deletedAt: null },
      { $set: update },
      { new: true }
    );
    if (!task) return res.status(404).json({ error: "Task not found" });

    // Doinicializuj completions pro nově přidané kódy
    if (Array.isArray(pharmacyCodes)) {
      const setOps = {};
      pharmacyCodes.forEach((code) => {
        if (!task.completions.get(code)) {
          setOps[`completions.${code}`] = { done: false, doneAt: null, doneBy: null, note: "" };
        }
      });
      if (Object.keys(setOps).length) {
        await Task.updateOne({ _id: task._id }, { $set: setOps });
      }
    }

    const fresh = await Task.findById(task._id);
    res.json(fresh);
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: "Failed to update task" });
  }
});

// ADMIN: soft delete (archivace)
router.delete("/:id", requireAuth, requireAdmin, async (req, res) => {
  try {
    const task = await Task.findOneAndUpdate(
      { _id: req.params.id, deletedAt: null },
      { $set: { deletedAt: new Date(), status: "archived" } },
      { new: true }
    );
    if (!task) return res.status(404).json({ error: "Task not found" });
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: "Failed to delete task" });
  }
});

// USER/PHARMACY: moje úkoly
router.get("/my", requireAuth, async (req, res) => {
  try {
    const myPharmacy = req.user?.pharmacyCode || null;
    const myId = req.user?._id || req.user?.id;

    const tasks = await Task.find({
      deletedAt: null,
      status: { $ne: "archived" },
      $or: [
        ...(myPharmacy ? [{ pharmacyCodes: myPharmacy }] : []),
        ...(myId ? [{ userIds: myId }] : []),
      ],
    }).sort({ dueDate: 1, createdAt: -1 });

    res.json(tasks);
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: "Failed to list my tasks" });
  }
});

// USER/PHARMACY: označit splnění
router.put("/:id/complete", requireAuth, async (req, res) => {
  try {
    const { done = true, note = "" } = req.body;
    const key = req.user?.pharmacyCode || String(req.user?._id || req.user?.id);

    const setOps = {};
    setOps[`completions.${key}`] = {
      done: !!done,
      doneAt: done ? new Date() : null,
      doneBy: req.user?._id || req.user?.id || null,
      note,
    };

    const task = await Task.findOneAndUpdate(
      { _id: req.params.id, deletedAt: null },
      { $set: setOps },
      { new: true }
    );
    if (!task) return res.status(404).json({ error: "Task not found" });

    // pokud je úkol cílen jen na 1 pobočku a je hotovo, přepni i globální stav
    if (Array.isArray(task.pharmacyCodes) && task.pharmacyCodes.length <= 1 && done) {
      task.status = "done";
      await task.save();
    }

    res.json(task);
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: "Failed to complete task" });
  }
});

module.exports = router;
