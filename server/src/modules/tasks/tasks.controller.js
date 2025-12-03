// controllers/unplannedTaskController.js
const {
   createTask,
  findUserById,
  getMyTasks,
  getAllTasks,
  getBasicUserTasks,
  findTask,
  findConflictingTasks,
  findUserTask,
  updateTask,
  deleteTask,
  countCompanyTasks,
  sequelize,
  findCompanyTask,
  getUnplannedTasks,
  createUnplanned,
  findUnplannedTask,
  updateUnplanned,
  deleteUnplanned,
} = require("../tasks/tasks.model");

const { sendTaskEmail } = require("../tasks/utils/emailTamplate");

// ---------------------------------------------
// CREATE TASK
// ---------------------------------------------
exports.createNewTask = async (req, res) => {
  try {
    const {
      title,
      description,
      priority,
      assigned_to,
      start,
      end_time,
      status = "pending",
      duration_minutes,
      Project_Title,
    } = req.body;

    if (!title || !description || !assigned_to || !start || !end_time ||
        !priority || !duration_minutes || !Project_Title) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const task = await createTask({
      title,
      description,
      priority,
      assigned_to,
      assigned_by: req.user.id,
      start,
      end_time,
      duration_minutes,
      status,
      project_title: Project_Title,
      company_id: req.user.company_id,
    });

    const assignedUser = await findUserById(assigned_to, req.user.company_id);

    if (assignedUser?.email) {
      const subject = `New Task Assigned: ${title}`;
      const html = `
          <h3>Hello ${assignedUser.username},</h3>
          <p>You have been assigned a new task:</p>
          <ul>
            <li><strong>Project:</strong> ${Project_Title}</li>
            <li><strong>Designation:</strong> ${title}</li>
            <li><strong>Description:</strong> ${description}</li>
            <li><strong>Priority:</strong> ${priority}</li>
            <li><strong>Schedule:</strong> ${start} to ${end_time}</li>
          </ul>
        `;
      await sendTaskEmail(assignedUser.email, subject, html);
    }

    res.status(201).json(task);
  } catch (err) {
    console.error("Error creating task:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

// ---------------------------------------------
// GET my tasks
// ---------------------------------------------
exports.getMyTasks = async (req, res) => {
  try {
    const tasks = await getMyTasks(req.user.id, req.user.company_id);

    const map = { 1: "High", 2: "Medium", 3: "Low" };

    const result = tasks.map((t) => ({
      ...t.dataValues,
      priority_text: map[t.priority] || "Unknown",
      assigned_by_name: t.AssignedBy?.username,
    }));

    res.json(result);
  } catch (err) {
    console.error("Get my tasks error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

// ---------------------------------------------
// GET all tasks
// ---------------------------------------------
exports.getAllTasks = async (req, res) => {
  try {
    const tasks = await getAllTasks(req.user.company_id);

    const map = { 1: "High", 2: "Medium", 3: "Low" };

    res.json(
      tasks.map((t) => ({
        ...t.dataValues,
        priority_text: map[t.priority],
        assigned_by_name: t.AssignedBy?.username,
        assigned_to_name: t.AssignedTo?.username,
      }))
    );
  } catch (err) {
    console.error("Get all tasks error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

// ---------------------------------------------
// BASIC USER TASKS
// ---------------------------------------------
exports.getBasicUserTasks = async (req, res) => {
  try {
    const tasks = await getBasicUserTasks(req.params.userId, req.user.company_id);
    res.json(tasks);
  } catch (err) {
    console.error("Error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

// ---------------------------------------------
// UPDATE TASK (USER / ADMIN)
// ---------------------------------------------
exports.updateTask = async (req, res) => {
  try {
    const task = await findTask(req.params.id, req.user.company_id);
    if (!task) return res.status(404).json({ error: "Task not found" });

    const updated = await updateTask(task, {
      ...req.body,
      project_title: req.body.Project_Title,
      updated_at: new Date(),
    });

    res.json(updated);
  } catch (err) {
    console.error("Update task error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

// ---------------------------------------------
// UPDATE STATUS
// ---------------------------------------------
exports.updateStatus = async (req, res) => {
  try {
    const task = await findTask(req.params.id, req.user.company_id);
    if (!task) return res.status(404).json({ error: "Task not found" });

    await updateTask(task, { status: req.body.status, updated_at: new Date() });

    res.json(task);
  } catch (err) {
    console.error("Update status error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

// ---------------------------------------------
// ASSIGN TASK + RESCHEDULE CONFLICTS
// ---------------------------------------------
exports.assignTask = async (req, res) => {
  try {
    const { assigned_to, start_time, end_time } = req.body;

    const user = await findUserById(assigned_to, req.user.company_id);
    if (!user) return res.status(404).json({ error: "User not found" });

    const conflicts = await findConflictingTasks(
      req.params.id,
      assigned_to,
      req.user.company_id,
      start_time,
      end_time
    );

    for (const conflict of conflicts) {
      const duration =
        new Date(conflict.end_time) - new Date(conflict.start);

      const newStart = new Date(new Date(end_time).getTime() + 5 * 60000);
      const newEnd = new Date(newStart.getTime() + duration);

      await conflict.update({ start: newStart, end_time: newEnd });
    }

    const task = await findTask(req.params.id, req.user.company_id);

    await updateTask(task, {
      assigned_to,
      title: user.department,
      start: start_time,
      end_time,
      updated_at: new Date(),
    });

    res.json({ updated: task, rescheduled_conflicts: conflicts.length });
  } catch (err) {
    console.error("Assign error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

// ---------------------------------------------
// DELETE TASK (ADMIN)
// ---------------------------------------------
exports.deleteTask = async (req, res) => {
  try {
    const task = await findTask(req.params.id, req.user.company_id);
    if (!task) return res.status(404).json({ error: "Not found" });

    const deletedData = { ...task.dataValues };

    await deleteTask(task);

    const remaining = await countCompanyTasks(req.user.company_id);
    if (remaining === 0) {
      await sequelize.query(`DBCC CHECKIDENT ('tasks', RESEED, 0)`);
    }

    res.json({ message: "Deleted", deletedTask: deletedData });
  } catch (err) {
    console.error("Delete error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

// ---------------------------------------------
// USER CAN UPDATE HIS OWN TASK STATUS + REASON
// ---------------------------------------------
exports.updateUserTask = async (req, res) => {
  try {
    const task = await findUserTask(
      req.params.id,
      req.user.id,
      req.user.company_id
    );

    if (!task)
      return res.status(403).json({ error: "Not your task" });

    await updateTask(task, {
      status: req.body.status,
      reason: req.body.reason,
      updated_at: new Date(),
    });

    res.json({ message: "Task updated", task });
  } catch (err) {
    console.error("User update error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

// ------------------------------------------------------------
// PATCH /timer/:id → Update timer fields
// ------------------------------------------------------------
exports.patchTimer = async (req, res) => {
  try {
    const { id } = req.params;
    const companyId = req.user.company_id;
    const userId = req.user.id;

    const task = await findUserTask(id, userId, companyId);
    if (!task)
      return res.status(404).json({ message: "Task not found or unauthorized" });

    const allowed = [
      "timer_start",
      "timer_end",
      "task_start",
      "elapsed_seconds",
      "start",
      "end_time",
    ];

    const updateData = {};
    for (const key of Object.keys(req.body)) {
      if (allowed.includes(key)) updateData[key] = req.body[key];
    }

    if (Object.keys(updateData).length === 0)
      return res.status(400).json({ message: "No valid fields to update" });

    updateData.updated_at = new Date();
    await updateTask(task, updateData);

    res.json({ message: "Timer updated successfully", task });
  } catch (err) {
    console.error("patchTimer error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ------------------------------------------------------------
// GET /timer/:id → Get timer information
// ------------------------------------------------------------
exports.getTimer = async (req, res) => {
  try {
    const { id } = req.params;
    const companyId = req.user.company_id;

    const task = await findCompanyTask(id, companyId);
    if (!task) return res.status(404).json({ message: "Task not found" });

    res.json({
      id: task.id,
      timer_start: task.timer_start,
      timer_end: task.timer_end,
      start: task.start,
      end_time: task.end_time,
      task_start: task.task_start,
    });
  } catch (err) {
    console.error("getTimer error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ------------------------------------------------------------
// PUT /timer/:id → Update timer_start / timer_end
// ------------------------------------------------------------
exports.putTimer = async (req, res) => {
  try {
    const { id } = req.params;
    const { timer_start, timer_end } = req.body;
    const companyId = req.user.company_id;

    const task = await findCompanyTask(id, companyId);
    if (!task) return res.status(404).json({ message: "Task not found" });

    const updateData = {};
    if (timer_start !== undefined) updateData.timer_start = timer_start;
    if (timer_end !== undefined) updateData.timer_end = timer_end;

    if (Object.keys(updateData).length === 0)
      return res.status(400).json({ message: "Nothing to update" });

    updateData.updated_at = new Date();
    await updateTask(task, updateData);

    res.json({ message: "Timer updated successfully", task });
  } catch (err) {
    console.error("putTimer error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ------------------------------------------------------------
// SHARED REASON HANDLER
// ------------------------------------------------------------
async function handleReason(req, res, fieldName) {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const userId = req.user.id;
    const companyId = req.user.company_id;

    if (!reason || reason.trim() === "")
      return res.status(400).json({ error: "Reason is required" });

    const task = await findUserTask(id, userId, companyId);
    if (!task) return res.status(403).json({ error: "Access denied" });

    await updateTask(task, {
      [fieldName]: reason,
      updated_at: new Date(),
    });

    res.json({ message: `${fieldName} saved` });
  } catch (err) {
    console.error("reason error:", err);
    res.status(500).json({ error: "Server error" });
  }
}

// ------------------------------------------------------------
// EXPORT INDIVIDUAL REASON HANDLERS
// ------------------------------------------------------------
exports.startEarlyReason = (req, res) =>
  handleReason(req, res, "start_early_reason");

exports.startLateReason = (req, res) =>
  handleReason(req, res, "start_late_reason");

exports.pauseReason = (req, res) =>
  handleReason(req, res, "pause_reason");

exports.stopReason = (req, res) =>
  handleReason(req, res, "stop_reason");

// ------------------------------------------------------------
// GET all unplanned tasks
// ------------------------------------------------------------
exports.getUnplanned = async (req, res) => {
  try {
    const companyId = req.user.company_id;

    const tasks = await getUnplannedTasks(companyId);

    res.json(tasks);
  } catch (error) {
    console.error("GET /unplanned error:", error);
    res.status(500).json({ error: "Failed to fetch unplanned tasks" });
  }
};

// ------------------------------------------------------------
// CREATE unplanned task
// ------------------------------------------------------------
exports.createUnplannedTask = async (req, res) => {
  try {
    const { project_title, description, duration_minutes } = req.body;
    const companyId = req.user.company_id;

    if (!project_title || !description || !duration_minutes) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const task = await createUnplanned({
      project_title,
      description,
      duration_minutes,
      status: "unplanned",
      company_id: companyId,
    });

    res.status(201).json(task);
  } catch (error) {
    console.error("Error inserting unplanned task:", error);
    res.status(500).json({
      message: "Failed to insert task",
      error: error.message,
    });
  }
};

// ------------------------------------------------------------
// UPDATE unplanned task
// ------------------------------------------------------------
exports.updateUnplannedTask = async (req, res) => {
  try {
    const { id } = req.params;
    const companyId = req.user.company_id;
    const { project_title, description, duration_minutes } = req.body;

    if (!project_title || !description || !duration_minutes) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const task = await findUnplannedTask(id, companyId);

    if (!task) {
      return res.status(404).json({ message: "Unplanned task not found" });
    }

    await updateUnplanned(task, {
      project_title,
      description,
      duration_minutes,
      updated_at: new Date(),
    });

    res.json(task);
  } catch (error) {
    console.error("Error updating unplanned task:", error);
    res.status(500).json({
      message: "Failed to update task",
      error: error.message,
    });
  }
};

// ------------------------------------------------------------
// DELETE unplanned task
// ------------------------------------------------------------
exports.deleteUnplannedTask = async (req, res) => {
  try {
    const { id } = req.params;
    const companyId = req.user.company_id;

    const task = await findUnplannedTask(id, companyId);

    if (!task) {
      return res.status(404).json({
        message: "Unplanned task not found",
      });
    }

    await deleteUnplanned(task);

    res.json({ message: "Task deleted successfully", task });
  } catch (error) {
    console.error("Error deleting unplanned task:", error);
    res.status(500).json({
      message: "Failed to delete task",
      error: error.message,
    });
  }
};
