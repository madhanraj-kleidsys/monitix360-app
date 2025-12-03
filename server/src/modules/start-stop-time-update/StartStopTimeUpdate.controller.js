// controllers/timeController.js
const {
  findTaskByCompany,
  createTimeUpdate,
  getTimeUpdates,
} = require("../start-stop-time-update/StartStopTimeUpdate.model");

// ------------------------------------------------------------
// Start OR Stop Task  (type = 1 start, 2 stop)
// ------------------------------------------------------------
exports.startOrStopTask = async (req, res) => {
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

    res.json({
      message: type === 1 ? "Task started" : "Task stopped",
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
