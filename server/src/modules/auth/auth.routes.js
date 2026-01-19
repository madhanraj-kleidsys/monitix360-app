const express = require('express');
const { register, login, refresh, forgotPassword, resetPassword, changePassword, verifyOtp } = require('./auth.controller');
const authenticateJWT = require('../../middlewares/auth');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/refresh', refresh);
router.post('/forgot-password', forgotPassword);
router.post('/verify-otp', verifyOtp);
router.post('/reset-password', resetPassword);
router.post('/change-password', authenticateJWT, changePassword);

module.exports = router;
