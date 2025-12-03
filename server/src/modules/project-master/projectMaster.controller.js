// controllers/projectController.js

const {
  getAllProjects,
  getProjectById,
  findProjectByCode,
  createProject,
  updateProject,
  deleteProject
} = require("../project-master/projectMaster.model");

// =========================
// GET all projects
// =========================
exports.getProjects = async (req, res) => {
  try {
    const companyId = req.user.company_id;

    const projects = await getAllProjects(companyId);

    res.json(projects);
  } catch (err) {
    console.error("Error fetching projects:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

// =========================
// CREATE a new project
// =========================
exports.addProject = async (req, res) => {
  try {
    const { project_name, project_code } = req.body;

    if (!project_name || !project_code) {
      return res
        .status(400)
        .json({ error: "project_name and project_code are required" });
    }

    const companyId = req.user.company_id;

    // Duplicate check
    const exists = await findProjectByCode(project_code, companyId);

    if (exists) {
      return res
        .status(409)
        .json({ error: "Project code already exists for this company" });
    }

    const newProject = await createProject({
      project_name,
      project_code,
      company_id: companyId,
    });

    res.status(201).json(newProject);
  } catch (err) {
    console.error("Error creating project:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

// =========================
// UPDATE a project
// =========================
exports.updateProject = async (req, res) => {
  try {
    const { project_name, project_code } = req.body;
    const { id } = req.params;
    const companyId = req.user.company_id;

    const project = await getProjectById(id, companyId);

    if (!project) {
      return res
        .status(404)
        .json({ error: "Project not found or unauthorized" });
    }

    await updateProject(project, { project_name, project_code });

    res.json(project);
  } catch (err) {
    console.error("Error updating project:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

// =========================
// DELETE a project
// =========================
exports.deleteProject = async (req, res) => {
  try {
    const { id } = req.params;
    const companyId = req.user.company_id;

    const project = await getProjectById(id, companyId);

    if (!project) {
      return res
        .status(404)
        .json({ error: "Project not found or unauthorized" });
    }

    await deleteProject(project);

    res.json({ message: "Project deleted successfully" });
  } catch (err) {
    console.error("Error deleting project:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};
