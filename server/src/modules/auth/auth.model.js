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
const saveRefreshToken = async (token, userId) => {
  await User.update({ refresh_token: token }, { where: { id: userId } });
}

const findUserByRefreshToken = async (refreshToken) => {
  return await User.findOne({ where: { refresh_token: refreshToken } });
};

const saveResetToken = async (userId, hashedToken, expiry) => {
  await User.update({
    reset_token: hashedToken,
    reset_token_expiry: expiry
  }, { where: { id: userId } });
};

const findUserByResetToken = async (token) => {
  const { Op } = require('sequelize');
  return await User.findOne({
    where: {
      reset_token: token,
      reset_token_expiry: { [Op.gt]: new Date() }
    }
  });
};

const findUserByUsername = async (username) => {
  return await User.findOne({ where: { username } });
};

module.exports = {
  findUserByEmail,
  findCompanyByCode,
  createCompany,
  createUser,
  createCompany,
  createUser,
  saveRefreshToken,
  findUserByRefreshToken,
  saveResetToken,
  findUserByResetToken,
  findUserByUsername,
};

