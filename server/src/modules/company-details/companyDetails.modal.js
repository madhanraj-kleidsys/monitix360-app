// models/companyModel.js
const { Company } = require("../../config/db");

// get by company id
const getCompanyByPk = async (id) => {
  return await Company.findByPk(id);
};


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

// Update company email settings
const updateCompanyEmail = async (id, data) => {
  return await Company.update(data, { where: { id } });
};

module.exports = {
  getCompanyByPk,
  getAllCompanies,
  findCompanyByCode,
  createCompany,
  updateCompanyEmail,
};