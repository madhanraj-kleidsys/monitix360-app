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

module.exports = router;
