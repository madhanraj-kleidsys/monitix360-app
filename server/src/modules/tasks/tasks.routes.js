// routes/unplannedTaskRoutes.js
const express = require("express");
const router = express.Router();
const authenticateJWT = require("../../middlewares/auth");
const authorizeRoles  = require("../../middlewares/role");  
const {
   createNewTask,
  getMyTasks,
  getAllTasks,
  getBasicUserTasks,
  updateTask,
  updateStatus,
  assignTask,
  deleteTask,
  updateUserTask,
   patchTimer,
  getTimer,
  putTimer,
  startEarlyReason,
  startLateReason,
  pauseReason,
  stopReason,
  getUnplanned,
  createUnplannedTask,
  updateUnplannedTask,
  deleteUnplannedTask,
} = require("../tasks/tasks.controller");


// CREATE NEW TASK (Admin)
router.post("/", authenticateJWT, authorizeRoles("admin"), createNewTask);

// My tasks
router.get("/my", authenticateJWT, getMyTasks);

// All tasks
router.get("/all", authenticateJWT, getAllTasks);

// Basic user tasks
router.get("/user/:userId/basic", authenticateJWT, getBasicUserTasks);

// Update task
router.put("/:id", authenticateJWT, updateTask);

// Update status
router.patch("/:id/status", authenticateJWT, updateStatus);

// Assign task
router.patch("/:id/assign", authenticateJWT, assignTask);

// Delete task
router.delete("/:id", authenticateJWT, authorizeRoles("admin"), deleteTask);

// Update my own task
router.patch("/:id", authenticateJWT, updateUserTask);

// Timer endpoints
router.patch("/:id/timer", authenticateJWT, patchTimer);
router.get("/timer/:id", authenticateJWT, getTimer);
router.put("/timer/:id", authenticateJWT, putTimer);

// Reason endpoints
router.post("/timer/:id/start_early_reason", authenticateJWT, startEarlyReason);
router.post("/timer/:id/start_late_reason", authenticateJWT, startLateReason);
router.post("/timer/:id/pause_reason", authenticateJWT, pauseReason);
router.post("/timer/:id/stop_reason", authenticateJWT, stopReason);


router.get("/unplanned", authenticateJWT, getUnplanned);

// CREATE unplanned task
router.post("/unplanned", authenticateJWT, createUnplannedTask);

// UPDATE unplanned task
router.put("/unplanned/:id", authenticateJWT, updateUnplannedTask);

// DELETE unplanned task
router.delete("/unplanned/:id", authenticateJWT, deleteUnplannedTask);

module.exports = router;
