// controllers/userController.js
const bcrypt = require("bcryptjs");

const {
  getAllUsers,
  findUserByField,
  createNewUser,
  updateUser,
  deleteUser,
  saveSelectedEmployees,
  getSelectedEmployees,
} = require("../users/users.model");

// -----------------------------
// GET ALL USERS (company wise)
// -----------------------------
exports.getUsers = async (req, res) => {
  try {
    const companyId = req.user.company_id;
    const users = await getAllUsers(companyId);
    res.json(users);
  } catch (err) {
    console.error("Error fetching users:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

// -----------------------------
// CREATE USER
// -----------------------------
exports.addUser = async (req, res) => {
  try {
    const company_id = req.user.company_id;  // ✅ ALWAYS use admin’s company
    const {
      first_name,
      last_name,
      user_code,
      username,
      email,
      password,
      contact_no,
      date_of_birth,
      department,
      division,
      role,
    } = req.body;

    const errors = {};

    const emailUser = await findUserByField("email", email);
    const usernameUser = await findUserByField("username", username);
    const codeUser = await findUserByField("user_code", user_code);

    if (emailUser) errors.email = "Email already exists";
    if (usernameUser) errors.username = "Username already exists";
    if (codeUser) errors.user_code = "User code already exists";

    if (Object.keys(errors).length > 0) {
      return res.status(409).json({ errors });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await createNewUser({
      company_id,       // ✅ always admin’s company
      first_name,
      last_name,
      user_code,
      username,
      email,
      password: hashedPassword,
      contact_no,
      date_of_birth,
      department,
      division,
      role: role || "user",
    });

    res.status(201).json({
      message: "User created successfully",
      user: newUser,
    });
  } catch (err) {
    console.error("User creation error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};


// -----------------------------
// UPDATE USER
// -----------------------------
exports.updateUser = async (req, res) => {
  try {
    const userId = req.params.id;
    const fields = req.body;

    const allowed = [
      "first_name",
      "last_name",
      "user_code",
      "username",
      "email",
      "password",
      "contact_no",
      "date_of_birth",
      "department",
      "division",
      "role",
    ];

    const updateData = {};
    for (const key of allowed) {
      if (fields[key] !== undefined) updateData[key] = fields[key];
    }

    if (updateData.password) {
      updateData.password = await bcrypt.hash(updateData.password, 10);
    }

    await updateUser(userId, updateData);

    res.json({ message: "User updated successfully" });
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// -----------------------------
// DELETE USER
// -----------------------------
exports.removeUser = async (req, res) => {
  try {
    const userId = req.params.id;

    const deleted = await deleteUser(userId);

    if (!deleted) return res.status(404).json({ error: "User not found" });

    res.json({ message: "User deleted successfully" });
  } catch (err) {
    console.error("Error deleting user:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

// -----------------------------
// SAVE SELECTED EMPLOYEES
// -----------------------------
exports.selectUsers = async (req, res) => {
  try {
    const adminId = req.user.id;
    const { selectedUserIds } = req.body;

    if (!Array.isArray(selectedUserIds)) {
      return res.status(400).json({ error: "selectedUserIds must be an array" });
    }

    const updatedList = await saveSelectedEmployees(adminId, selectedUserIds);

    res.json({
      message: "Selected employees updated",
      selectedEmployees: updatedList,
    });
  } catch (err) {
    console.error("Error saving selected employees:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

// -----------------------------
// GET SELECTED EMPLOYEES
// -----------------------------
exports.getSelectedUsers = async (req, res) => {
  try {
    const adminId = req.user.id;

    const users = await getSelectedEmployees(adminId);

    res.json(users);
  } catch (err) {
    console.error("Error fetching selected users:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};
