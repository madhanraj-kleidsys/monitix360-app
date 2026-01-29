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
  insertUserTask,
  getPendingTasks,
  updateApprovalStatus,
  getApprovedTasks,
  getUserNotificationsQuery,
  deleteUserNotificationQuery,
  updateTaskReason,
  getLastEndTimeByUser
} = require("../tasks/tasks.model");

const { sendTaskEmail } = require("../tasks/utils/emailTamplate");
const { getIO } = require("../../socket/socket");
const { Company } = require("../../config/db");

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
      status = "Pending",
      duration_minutes,
      Project_Title,
    } = req.body;

    if (!title || !description || !assigned_to || !start || !end_time ||
      !priority || !duration_minutes || !Project_Title) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    console.log('📝 Creating task:', { title, Project_Title, priority });
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
    console.log('✅ Task created:', task.id, task.title);
    const assignedUser = await findUserById(assigned_to, req.user.company_id);

    if (assignedUser?.email) {
      // 1. Fetch Company Credentials
      let companyCredentials = null;
      try {
        const company = await Company.findByPk(req.user.company_id);
        if (company && company.email_user && company.email_pass) {
          companyCredentials = {
            email_user: company.email_user,
            email_pass: company.email_pass
          };
        }
      } catch (e) { console.warn("Could not fetch company creds for task email", e); }

      // 2. Format Priority
      let priorityText = "Unknown";
      if (Number(priority) === 1) priorityText = "High";
      if (Number(priority) === 2) priorityText = "Medium";
      if (Number(priority) === 3) priorityText = "Low";

      const subject = `New Task Assigned: ${title}`;

      const html = `
      <!DOCTYPE html>
      <html>
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>New Task Assignment</title>
          <style>
              /* Animations */
              @keyframes fadeInUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
              @keyframes pulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.05); } }
              @keyframes slideIn { from { opacity: 0; transform: translateX(-20px); } to { opacity: 1; transform: translateX(0); } }
              @keyframes gradientShift { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }
              
              /* Mobile Optimization */
              @media only screen and (max-width: 600px) {
                  .container { width: 100% !important; margin: 0 !important; border-radius: 0 !important; }
                  .outer-padding { padding: 0 !important; }
                  .content-padding { padding: 25px 20px !important; }
                  .header-padding { padding: 30px 20px !important; }
                  .header-text { font-size: 24px !important; }
                  .mobile-stack { display: block !important; width: 100% !important; padding-left: 0 !important; box-sizing: border-box !important; }
                  .priority-badge { display: inline-block !important; margin-top: 10px !important; }
              }
              
              .cta-button:hover { background: linear-gradient(135deg, #0066CC 0%, #004499 100%) !important; transform: translateY(-2px) !important; box-shadow: 0 8px 25px rgba(0, 102, 204, 0.4) !important; }
              .task-card:hover { transform: translateY(-5px) !important; box-shadow: 0 15px 35px rgba(0, 0, 0, 0.1) !important; }
          </style>
      </head>
      <body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f8fafc;">
              <tr>
                  <td class="outer-padding" style="padding: 20px 10px;">
                      <div class="container" style="max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #ffffff 0%, #f8fbff 100%); border-radius: 12px; overflow: hidden; box-shadow: 0 10px 40px rgba(0, 102, 204, 0.1); animation: fadeInUp 0.8s ease-out;">
                          
                          <div class="header-padding" style="background: linear-gradient(135deg, #0099FF 0%, #0066CC 50%, #004499 100%); background-size: 200% 200%; animation: gradientShift 8s ease infinite; padding: 35px 30px; text-align: center; position: relative; overflow: hidden;">
                              <div style="position: absolute; top: -50%; left: -50%; width: 200%; height: 200%; background: radial-gradient(circle, rgba(255,255,255,0.1) 1px, transparent 1px); background-size: 50px 50px; animation: slideIn 20s linear infinite;"></div>
                              <h1 class="header-text" style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700; letter-spacing: -0.5px; position: relative; z-index: 1; animation: fadeInUp 1s ease-out 0.3s both;">🎯 New Task Assignment</h1>
                              <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0 0; font-size: 15px; font-weight: 300; position: relative; z-index: 1; animation: fadeInUp 1s ease-out 0.5s both;">Your next challenge awaits</p>
                          </div>
                          
                          <div class="content-padding" style="padding: 30px 30px;">
                              
                              <div style="animation: fadeInUp 0.8s ease-out 0.7s both;">
                                  <p style="font-size: 18px; color: #1a202c; margin: 0 0 15px 0; font-weight: 600;">Hello <strong style="color: #0099FF;">${assignedUser.username}</strong>! 👋</p>
                                  <p style="font-size: 15px; color: #4a5568; line-height: 1.6; margin: 0 0 25px 0;">You have been assigned a new task. Please review the details below:</p>
                              </div>
                              
                              <div class="task-card" style="background: linear-gradient(135deg, #ffffff 0%, #f7f9fc 100%); border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin: 20px 0; box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05); transition: all 0.3s ease; animation: slideIn 0.8s ease-out 0.9s both;">
                                  
                                  <table width="100%" border="0" cellspacing="0" cellpadding="0">
                                      <tr>
                                          <td width="50" style="vertical-align: middle; padding-right: 15px;">
                                              <div style="width: 40px; height: 40px; background: linear-gradient(135deg, #0099FF 0%, #0066CC 100%); border-radius: 50%; text-align: center; line-height: 40px; font-size: 20px; color: white;">📋</div>
                                          </td>
                                          <td style="vertical-align: middle;">
                                              <h2 style="margin: 0; color: #1a202c; font-size: 20px; font-weight: 700; line-height: 1.2;">${title}</h2>
                                              <p style="margin: 4px 0 0 0; color: #718096; font-size: 13px; font-weight: 500;">${Project_Title}</p>
                                          </td>
                                      </tr>
                                  </table>

                                  <div style="margin-top: 15px;">
                                      <span style="display: inline-block; background: ${priorityText === 'High' ? 'linear-gradient(135deg, #ff4757 0%, #c44569 100%)' : priorityText === 'Medium' ? 'linear-gradient(135deg, #ffa726 0%, #ff9800 100%)' : 'linear-gradient(135deg, #42a5f5 0%, #1976d2 100%)'}; color: white; padding: 6px 14px; border-radius: 20px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; box-shadow: 0 3px 10px rgba(0,0,0,0.1); animation: pulse 2s ease-in-out infinite;">
                                          ${priorityText} Priority
                                      </span>
                                  </div>
                              </div>
                              
                              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 25px 0; border-collapse: collapse; animation: fadeInUp 0.8s ease-out 1.1s both;">
                                  <tr>
                                      <td colspan="2" style="padding: 10px 0 15px 0; border-bottom: 2px solid #e2e8f0;">
                                          <h3 style="margin: 0; color: #2d3748; font-size: 16px; font-weight: 700; display: flex; align-items: center;">
                                              Task Details
                                          </h3>
                                      </td>
                                  </tr>
                                  <tr>
                                      <td class="mobile-stack" style="padding: 12px 0; border-bottom: 1px solid #edf2f7; width: 120px; color: #4a5568; font-weight: 600; font-size: 14px;">Description</td>
                                      <td class="mobile-stack" style="padding: 12px 0; border-bottom: 1px solid #edf2f7; color: #2d3748; line-height: 1.5; font-size: 14px;">${description}</td>
                                  </tr>
                                  <tr>
                                      <td class="mobile-stack" style="padding: 12px 0; border-bottom: 1px solid #edf2f7; color: #4a5568; font-weight: 600; font-size: 14px;">Schedule</td>
                                      <td class="mobile-stack" style="padding: 12px 0; border-bottom: 1px solid #edf2f7; color: #2d3748; font-size: 14px;">
                                          <div style="margin-bottom: 5px;"><span style="color: #0099FF; font-weight: 600;">Start:</span> ${new Date(start).toLocaleString()}</div>
                                          <div><span style="color: #0099FF; font-weight: 600;">End:</span> ${new Date(end_time).toLocaleString()}</div>
                                      </td>
                                  </tr>
                                  <tr>
                                      <td style="padding: 15px 0; color: #4a5568; font-weight: 600;" class="mobile-stack">
                                          Status
                                      </td>
                                      <td style="padding: 15px 0; color: #2d3748;" class="mobile-stack">
                                          <span style="background: #f0fff4; color: #38a169; padding: 6px 12px; border-radius: 12px; font-size: 12px; font-weight: 600;">
                                              ✅ Assigned
                                          </span>
                                      </td>
                                  </tr>
                              </table>
                              
                              <div style="text-align: center; margin: 35px 0 20px 0; animation: fadeInUp 0.8s ease-out 1.3s both;">
                                  <a href="${process.env.FRONTEND_URL || '#'}" class="cta-button" style="background: linear-gradient(135deg, #0099FF 0%, #0066CC 100%); color: #ffffff; padding: 14px 30px; text-decoration: none; border-radius: 30px; font-weight: 700; font-size: 15px; display: inline-block; transition: all 0.3s ease; box-shadow: 0 6px 20px rgba(0, 102, 204, 0.3); text-transform: uppercase; letter-spacing: 0.5px;">
                                      <span style="margin-right: 6px;">🚀</span> View Task in App
                                  </a>
                              </div>

                              <div style="background: #f7fafc; border-radius: 8px; padding: 15px; margin: 25px 0 10px 0; border-left: 4px solid #0099FF; animation: fadeInUp 0.8s ease-out 1.5s both;">
                                  <p style="margin: 0; color: #4a5568; font-size: 13px; line-height: 1.5;">
                                      <strong>💡 Pro tip:</strong> Click the button above to access your task dashboard and start working on this assignment right away!
                                  </p>
                              </div>
                          </div>
                          
                          <div style="background: linear-gradient(135deg, #f8fafc 0%, #edf2f7 100%); padding: 25px 20px; text-align: center; border-top: 1px solid #e2e8f0;">
                              <p style="margin: 0 0 10px 0; font-size: 13px; color: #718096;">&copy; ${new Date().getFullYear()} Kleidsys Planning Tool. All rights reserved.</p>
                              <p style="margin: 0; font-size: 12px; color: #a0aec0;">You're receiving this because you're a valued team member.</p>
                          </div>
                      </div>
                  </td>
              </tr>
          </table>
      </body>
      </html>
`;

      await sendTaskEmail(assignedUser.email, subject, html, companyCredentials);
    }

    try {
      getIO().emit("task:created", task);

      // Send Push Notification
      if (assignedUser?.expo_push_token) {
        const { sendPushNotification } = require("../../services/notificationService");
        await sendPushNotification(
          assignedUser.expo_push_token,
          "📋 New Task Assigned",
          `Project: ${Project_Title}\nTask: ${title}\n${description || ''}`,
          { taskId: task.id, type: 'task_assigned' }
        );
      }
    } catch (pushError) {
      console.error("Push notification/Socket error:", pushError.message);
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

    try {
      getIO().emit("task:updated", updated);
    } catch (socketError) {
      console.error("Socket emit error:", socketError.message);
    }

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

    try {
      // Fetch fresh task to send consistent object structure if needed
      getIO().emit("task:updated", task);
    } catch (socketError) {
      console.error("Socket emit error:", socketError.message);
    }

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
    const taskId = task.id;

    // Delete related records first to avoid FK constraint errors
    const { TaskReason, TimeUpdate } = require("../../config/db");
    await TaskReason.destroy({ where: { task_id: taskId } });
    await TimeUpdate.destroy({ where: { task_id: taskId } });

    await deleteTask(task);

    const remaining = await countCompanyTasks(req.user.company_id);
    if (remaining === 0) {
      await sequelize.query(`DBCC CHECKIDENT ('tasks', RESEED, 0)`);
    }

    try {
      getIO().emit("task:deleted", taskId);
    } catch (socketError) {
      console.error("Socket emit error:", socketError.message);
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
    try {
      getIO().emit("task:updated", task);
    } catch (socketError) {
      console.error("Socket emit error:", socketError.message);
    }
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
      "status",
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
    try {
      getIO().emit("task:updated", task);
    } catch (err) {
      console.error("Socket emit error:", err.message);
    }
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
// PUT /timer/:id → Update timer_start / timer_end / task_start / status / elapsed_seconds
// ------------------------------------------------------------
exports.putTimer = async (req, res) => {
  try {
    const { id } = req.params;
    const { timer_start, timer_end, task_start, status, elapsed_seconds } = req.body;
    const companyId = req.user.company_id;

    const task = await findCompanyTask(id, companyId);
    if (!task) return res.status(404).json({ message: "Task not found" });

    const updateData = {};
    if (timer_start !== undefined) updateData.timer_start = timer_start;
    if (timer_end !== undefined) updateData.timer_end = timer_end;
    if (task_start !== undefined) updateData.task_start = task_start;
    if (status !== undefined) updateData.status = status;
    if (elapsed_seconds !== undefined) updateData.elapsed_seconds = elapsed_seconds;

    if (Object.keys(updateData).length === 0)
      return res.status(400).json({ message: "Nothing to update" });

    updateData.updated_at = new Date();
    await updateTask(task, updateData);

    // Fetch updated task for accurate response
    await task.reload();

    res.json({ message: "Timer updated successfully", task });
    try {
      const io = getIO();
      const taskData = task.get({ plain: true });
      console.log(`📡 Timer Updated - Task ${task.id}: status=${taskData.status}, task_start=${taskData.task_start}, timer_start=${taskData.timer_start}`);
      io.emit("task:updated", taskData);
      if (task.assigned_to) {
        io.to(`user_${task.assigned_to}`).emit("task:updated", taskData);
      }
    } catch (err) {
      console.error("Socket emit error:", err.message);
    }
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

    // Fetch fresh task or construct it if needed, but here we only have 'task' sequelize object
    // which has been updated.
    try {
      getIO().emit("task:updated", task);
    } catch (err) {
      console.error("Socket emit error:", err.message);
    }
  } catch (err) {
    console.error("reason error:", err);
    res.status(500).json({ error: "Server error" });
  }
}

exports.savePauseReason = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const userId = req.user.id;
    const companyId = req.user.company_id;

    if (!reason || reason.trim() === "") {
      return res.status(400).json({ error: "Reason is required" });
    }

    // Check task belongs to logged-in user
    const task = await findUserTask(id, userId, companyId);

    if (!task) {
      return res.status(403).json({ error: "Access denied" });
    }

    // Update pause reason
    await updateTaskReason(task, reason);

    res.json({
      message: "Pause reason saved",
      task_id: id,
    });
  } catch (err) {
    console.error("Error saving pause reason:", err);
    res.status(500).json({
      error: "Server error",
      details: err.message,
    });
  }
};

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


// USER: Insert new task (pending)
exports.userAddTask = async (req, res) => {
  try {
    const {
      title,
      description,
      Project_Title,
      start,
      end_time,
      priority,
      duration_minutes
    } = req.body;

    const { id: userId, company_id: companyId, is_admin, username } = req.user;

    // Save task
    const result = await insertUserTask(
      title,
      description,
      Project_Title,
      start,
      end_time,
      userId,
      priority,
      duration_minutes,
      companyId,
      is_admin
    );

    // ---- REALTIME EMIT TO ADMINS ----
    if (global.io) {
      global.io.to("admin").emit("newUserTaskRequest", {
        task: result,
        message: `New Task Submitted by User ${username}`
      });
    }

    // Success response
    res.status(201).json({
      message: "Task sent for admin approval",
      task: result,
    });

  } catch (err) {
    console.error("User Add Task Error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};


// ADMIN: Get pending task requests
exports.getPendingUserRequests = async (req, res) => {
  try {
    const tasks = await getPendingTasks(req.user);
    res.status(200).json(tasks);
  } catch (err) {
    console.error("Get pending approvals error:", err);

    if (err.message === "DEPARTMENT_MISSING") {
      return res.status(400).json({ message: "User department not found in token" });
    }

    if (err.message === "COMPANY_MISSING") {
      return res.status(400).json({ message: "User company not found in token" });
    }

    if (err.message === "NOT_AUTHORIZED") {
      return res.status(403).json({ message: "Not authorized" });
    }

    res.status(500).json({ message: "Failed to fetch pending approvals" });
  }
};

// ADMIN: Update approval status
exports.updateTaskApproval = async (req, res, statusFromRoute) => {
  try {
    const adminId = req.user.id;
    const taskId = req.params.id;
    const approval_status = statusFromRoute; // ← Take status from route

    const allowed = ["approved", "rejected"];
    if (!allowed.includes(approval_status)) {
      return res.status(400).json({ error: "Invalid approval status" });
    }

    const updatedTask = await updateApprovalStatus(
      approval_status,
      taskId,
      adminId
    );

    // Emit event for real-time updates
    try {
      const io = getIO();
      io.to(`user_${updatedTask.assigned_to}`).emit("task:updated", updatedTask);
      // Also emit to admin room to update dashboards if needed
      io.emit("task:updated", updatedTask);
    } catch (e) {
      console.error("Socket emit error on approval:", e);
    }

    res.status(200).json({
      message: `Task ${approval_status}`,
      task: updatedTask,
    });

  } catch (err) {
    console.error("Approval update error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// USER: Get approved tasks
exports.getUserApprovedTasks = async (req, res) => {
  try {
    const { userId } = req.params;
    const tasks = await getApprovedTasks(userId);
    res.status(200).json(tasks);
  } catch (err) {
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// Added APIs to fetch and delete Approval/Reject task notifications for the user dashboard 
exports.getUserNotifications = async (req, res) => {
  try {
    const userId = req.user.id;

    const tasks = await getUserNotificationsQuery(userId);

    res.status(200).json(tasks);
  } catch (err) {
    console.error("Get notifications error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

exports.deleteUserNotification = async (req, res) => {
  try {
    const userId = req.user.id;
    const taskId = req.params.id;

    const deleted = await deleteUserNotificationQuery(taskId, userId);

    if (!deleted) {
      return res.status(404).json({ error: "Notification not found" });
    }

    res.status(200).json({ message: "Notification deleted", task: deleted });
  } catch (err) {
    console.error("Delete notification error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// GET latest end_time of a user
exports.getLastTaskEndTime = async (req, res) => {
  try {
    const { userId } = req.params;
    const companyId = req.user.company_id;

    const lastTask = await getLastEndTimeByUser(userId, companyId);

    res.json({
      end_time: lastTask ? lastTask.end_time : null,
    });
  } catch (err) {
    console.error("❌ Failed to fetch last end time:", err);
    res.status(500).json({ error: "Failed to fetch end time" });
  }
};

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
