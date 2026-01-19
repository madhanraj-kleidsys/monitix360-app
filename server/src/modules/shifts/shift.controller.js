// controllers/shiftController.js
const {
  getAllShifts,
  findShiftById,
  createShift,
  createBreak,
  deleteBreaksByShift,
  deleteShift,
} = require("../shifts/shift.model");
const { getIO } = require("../../socket/socket");

// ------------------------------------------------------------
// GET all shifts with breaks
// ------------------------------------------------------------
exports.getShifts = async (req, res) => {
  try {
    const companyId = req.user.company_id;
    if (!companyId) {
      return res.status(400).json({ error: "Company ID missing from token" });
    }

    const shifts = await getAllShifts(companyId);

    res.json(shifts);
  } catch (err) {
    console.error("Error fetching shifts:", err);
    res.status(500).json({ error: "Failed to fetch shifts" });
  }
};

// ------------------------------------------------------------
// CREATE shift + breaks
// ------------------------------------------------------------
exports.addShift = async (req, res) => {
  try {
    const { shift_name, shift_start, shift_end, breaks = [] } = req.body;

    if (!shift_name || !shift_start || !shift_end) {
      return res.status(400).json({ error: "Required fields missing" });
    }

    const companyId = req.company_id;

    const newShift = await createShift({
      shift_name,
      shift_start,
      shift_end,
      company_id: companyId,
    });

    // Insert breaks
    for (const b of breaks) {
      await createBreak({
        shift_id: newShift.id,
        break_type: b.break_type,
        break_start: b.break_start,
        break_end: b.break_end,
        company_id: companyId,
      });
    }

    res.status(201).json(newShift);
    try {
      getIO().emit("shift:created", newShift);
    } catch (err) {
      console.error("Socket emit error:", err.message);
    }
  } catch (err) {
    console.error("Error creating shift:", err);
    res.status(500).json({ error: "Failed to add shift with breaks" });
  }
};

// ------------------------------------------------------------
// UPDATE shift + breaks
// ------------------------------------------------------------
exports.updateShift = async (req, res) => {
  try {
    const { id } = req.params;
    const { shift_name, shift_start, shift_end, breaks = [] } = req.body;

    const companyId = req.company_id;

    const shift = await findShiftById(id, companyId);
    if (!shift) {
      return res.status(404).json({ error: "Shift not found or unauthorized" });
    }

    // Update shift
    await shift.update({
      shift_name,
      shift_start,
      shift_end,
    });

    // Remove old breaks
    await deleteBreaksByShift(id, companyId);

    // Insert new breaks
    for (const b of breaks) {
      await createBreak({
        shift_id: id,
        break_type: b.break_type,
        break_start: b.break_start,
        break_end: b.break_end,
        company_id: companyId,
      });
    }

    res.json({ message: "Shift updated successfully" });
    try {
      // Ideally fetch the updated shift to send it, but trigger a fetch on client is easiest
      getIO().emit("shift:updated", { id, shift_name, shift_start, shift_end, breaks });
    } catch (err) {
      console.error("Socket emit error:", err.message);
    }
  } catch (err) {
    console.error("Error updating shift:", err);
    res.status(500).json({ error: "Failed to update shift" });
  }
};

// ------------------------------------------------------------
// DELETE shift + breaks
// ------------------------------------------------------------
exports.deleteShift = async (req, res) => {
  try {
    const { id } = req.params;

    const companyId = req.company_id;

    const shift = await findShiftById(id, companyId);
    if (!shift) {
      return res.status(404).json({ error: "Shift not found or unauthorized" });
    }

    // Delete shift
    await deleteShift(shift);

    // Delete associated breaks
    await deleteBreaksByShift(id, companyId);

    res.json({ message: "Shift deleted successfully" });
    try {
      getIO().emit("shift:deleted", id);
    } catch (err) {
      console.error("Socket emit error:", err.message);
    }
  } catch (err) {
    console.error("Error deleting shift:", err);
    res.status(500).json({ error: "Failed to delete shift" });
  }
};
