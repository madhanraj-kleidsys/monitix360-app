// models/userModel.js
const { User } = require("../../config/db");

// Get all users for company
const getAllUsers = async (companyId) => {
  return await User.findAll({
    where: { company_id: companyId },
    order: [["id", "DESC"]],
  });
};

// Check duplicate email / username / user_code
const findUserByField = async (field, value) => {
  return await User.findOne({ where: { [field]: value } });
};

// Create user
const createNewUser = async (data) => {
  return await User.create(data);
};

// Update user
const updateUser = async (id, fields) => {
  return await User.update(fields, { where: { id } });
};

// Delete user
const deleteUser = async (id) => {
  return await User.destroy({ where: { id } });
};

// Save selected employees (ARRAY stored as JSON)
const saveSelectedEmployees = async (adminId, selectedEmployees) => {
  const admin = await User.findByPk(adminId);
  admin.selected_employees = selectedEmployees;
  await admin.save();
  return admin.selected_employees;
};

// Get selected employee objects for admin
const getSelectedEmployees = async (adminId) => {
  const admin = await User.findByPk(adminId);
  const ids = admin.selected_employees || [];

  if (ids.length === 0) return [];

  return await User.findAll({
    where: { id: ids },
    order: [["id", "ASC"]],
  });
};

module.exports = {
  getAllUsers,
  findUserByField,
  createNewUser,
  updateUser,
  deleteUser,
  saveSelectedEmployees,
  getSelectedEmployees,
};
