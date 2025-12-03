// models/projectModel.js
const { Project } = require("../../config/db");

// Get all projects for company
const getAllProjects = async (companyId) => {
  return await Project.findAll({
    where: { company_id: companyId },
    order: [["id", "ASC"]],
  });
};

// Find project by ID (company restricted)
const getProjectById = async (id, companyId) => {
  return await Project.findOne({
    where: { id, company_id: companyId },
  });
};

// Find project by project_code within company
const findProjectByCode = async (project_code, companyId) => {
  return await Project.findOne({
    where: { project_code, company_id: companyId },
  });
};

// Create project
const createProject = async (data) => {
  return await Project.create(data);
};

// Update project
const updateProject = async (project, data) => {
  return await project.update(data);
};

// Delete project
const deleteProject = async (project) => {
  return await project.destroy();
};

module.exports = {
  getAllProjects,
  getProjectById,
  findProjectByCode,
  createProject,
  updateProject,
  deleteProject
};
