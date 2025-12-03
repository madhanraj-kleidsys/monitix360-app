// models/holidayModel.js
const { DeclaredHoliday } = require("../../config/db");

// Get all holidays for company
const getAllHolidays = async (companyId) => {
  return await DeclaredHoliday.findAll({
    where: { company_id: companyId },
    order: [["holiday_date", "ASC"]],
  });
};

// Get holiday by ID + company
const getHolidayById = async (id, companyId) => {
  return await DeclaredHoliday.findOne({
    where: { id, company_id: companyId },
  });
};

// Create holiday
const createHoliday = async (data) => {
  return await DeclaredHoliday.create(data);
};

// Update holiday
const updateHoliday = async (holiday, data) => {
  return await holiday.update(data);
};

// Delete holiday
const deleteHoliday = async (holiday) => {
  return await holiday.destroy();
};

module.exports = {
  getAllHolidays,
  getHolidayById,
  createHoliday,
  updateHoliday,
  deleteHoliday,
};
