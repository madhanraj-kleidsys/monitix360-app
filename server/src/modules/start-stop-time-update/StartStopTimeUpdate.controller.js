// controllers/timeController.js
const {
  findTaskByCompany,
  createTimeUpdate,
  getTimeUpdates,
  getBulkTimeUpdates,
} = require("../start-stop-time-update/StartStopTimeUpdate.model");

exports.getBulkTimeUpdates = async (req, res) => {
  try {
    const { taskIds } = req.body;
    if (!taskIds || !Array.isArray(taskIds)) return res.status(400).json({ error: "Invalid taskIds" });
    const updates = await getBulkTimeUpdates(taskIds);
    // Group by task_id
    const grouped = {};
    updates.forEach(u => {
      if (!grouped[u.task_id]) grouped[u.task_id] = [];
      grouped[u.task_id].push(u);
    });
    res.json(grouped);
  } catch (err) {
    console.error("Bulk time updates error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// ------------------------------------------------------------
// Start OR Stop Task  (type = 1 start, 2 stop)
// ------------------------------------------------------------
exports.startOrStopTask = async (req, res) => {
  try {
    const { task_id, type, time_logged } = req.body;
    const user_id = req.user.id;
    const company_id = req.user.company_id;

    if (!task_id || ![1, 2].includes(type)) {
      return res.status(400).json({ error: "Invalid task_id or type" });
    }

    const task = await findTaskByCompany(task_id, company_id);

    if (!task) {
      return res.status(404).json({ error: "Task not found or unauthorized" });
    }

    // Update time entries
    await createTimeUpdate({
      task_id,
      user_id,
      type,
      time_logged: time_logged || new Date(),
    });

    // If starting, ensure status is 'In Progress'
    if (type === 1) {
      await task.update({ status: 'In Progress', updated_at: new Date() });
    }

    res.json({
      message: type === 1 ? "Task started" : "Task stopped",
      status: type === 1 ? "In Progress" : task.status
    });
  } catch (err) {
    console.error("Error inserting time update:", err);
    res.status(500).json({ error: "Server error", details: err.message });
  }
};

// ------------------------------------------------------------
// Stop Task (Duplicate logic but kept for compatibility)
// ------------------------------------------------------------
exports.stopTask = async (req, res) => {
  try {
    const { task_id, type } = req.body;
    const user_id = req.user.id;
    const company_id = req.user.company_id;

    if (!task_id || ![1, 2].includes(type)) {
      return res.status(400).json({ error: "Invalid task_id or type" });
    }

    const task = await findTaskByCompany(task_id, company_id);

    if (!task) {
      return res.status(404).json({ error: "Task not found or unauthorized" });
    }

    await createTimeUpdate({
      task_id,
      user_id,
      type,
    });

    res.json({ message: "Task stop logged" });
  } catch (err) {
    console.error("Error inserting time update:", err);
    res.status(500).json({ error: "Server error", details: err.message });
  }
};

// ------------------------------------------------------------
// Get Time Updates for Task
// ------------------------------------------------------------
exports.getTaskTimeUpdates = async (req, res) => {
  try {
    const { task_id } = req.params;
    const company_id = req.user.company_id;

    const task = await findTaskByCompany(task_id, company_id);

    if (!task) {
      return res.status(404).json({ error: "Task not found or unauthorized" });
    }

    const updates = await getTimeUpdates(task_id);

    res.json(updates);
  } catch (err) {
    console.error("Error fetching time updates:", err);
    res.status(500).json({ error: "Server error" });
  }
};