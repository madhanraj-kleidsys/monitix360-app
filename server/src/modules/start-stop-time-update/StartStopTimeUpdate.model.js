// models/timeModel.js
const { TimeUpdate, Task } = require("../../config/db");

// Validate task belongs to company
const findTaskByCompany = async (task_id, company_id) => {
  return await Task.findOne({
    where: { id: task_id, company_id },
  });
};

// Insert time update entry
const createTimeUpdate = async (data) => {
  return await TimeUpdate.create(data);
};

// Get all updates of a task
const getTimeUpdates = async (task_id) => {
  return await TimeUpdate.findAll({
    where: { task_id },
    order: [["time_logged", "DESC"]],
  });
};

module.exports = {
  findTaskByCompany,
  createTimeUpdate,
  getTimeUpdates,
};
