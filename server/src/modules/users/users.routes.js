// routes/userRoutes.js
const express = require("express");
const router = express.Router();
const authenticateJWT = require("../../middlewares/auth");
const authorizeRoles  = require("../../middlewares/role");

const {
  getUsers,
  addUser,
  updateUser,
  removeUser,
  selectUsers,
  getSelectedUsers,
} = require("../users/users.controller");

// GET all users
router.get("/", authenticateJWT, getUsers);

// CREATE user
router.post("/", authenticateJWT, authorizeRoles("admin"), addUser);

// UPDATE user
router.patch("/:id", authenticateJWT, authorizeRoles("admin"), updateUser);

// DELETE user
router.delete("/:id", authenticateJWT, authorizeRoles("admin"), removeUser);

// SELECT employees
router.post("/select", authenticateJWT, authorizeRoles("admin"), selectUsers);

// GET selected employees
router.get("/selected", authenticateJWT, authorizeRoles("admin"), getSelectedUsers);

module.exports = router;
