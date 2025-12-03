// controllers/authController.js
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const {
  findUserByEmail,
  findCompanyByCode,
  createCompany,
  createUser,
} = require("../auth/auth.model");

const JWT_SECRET = process.env.JWT_SECRET;

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
      role:'admin',
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

    // If not found → try username login
    if (!user) {
      user = await findUserByUsername(email);
    }

    if (!user) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

// console.log("Received:", req.body);
// console.log("Email to find:", email);


    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
        company_id: user.company_id,
      },
      JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({ message: "Login successful", token, user });

  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

