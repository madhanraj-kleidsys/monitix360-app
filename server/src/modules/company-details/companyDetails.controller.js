// controllers/companyController.js
const {
  getCompanyByPk,
  getAllCompanies,
  findCompanyByCode,
  createCompany,
  updateCompanyEmail,
} = require("../company-details/companyDetails.modal");

// get compay by id
exports.getCompanyById = async (req, res) => {
  try {
    const id = req.params.id;
    const company = await getCompanyByPk(id);
    // Company.findByPk(id);
    if (!company) {
      return res.status(404).json({ error: 'company not found for the provideed id' });
    }
    const companyRes = {
      ...company.toJSON(),
      email_pass: undefined,
      hasEmailConfig: !!company.email_pass
    };
    res.status(200).json(companyRes);
  }
  catch (err) {
    res.status(500).json({ error: "error in fetching company name: " + err.message });
    console.error(`${err.name} : ${err.message}`);
  }
};

// --------------------------------------------------
// GET ALL COMPANIES
// --------------------------------------------------
exports.getCompanies = async (req, res) => {
  try {
    const companies = await getAllCompanies();
    res.json(companies);
  } catch (error) {
    console.error("Error fetching companies:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// --------------------------------------------------
// ADD NEW COMPANY
// --------------------------------------------------
exports.addCompany = async (req, res) => {
  try {
    const { company_name, company_code } = req.body;

    if (!company_name || !company_code) {
      return res
        .status(400)
        .json({ error: "company_name and company_code are required" });
    }

    const existing = await findCompanyByCode(company_code);
    if (existing) {
      return res.status(409).json({
        error: "Company code already exists",
      });
    }

    const newCompany = await createCompany({
      company_name,
      company_code,
    });

    res.status(201).json({
      message: "Company added successfully",
      company: newCompany,
    });
  } catch (error) {
    console.error("Error adding company:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// ----------------------- EMAIL SETTINGS -----------------------

exports.updateEmailSettings = async (req, res) => {
  try {
    const { company_id, email_user, email_pass } = req.body;
    if (!company_id) return res.status(400).json({ error: "Company ID is required" });

    await updateCompanyEmail(company_id, { email_user, email_pass });
    res.json({ message: "Email settings updated successfully" });
  } catch (err) {
    console.error("Email update error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

exports.getEmailSettings = async (req, res) => {
  try {
    const { id } = req.params;
    const company = await getCompanyByPk(id);
    if (!company) return res.status(404).json({ error: "Company not found" });

    res.json({
      company: {
        email_user: company.email_user,
        hasPassword: !!company.email_pass
      }
    });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};
