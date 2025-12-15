require('dotenv').config();
const jwt = require('jsonwebtoken');

const authenticateJWT = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.error('❌ No token provided');
    return res.status(401).json({ error: 'Unauthorized - Token missing' });
  }

  const token = authHeader.split(' ')[1];

  jwt.verify(token, process.env.ACCESS_SECRET, (err, decoded) => {
    if (err) {
      console.error('❌ JWT verification failed:', err.message);
      return res.status(403).json({ error: 'Forbidden - Invalid or expired token' });
    }

    // console.log("✅ Authenticated User Payload:", decoded);

    // Attach entire decoded token
    req.user = decoded;

    // Auto-detect correct field names
    req.user_id = decoded.id || decoded.user_id;
    req.company_id = decoded.company_id || decoded.companyId;
    req.role = decoded.role;

    next();
  });
};

module.exports = authenticateJWT;