// routes/taskReasonRoutes.js
const express = require("express");
const router = express.Router();
const authenticateJWT = require("../../middlewares/auth");

const {
  addReason,
  getTaskReasons,
} = require("../task-reason/taskReason.controller");

// Add reason to a task
router.post("/:taskId/:reasonKey", authenticateJWT, addReason);

// Get all reasons for a task
router.get("/:taskId", authenticateJWT, getTaskReasons);

module.exports = router;
