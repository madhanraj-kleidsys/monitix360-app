// routes/timeRoutes.js
const express = require("express");
const router = express.Router();
const authenticateJWT  = require("../../middlewares/auth");

const {
  startOrStopTask,
  stopTask,
  getTaskTimeUpdates,
} = require("../start-stop-time-update/StartStopTimeUpdate.controller");

// Start or Stop Task
router.post("/start-task", authenticateJWT, startOrStopTask);

// Stop Task (duplicate but kept if frontend uses it)
router.post("/stop-task", authenticateJWT, stopTask);

// Get Time Updates for a task
router.get("/time_get/:task_id", authenticateJWT, getTaskTimeUpdates);

module.exports = router;
