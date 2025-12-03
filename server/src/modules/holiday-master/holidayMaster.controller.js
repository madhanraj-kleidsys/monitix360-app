// controllers/holidayController.js
const {
  getAllHolidays,
  getHolidayById,
  createHoliday,
  updateHoliday,
  deleteHoliday,
} = require("../holiday-master/holidayMaster.modal");

// ------------------------------------------------------------
// GET all holidays
// ------------------------------------------------------------
exports.getHolidays = async (req, res) => {
  try {
    const companyId = req.user.company_id;

    const holidays = await getAllHolidays(companyId);

    res.json(holidays);
  } catch (err) {
    console.error("GET /holidays:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// ------------------------------------------------------------
// GET holiday by ID
// ------------------------------------------------------------
exports.getHoliday = async (req, res) => {
  try {
    const companyId = req.user.company_id;
    const id = req.params.id;

    const holiday = await getHolidayById(id, companyId);

    if (!holiday) {
      return res.status(404).json({ error: "Holiday not found" });
    }

    res.json(holiday);
  } catch (err) {
    console.error("GET /holidays/:id:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// ------------------------------------------------------------
// ADD holiday (Admin only)
// ------------------------------------------------------------
exports.addHoliday = async (req, res) => {
  try {
    const { holiday_date, description } = req.body;
    const companyId = req.user.company_id;

    if (!holiday_date) {
      return res.status(400).json({ error: "holiday_date is required" });
    }

    await createHoliday({
      holiday_date,
      description: description || "",
      company_id: companyId,
    });

    res.status(201).json({ message: "Holiday added successfully" });
  } catch (err) {
    console.error("POST /holidays:", err);
    res.status(500).json({ error: "Failed to add holiday" });
  }
};

// ------------------------------------------------------------
// UPDATE holiday (Admin only)
// ------------------------------------------------------------
exports.updateHoliday = async (req, res) => {
  try {
    const companyId = req.user.company_id;
    const { holiday_date, description } = req.body;
    const id = req.params.id;

    const holiday = await getHolidayById(id, companyId);
    if (!holiday) {
      return res.status(404).json({ error: "Holiday not found" });
    }

    await updateHoliday(holiday, { holiday_date, description });

    res.json({ message: "Holiday updated successfully" });
  } catch (err) {
    console.error("PUT /holidays/:id:", err);
    res.status(500).json({ error: "Failed to update holiday" });
  }
};

// ------------------------------------------------------------
// DELETE holiday (Admin only)
// ------------------------------------------------------------
exports.deleteHoliday = async (req, res) => {
  try {
    const companyId = req.user.company_id;
    const id = req.params.id;

    const holiday = await getHolidayById(id, companyId);
    if (!holiday) {
      return res.status(404).json({ error: "Holiday not found" });
    }

    await deleteHoliday(holiday);

    res.json({ message: "Holiday deleted successfully" });
  } catch (err) {
    console.error("DELETE /holidays/:id:", err);
    res.status(500).json({ error: "Failed to delete holiday" });
  }
};
