const { Task, TaskReason, User } = require("../../config/db");

// Map reasonKey → type
const reasonTypeMap = {
  start_early_reason: 1,
  start_late_reason: 2,
  pause_reason: 3,
  stop_reason: 4,
  conflict_pause_reason: 5,
  conflict_stop_reason: 6,
  conflict_runboth_reason: 7,
};

// Get all reasons for a company
const getAllReasonsByCompany = async (companyId) => {
  return await TaskReason.findAll({
    where: { company_id: companyId },
    include: [
      {
        model: User,
        attributes: ["username"],
      },
    ],
    order: [["createdAt", "DESC"]],
  });
};

// Validate task belongs to company
const findTaskByCompany = async (taskId, companyId) => {
  return await Task.findOne({
    where: { id: taskId, company_id: companyId },
  });
};

// Insert a reason
const createTaskReason = async (data) => {
  return await TaskReason.create(data);
};

// Get all reasons for a task
const getReasonsByTask = async (taskId, companyId) => {
  return await TaskReason.findAll({
    where: { task_id: taskId, company_id: companyId },
    include: [
      {
        model: User,
        attributes: ["username"],
      },
    ],
    order: [["createdAt", "DESC"]],
  });
};

const getBulkReasonsByTaskIds = async (taskIds, companyId) => {
  return await TaskReason.findAll({
    where: {
      task_id: taskIds,
      company_id: companyId,
    },
    include: [
      { model: User, attributes: ["username"] }
    ],
    order: [["createdAt", "ASC"]],
  });
};

module.exports = {
  getAllReasonsByCompany,
  reasonTypeMap,
  findTaskByCompany,
  createTaskReason,
  getReasonsByTask,
  getBulkReasonsByTaskIds,
};
