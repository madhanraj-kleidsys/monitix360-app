// routes/shiftBreakRoutes.js
const express = require("express");
const router = express.Router();
const authenticateJWT = require("../../middlewares/auth");
const authorizeRoles  = require("../../middlewares/role");

const {
  addBreak,
  getShifts,
  updateBreak,
  deleteBreak,
} = require("../shift-break/shiftBreak.controller");

// Add break to shift
router.post("/:shiftId", authenticateJWT, authorizeRoles("admin"), addBreak);

// Get all shifts with breaks
router.get("/", authenticateJWT, getShifts);

// Update break
router.put("/:breakId", authenticateJWT, authorizeRoles("admin"), updateBreak);

// Delete break
router.delete("/:breakId", authenticateJWT, authorizeRoles("admin"), deleteBreak);

module.exports = router;
