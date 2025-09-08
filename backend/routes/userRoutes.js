// backend/routes/userRoutes.js
const express = require("express");
const router = express.Router();
const { requireAuth } = require("../middleware/authMiddleware");
const { getMyProfile, updateMyProfile } = require("../controllers/userController");

// GET /api/users/me – načtení profilu
router.get("/me", requireAuth, getMyProfile);

// PATCH /api/users/me – update profilu (jen whitelisted fields)
router.patch("/me", requireAuth, updateMyProfile);

module.exports = router;
