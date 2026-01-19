// routes/unplannedTaskRoutes.js
const express = require("express");
const router = express.Router();
const authenticateJWT = require("../../middlewares/auth");
const authorizeRoles = require("../../middlewares/role");
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
  userAddTask,
  getUserApprovedTasks,
  getPendingUserRequests,
  updateTaskApproval,
  getUserNotifications,
  deleteUserNotification,
  savePauseReason,
  getLastTaskEndTime
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

// 26-11-2025 - Changes by Priyanka
// Added routers for add task by user in the user dash board and aprove the task by admin
router.post("/user/add-task-by-user", authenticateJWT, userAddTask);
router.get("/admin/getPendingUserTaskRequests", authenticateJWT, getPendingUserRequests);
router.patch("/admin/:id/task-approved", authenticateJWT, (req, res) => updateTaskApproval(req, res, "approved"));
router.patch("/admin/:id/task-rejected", authenticateJWT, (req, res) => updateTaskApproval(req, res, "rejected"));
router.get("/user/:userId/approved", getUserApprovedTasks);
router.get("/user/userTaskUpdates", authenticateJWT, getUserNotifications);
router.delete("/user/:id/deleteUserTaskUpdates", authenticateJWT, deleteUserNotification);
router.get("/last-end-time/:userId", authenticateJWT, getLastTaskEndTime);

router.post("/:id/pause_reason", authenticateJWT, savePauseReason);

module.exports = router;
