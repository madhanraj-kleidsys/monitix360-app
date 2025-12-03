// models/shiftBreakModel.js
const { Shift, ShiftBreak } = require("../../config/db");

// Find shift by ID & company
const findShiftById = async (shiftId, companyId) => {
  return await Shift.findOne({
    where: { id: shiftId, company_id: companyId },
  });
};

// Create break
const createShiftBreak = async (data) => {
  return await ShiftBreak.create(data);
};

// Get all shifts with breaks
const getAllShiftsWithBreaks = async (companyId) => {
  return await Shift.findAll({
    where: { company_id: companyId },
    include: [{ model: ShiftBreak, required: false }],
    order: [
      ["id", "ASC"],
      [ShiftBreak, "id", "ASC"],
    ],
  });
};

// Find break by ID + company (for update/delete)
const findBreakById = async (breakId, companyId) => {
  return await ShiftBreak.findOne({
    where: { id: breakId, company_id: companyId },
  });
};

// Update break data
const updateShiftBreak = async (shiftBreak, data) => {
  return await shiftBreak.update(data);
};

// Delete break
const deleteShiftBreak = async (shiftBreak) => {
  return await shiftBreak.destroy();
};

module.exports = {
  findShiftById,
  createShiftBreak,
  getAllShiftsWithBreaks,
  findBreakById,
  updateShiftBreak,
  deleteShiftBreak
};
