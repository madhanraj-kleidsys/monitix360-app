// routes/holidayRoutes.js
const express = require("express");
const router = express.Router();
const authenticateJWT = require("../../middlewares/auth");
const authorizeRoles  = require("../../middlewares/role");

const {
  getHolidays,
  getHoliday,
  addHoliday,
  updateHoliday,
  deleteHoliday,
} = require("../holiday-master/holidayMaster.controller");

// GET all holidays
router.get("/", authenticateJWT, getHolidays);

// GET holiday by ID
router.get("/:id", authenticateJWT, getHoliday);

// ADD holiday (Admin only)
router.post("/", authenticateJWT, authorizeRoles("admin"), addHoliday);

// UPDATE holiday (Admin only)
router.put("/:id", authenticateJWT, authorizeRoles("admin"), updateHoliday);

// DELETE holiday (Admin only)
router.delete("/:id", authenticateJWT, authorizeRoles("admin"), deleteHoliday);

module.exports = router;
