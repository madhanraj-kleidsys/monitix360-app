// models/shiftModel.js
const { Shift, ShiftBreak } = require("../../config/db");

// Fetch all shifts with breaks
const getAllShifts = async (companyId) => {
  return await Shift.findAll({
    where: { company_id: companyId },
    include: [{ model: ShiftBreak }],
    order: [
      ["id", "ASC"],
      [ShiftBreak, "id", "ASC"],
    ],
  });
};

// Find a shift by ID
const findShiftById = async (id, companyId) => {
  return await Shift.findOne({
    where: { id, company_id: companyId },
  });
};

// Create shift
const createShift = async (data) => {
  return await Shift.create(data);
};

// Create break
const createBreak = async (data) => {
  return await ShiftBreak.create(data);
};

// Delete breaks for shift
const deleteBreaksByShift = async (shiftId, companyId) => {
  return await ShiftBreak.destroy({
    where: { shift_id: shiftId, company_id: companyId },
  });
};

// Delete shift
const deleteShift = async (shift) => {
  return await shift.destroy();
};

module.exports = {
  getAllShifts,
  findShiftById,
  createShift,
  createBreak,
  deleteBreaksByShift,
  deleteShift,
};
