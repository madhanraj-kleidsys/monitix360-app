// controllers/taskReasonController.js
const {
  reasonTypeMap,
  findTaskByCompany,
  createTaskReason,
  getReasonsByTask,
  getBulkReasonsByTaskIds,
} = require("../task-reason/taskReason.model");

exports.getBulkTaskReasons = async (req, res) => {
  try {
    const { taskIds } = req.body;
    const companyId = req.user.company_id;
    if (!taskIds || !Array.isArray(taskIds)) return res.status(400).json({ error: "Invalid taskIds" });

    const reasons = await getBulkReasonsByTaskIds(taskIds, companyId);
    // Group by task_id
    const grouped = {};
    reasons.forEach(r => {
      if (!grouped[r.task_id]) grouped[r.task_id] = [];
      grouped[r.task_id].push(r);
    });
    res.json(grouped);
  } catch (err) {
    console.error("Bulk task reasons error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// ------------------------------------------------------------
// ADD a task reason
// ------------------------------------------------------------
exports.addReason = async (req, res) => {
  try {
    const { taskId, reasonKey } = req.params;
    const { reason } = req.body;

    if (!reason || !reason.trim()) {
      return res.status(400).json({ error: "Reason is required" });
    }

    const reason_type = reasonTypeMap[reasonKey];
    if (!reason_type) {
      return res.status(400).json({ error: "Invalid reason type" });
    }

    const user_id = req.user.id;
    const companyId = req.user.company_id;

    // Check task
    const task = await findTaskByCompany(taskId, companyId);
    if (!task) {
      return res
        .status(403)
        .json({ error: "Unauthorized: Task does not belong to your company" });
    }

    // Insert reason
    const createdReason = await createTaskReason({
      task_id: taskId,
      user_id,
      reason_type,
      reason: reason.trim(),
      company_id: companyId,
    });

    res.status(201).json(createdReason);
  } catch (err) {
    console.error("❌ Error inserting task reason:", err);
    res.status(500).json({ error: err.message });
  }
};

// ------------------------------------------------------------
// GET task reasons
// ------------------------------------------------------------
exports.getTaskReasons = async (req, res) => {
  try {
    const { taskId } = req.params;
    const companyId = req.user.company_id;

    // Check task
    const task = await findTaskByCompany(taskId, companyId);
    if (!task) {
      return res
        .status(403)
        .json({ error: "Unauthorized: Task not found in your company" });
    }

    const reasons = await getReasonsByTask(taskId, companyId);

    res.json(reasons);
  } catch (err) {
    console.error("❌ Error fetching task reasons:", err);
    res.status(500).json({ error: err.message });
  }
};