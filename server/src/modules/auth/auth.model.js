// models/authModel.js
const { User, Company } = require("../../config/db");

// Find user by email
const findUserByEmail = async (email) => {
  return await User.findOne({ where: { email } });
};

// Find company by code
const findCompanyByCode = async (companyCode) => {
  return await Company.findOne({ where: { company_code: companyCode } });
};

// Create new company
const createCompany = async (companyName, companyCode) => {
  return await Company.create({
    company_name: companyName,
    company_code: companyCode,
  });
};

// Create new user
const createUser = async (data) => {
  return await User.create(data);
};

// save refresh token
const saveRefreshToken = async (token, userId) =>{
    await User.update({ refresh_token: token }, { where: { id: userId } });
}

module.exports = {
  findUserByEmail,
  findCompanyByCode,
  createCompany,
  createUser,
  saveRefreshToken
};
