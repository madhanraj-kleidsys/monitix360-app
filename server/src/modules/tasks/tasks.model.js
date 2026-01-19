const { Task, User, sequelize } = require("../../config/db");
const { Op } = require('sequelize');

// Create new task
const createTask = async (data) => {
  return await Task.create(data);
};

// Find user assigned to
const findUserById = async (id, companyId) => {
  return await User.findOne({ where: { id, company_id: companyId } });
};

// Get tasks assigned to logged-in user
const getMyTasks = async (userId, companyId) => {
  return await Task.findAll({
    where: { assigned_to: userId, company_id: companyId },
    include: [{ model: User, as: "AssignedBy", attributes: ["username"] }],
    order: [["id", "DESC"]],
  });
};

// Get all tasks (Admin)
const getAllTasks = async (companyId) => {
  return await Task.findAll({
    where: { company_id: companyId },
    include: [
      { model: User, as: "AssignedBy", attributes: ["username"] },
      { model: User, as: "AssignedTo", attributes: ["username"] },
    ],
    order: [["id", "DESC"]],
  });
};

// Minimal info
const getBasicUserTasks = async (userId, companyId) => {
  return await Task.findAll({
    attributes: ["start", "end_time"],
    where: { assigned_to: userId, company_id: companyId },
    order: [["start", "ASC"]],
  });
};

// Find task by ID
const findTask = async (taskId, companyId) => {
  return await Task.findOne({
    where: { id: taskId, company_id: companyId },
  });
};

// Find task for user (to allow user to update)
const findUserTask = async (taskId, userId, companyId) => {
  return await Task.findOne({
    where: { id: taskId, assigned_to: userId, company_id: companyId },
  });
};

// Overlap check for assignment
const findConflictingTasks = async (taskId, assignedTo, companyId, start, end) => {
  return await Task.findAll({
    where: {
      id: { [Op.ne]: taskId },
      assigned_to: assignedTo,
      company_id: companyId,
      start: { [Op.lt]: end },
      end_time: { [Op.gt]: start },
    },
  });
};


// Delete task
const deleteTask = async (task) => {
  return await task.destroy();
};

// Count company tasks
const countCompanyTasks = async (companyId) => {
  return await Task.count({ where: { company_id: companyId } });
};

// Find task for company
const findCompanyTask = async (taskId, companyId) => {
  return await Task.findOne({
    where: { id: taskId, company_id: companyId },
  });
};

// Update task fields
const updateTask = async (task, data) => {
  return await task.update(data);
};

// Get all unplanned tasks (company wise)
const getUnplannedTasks = async (companyId) => {
  return await Task.findAll({
    where: { company_id: companyId, status: "unplanned" },
    order: [["id", "ASC"]],
  });
};

// Create unplanned task
const createUnplanned = async (data) => {
  return await Task.create(data);
};

// Find specific unplanned task
const findUnplannedTask = async (id, companyId) => {
  return await Task.findOne({
    where: { id, company_id: companyId, status: "unplanned" },
  });
};

// Update unplanned task
const updateUnplanned = async (task, updates) => {
  return await task.update(updates);
};

// Delete unplanned task
const deleteUnplanned = async (task) => {
  return await task.destroy();
};

// UPDATE PAUSE REASON
const updateTaskReason = async (task, reason) => {
  return await task.update({
    reason,
    updated_at: new Date(),
  });
};

// USER: Insert new task (pending)
const insertUserTask = async (
  title,
  description,
  Project_Title,
  start,
  end_time,
  userId,
  priority,
  duration_minutes,
  companyId,
  isAdminUser
) => {
  return await Task.create({
    title,
    description,
    project_title: Project_Title,
    start,
    end_time,
    assigned_to: userId,
    priority,
    duration_minutes,
    added_by_user: true,
    approval_status: "pending",
    company_id: companyId,
    is_admin_added_task: isAdminUser === true,
  });
};

// ADMIN: Get pending task requests
const getPendingTasks = async ({
  id,
  role,
  is_admin,
  department,
  company_id,
}) => {

  if (!company_id) {
    throw new Error("COMPANY_MISSING");
  }

  // Task level condition
  let whereCondition = {
    company_id,
    added_by_user: true,
    approval_status: "pending",
  };

  // User (AssignedTo) level condition
  let userWhere = {
    company_id,
  };

  // 🔓 Main admin → all departments (same company)
  if (role === "admin") {
    // no department filter
  }

  // 🔒 User-admin → same department users only
  else if (role === "user" && is_admin === true) {
    whereCondition.is_admin_added_task = false;

    if (!department) {
      throw new Error("DEPARTMENT_MISSING");
    }

    userWhere.department = department;
  }

  else {
    throw new Error("NOT_AUTHORIZED");
  }

  return Task.findAll({
    where: whereCondition,
    include: [
      {
        model: User,
        as: "AssignedTo",
        attributes: ["id", "username", "is_admin", "department", "company_id"],
        where: userWhere,
        required: true,
      },
    ],
    order: [["createdAt", "DESC"]],
  });
};

// ADMIN: Update approval status
const updateApprovalStatus = async (status, taskId, adminId) => {
  await Task.update(
    {
      approval_status: status,
      assigned_by: adminId
    },
    { where: { id: taskId } }
  );

  return await Task.findOne({ where: { id: taskId } });
};

// USER: Get approved tasks
const getApprovedTasks = async (userId) => {
  return await Task.findAll({
    where: {
      assigned_to: userId,
      approval_status: "approved"
    },
    order: [["createdAt", "DESC"]],
  });
};

// Added APIs to fetch and delete Approval/Reject task notifications for the user dashboard 
const getUserNotificationsQuery = async (userId) => {
  return await Task.findAll({
    where: {
      assigned_to: userId,
      approval_status: ["approved", "rejected"]
    },
    order: [["createdAt", "DESC"]],
  });
};

const deleteUserNotificationQuery = async (taskId, userId) => {
  const found = await Task.findOne({
    where: { id: taskId, assigned_to: userId }
  });

  if (!found) return null;

  await found.destroy();

  return found;
};

const getLastEndTimeByUser = async (userId, companyId) => {
  return await Task.findOne({
    where: {
      assigned_to: userId,
      company_id: companyId,
      end_time: { [Op.ne]: null }
    },
    attributes: ["end_time"],
    order: [["end_time", "DESC"]],
  });
};

module.exports = {
  createTask,
  findUserById,
  getMyTasks,
  getAllTasks,
  getBasicUserTasks,
  findTask,
  findUserTask,
  findConflictingTasks,
  updateTask,
  deleteTask,
  countCompanyTasks,
  sequelize,
  findUserTask,
  findCompanyTask,
  updateTask,
  deleteUnplanned,
  insertUserTask,
  getPendingTasks,
  updateApprovalStatus,
  getApprovedTasks,
  getUserNotificationsQuery,
  deleteUserNotificationQuery,
  updateTaskReason,
  getLastEndTimeByUser,
  getUnplannedTasks,
  createUnplanned,
  findUnplannedTask,
  updateUnplanned,
};
