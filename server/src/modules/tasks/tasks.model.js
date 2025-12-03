// models/unplannedTaskModel.js
const { Task, User, sequelize } = require("../../config/db");

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
  getUnplannedTasks,
  createUnplanned,
  findUnplannedTask,
  updateUnplanned,
  deleteUnplanned,
};
