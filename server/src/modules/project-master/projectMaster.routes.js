// routes/projectRoutes.js
const express = require("express");
const router = express.Router();
const authenticateJWT = require("../../middlewares/auth");

const {
  getProjects,
  addProject,
  updateProject,
  deleteProject
} = require("../project-master/projectMaster.controller");

// Routes
router.get("/", authenticateJWT, getProjects);
router.post("/", authenticateJWT, addProject);
router.put("/:id", authenticateJWT, updateProject);
router.delete("/:id", authenticateJWT, deleteProject);

module.exports = router;
