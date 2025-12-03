// controllers/shiftBreakController.js
const {
  findShiftById,
  createShiftBreak,
  getAllShiftsWithBreaks,
  findBreakById,
  updateShiftBreak,
  deleteShiftBreak,
} = require("../shift-break/shiftBreak.model");

// ------------------------------------------------------------
// ADD a break to a shift (Admin only)
// ------------------------------------------------------------
exports.addBreak = async (req, res) => {
  try {
    const { shiftId } = req.params;
    const { break_type, break_start, break_end } = req.body;

    if (!break_type || !break_start || !break_end) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const companyId = req.user.company_id;

    // Validate shift
    const shift = await findShiftById(shiftId, companyId);
    if (!shift) {
      return res.status(403).json({ error: "Unauthorized shift access" });
    }

    const newBreak = await createShiftBreak({
      shift_id: shiftId,
      break_type,
      break_start,
      break_end,
      company_id: companyId,
    });

    res.status(201).json(newBreak);
  } catch (err) {
    console.error("Error adding break:", err);
    res.status(500).json({ error: "Failed to add break" });
  }
};

// ------------------------------------------------------------
// GET all shifts with breaks (Company-wise)
// ------------------------------------------------------------
exports.getShifts = async (req, res) => {
  try {
    const companyId = req.user.company_id;

    const shifts = await getAllShiftsWithBreaks(companyId);

    res.json(shifts);
  } catch (err) {
    console.error("Error fetching shifts:", err);
    res.status(500).json({ error: "Failed to fetch shifts" });
  }
};

// ------------------------------------------------------------
// UPDATE break (Admin only)
// ------------------------------------------------------------
exports.updateBreak = async (req, res) => {
  try {
    const { breakId } = req.params;
    const { break_type, break_start, break_end } = req.body;

    const companyId = req.user.company_id;

    const shiftBreak = await findBreakById(breakId, companyId);
    if (!shiftBreak) {
      return res.status(403).json({ error: "Unauthorized break update" });
    }

    await updateShiftBreak(shiftBreak, {
      break_type,
      break_start,
      break_end,
    });

    res.json(shiftBreak);
  } catch (err) {
    console.error("Error updating break:", err);
    res.status(500).json({ error: "Failed to update break" });
  }
};

// ------------------------------------------------------------
// DELETE break (Admin only)
// ------------------------------------------------------------
exports.deleteBreak = async (req, res) => {
  try {
    const { breakId } = req.params;
    const companyId = req.user.company_id;

    const shiftBreak = await findBreakById(breakId, companyId);
    if (!shiftBreak) {
      return res.status(403).json({ error: "Unauthorized break deletion" });
    }

    await deleteShiftBreak(shiftBreak);

    res.json({ message: "Break deleted successfully" });
  } catch (err) {
    console.error("Error deleting break:", err);
    res.status(500).json({ error: "Failed to delete break" });
  }
};
