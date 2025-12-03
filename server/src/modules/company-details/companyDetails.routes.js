// routes/companyRoutes.js
const express = require("express");
const router = express.Router();

const {
  getCompanies,
  addCompany,
} = require("../company-details/companyDetails.controller");

// GET all companies
router.get("/", getCompanies);

// POST add new company
router.post("/", addCompany);

module.exports = router;
