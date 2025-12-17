// controllers/authController.js
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { v4: uuid } = require('uuid');
require("dotenv").config();
const db = require("../../config/db");
const {
  findUserByEmail,
  findCompanyByCode,
  createCompany,
  createUser,
  saveRefreshToken,
} = require("../auth/auth.model");

const JWT_SECRET = process.env.JWT_SECRET;
const ACCESS_SECRET = process.env.ACCESS_SECRET;
const REFRESH_SECRET = process.env.REFRESH_SECRET;
// ----------------------- REGISTER -----------------------
exports.register = async (req, res) => {
  try {
    const {
      username,
      email,
      password,
      confirmPassword,
      // role,
      companyName,
      companyCode,
    } = req.body;

    if (
      !username ||
      !email ||
      !password ||
      !confirmPassword ||
      // !role ||
      !companyName ||
      !companyCode
    ) {
      return res.status(400).json({ error: "All fields are required." });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ error: "Passwords do not match." });
    }

    // Check email exists
    const emailCheck = await findUserByEmail(email);
    if (emailCheck) {
      return res.status(409).json({ error: "Email already registered." });
    }

    // Check or create company
    let company = await findCompanyByCode(companyCode);
    if (!company) {
      company = await createCompany(companyName, companyCode);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const newUser = await createUser({
      username,
      email,
      password: hashedPassword,
      role,
      company_id: company.id,
    });

    res.status(201).json({
      message: "User registered successfully",
      user: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        company_id: newUser.company_id,
      },
    });
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// ----------------------- LOGIN -----------------------
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email/Username and password are required" });
    }

    // First try email login
    let user = await findUserByEmail(email);

    if (!user) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const payload = {
      id: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
      company_id: user.company_id,
    };

    const accessToken = jwt.sign(payload, ACCESS_SECRET, { expiresIn: "1m" });
    const refreshToken = jwt.sign({ id: user.id }, REFRESH_SECRET, { expiresIn: "7d" });

    // Save refresh token to DB
    await saveRefreshToken(refreshToken, user.id);

    res.json({ message: "Login successful", accessToken, refreshToken, user });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// ----------------------- REFRESH -----------------------
const { findUserByRefreshToken } = require("../auth/auth.model");

exports.refresh = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(401).json({ error: 'Missing refresh token' });
    }

    // 1. Verify token signature
    let decoded;
    try {
      decoded = jwt.verify(refreshToken, REFRESH_SECRET);
    } catch (e) {
      return res.status(403).json({ error: 'Invalid or expired refresh token' });
    }

    // 2. Check if token exists in DB (revocation check)
    const user = await findUserByRefreshToken(refreshToken);
    if (!user) {
      return res.status(403).json({ error: 'Refresh token not found in database (revoked or invalid)' });
    }

    // 3. Generate new access token
    const payload = {
      id: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
      company_id: user.company_id,
    };

    const newAccessToken = jwt.sign(payload, ACCESS_SECRET, { expiresIn: '1m' });

    res.json({ accessToken: newAccessToken });

  } catch (err) {
    console.error('Refresh error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};