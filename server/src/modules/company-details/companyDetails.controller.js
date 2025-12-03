// controllers/companyController.js
const {
  getAllCompanies,
  findCompanyByCode,
  createCompany,
} = require("../company-details/companyDetails.modal");

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
