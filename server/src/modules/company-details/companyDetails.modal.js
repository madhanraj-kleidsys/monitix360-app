// models/companyModel.js
const { Company } = require("../../config/db");

// Get all companies
const getAllCompanies = async () => {
  return await Company.findAll({
    order: [["id", "ASC"]],
  });
};

// Find company by code
const findCompanyByCode = async (code) => {
  return await Company.findOne({
    where: { company_code: code },
  });
};

// Create new company
const createCompany = async (data) => {
  return await Company.create(data);
};

module.exports = {
  getAllCompanies,
  findCompanyByCode,
  createCompany,
};
