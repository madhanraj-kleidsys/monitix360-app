// routes/companyRoutes.js
const express = require("express");
const router = express.Router();

const {
  getCompanyById,
  getCompanies,
  addCompany,
} = require("../company-details/companyDetails.controller");

//get compaies by id 
router.get("/:id", getCompanyById);

// GET all companies
router.get("/", getCompanies);

// POST add new company
router.post("/", addCompany);

const { updateEmailSettings, getEmailSettings } = require("../company-details/companyDetails.controller");

// Email Settings
router.get("/:id/email-settings", getEmailSettings);
router.post("/email-settings", updateEmailSettings);

module.exports = router;
