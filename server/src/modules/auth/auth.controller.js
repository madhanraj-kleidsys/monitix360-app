// controllers/authController.js
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { v4: uuid } = require('uuid');
require("dotenv").config();
const db = require("../../config/db");
const crypto = require("crypto");
const {
  findUserByEmail,
  findUserByUsername,
  findCompanyByCode,
  createCompany,
  createUser,
  saveRefreshToken,
  saveResetToken,
  findUserByResetToken,
  findUserByRefreshToken,
} = require("../auth/auth.model");
const { sendResetMail, sendOtpMail } = require("./utils/mail");
const { Company, User } = require("../../config/db");

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

    // Try email or username login
    let user = await findUserByEmail(email) || await findUserByUsername(email);

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

    const accessToken = jwt.sign(payload, ACCESS_SECRET, { expiresIn: "30m" });
    const refreshToken = jwt.sign({ id: user.id }, REFRESH_SECRET, { expiresIn: "30d" });

    // Save refresh token to DB
    await saveRefreshToken(refreshToken, user.id);

    res.json({ message: "Login successful", accessToken, refreshToken, user });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// ----------------------- REFRESH -----------------------
exports.refresh = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(401).json({ error: 'Missing refresh token' });
    }

    // 1. Decode token to get user context (even if expired or deleted)
    let decoded;
    try {
      decoded = jwt.verify(refreshToken, REFRESH_SECRET);
    } catch (e) {
      // If signature is valid but expired, we still check DB for reuse detection
      // But verify() throws on expiry. Let's use decode() for user context if verify fails.
      decoded = jwt.decode(refreshToken);
      if (!decoded || !decoded.id) {
        return res.status(403).json({ error: 'Invalid refresh token' });
      }
    }

    // 2. Reuse Detection
    const user = await findUserByRefreshToken(refreshToken);

    if (!user) {
      // ⚠️ POTENTIAL REUSE ATTACK
      // If we got here, the token is not in DB, but it belongs to a user.
      // We revoke all sessions for this user for safety.
      if (decoded && decoded.id) {
        console.warn(`🚨 Refresh token reuse detected for user ${decoded.id}.Revoking all sessions.`);
        await saveRefreshToken(null, decoded.id);
      }
      return res.status(403).json({ error: 'Refresh token reuse detected. Please log in again.' });
    }

    // 3. Generate new pair (Sliding Session)
    const payload = {
      id: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
      company_id: user.company_id,
    };

    const newAccessToken = jwt.sign(payload, ACCESS_SECRET, { expiresIn: '30m' });
    const newRefreshToken = jwt.sign({ id: user.id }, REFRESH_SECRET, { expiresIn: '30d' });

    // 4. Rotate: Save new token in DB
    await saveRefreshToken(newRefreshToken, user.id);

    res.json({ accessToken: newAccessToken, refreshToken: newRefreshToken });

  } catch (err) {
    console.error('Refresh error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// ----------------------- FORGOT PASSWORD (OTP) -----------------------
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email is required" });

    const user = await findUserByEmail(email);
    if (!user) {
      // Security: Don't reveal if user exists
      return res.status(200).json({ message: "If the account exists, an OTP has been sent." });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const hashedOtp = crypto.createHash("sha256").update(otp).digest("hex");
    const expiry = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

    await saveResetToken(user.id, hashedOtp, expiry);

    // Try to get company credentials for better delivery
    let companyCredentials = null;
    if (user.company_id) {
      try {
        const company = await Company.findByPk(user.company_id);
        if (company && company.email_user && company.email_pass) {
          // Ensure password is not encrypted or decode it if so (assuming plain for now based on previous code)
          companyCredentials = {
            email_user: company.email_user,
            email_pass: company.email_pass
          };
        }
      } catch (e) {
        console.warn("Failed to fetch company email settings for OTP:", e.message);
      }
    }

    // Send OTP
    await sendOtpMail(user.email, otp, companyCredentials);

    return res.status(200).json({ message: "OTP sent to your email" });
  } catch (err) {
    console.error("Forgot password error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ----------------------- VERIFY OTP -----------------------
exports.verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ message: "Email and OTP required" });

    const user = await findUserByEmail(email);
    if (!user) return res.status(400).json({ message: "Invalid Request" });

    const hashedOtp = crypto.createHash("sha256").update(otp).digest("hex");

    // Check if token matches and is not expired (findUserByResetToken logic checks expiry)
    // ideally we should check user.reset_token === hashedOtp

    if (user.reset_token !== hashedOtp) {
      return res.status(400).json({ message: "Invalid OTP" });
    }
    if (new Date() > user.reset_token_expiry) {
      return res.status(400).json({ message: "OTP Expired" });
    }

    res.json({ message: "OTP Verified", valid: true });
  } catch (err) {
    console.error("Verify OTP error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ----------------------- RESET PASSWORD -----------------------
exports.resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword) return res.status(400).json({ message: "Email, OTP and password required" });

    const user = await findUserByEmail(email);
    if (!user) return res.status(400).json({ message: "User not found" });

    const hashedOtp = crypto.createHash("sha256").update(otp).digest("hex");

    if (user.reset_token !== hashedOtp) {
      return res.status(400).json({ message: "Invalid OTP" });
    }
    if (new Date() > user.reset_token_expiry) {
      return res.status(400).json({ message: "OTP Expired" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await user.update({
      password: hashedPassword,
      reset_token: null,
      reset_token_expiry: null,
    });

    res.json({ message: "Password reset successful" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

// ----------------------- CHANGE PASSWORD -----------------------
exports.changePassword = async (req, res) => {
  try {
    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;

    const user = await User.findByPk(userId);
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) return res.status(400).json({ message: "Current password is incorrect" });

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await user.update({ password: hashedPassword });

    res.status(200).json({ message: "Password changed successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};