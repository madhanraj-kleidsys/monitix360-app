// routes/shiftRoutes.js
const express = require("express");
const router = express.Router();
const authenticateJWT = require("../../middlewares/auth");
const authorizeRoles  = require("../../middlewares/role");

const {
  getShifts,
  addShift,
  updateShift,
  deleteShift,
} = require("../shifts/shift.controller");

// GET shifts
router.get("/", authenticateJWT, getShifts);

// CREATE shift + breaks
router.post("/", authenticateJWT, authorizeRoles("admin"), addShift);

// UPDATE shift + breaks
router.put("/:id", authenticateJWT, authorizeRoles("admin"), updateShift);

// DELETE shift + breaks
router.delete("/:id", authenticateJWT, authorizeRoles("admin"), deleteShift);

module.exports = router;
