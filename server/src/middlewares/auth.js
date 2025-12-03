require('dotenv').config();
const jwt = require('jsonwebtoken');

// const authenticateJWT = (req, res, next) => {
//   const authHeader = req.headers.authorization;
//   // console.log("Authorization Header:", authHeader);

//   if (!authHeader || !authHeader.startsWith("Bearer ")) {
//     console.error("No token provided");
//     return res.status(401).json({ error: "Unauthorized - No token provided" });
//   }

//   // This splits the string "Bearer eyJhbGciOiJIUzI1NiIs..." into:
//   // ["Bearer", "eyJhbGciOiJIUzI1NiIs..."]
//   // Extract token (after 'Bearer ')
//   const token = authHeader.split(" ")[1];

//   jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {

//     // 11-11-2025 - Changes by Priyanka
//     // Handle specific JWT error cases: expired, invalid signature, or malformed token
//     if (err) {
//       console.error("JWT verification failed:", err.message);
//       let errorMessage = "Forbidden - Invalid token";

//       switch (err.message) {
//         case "jwt expired":
//           errorMessage = "Token has expired. Please log in again.";
//           break;
//         case "invalid signature":
//           errorMessage = "Invalid token signature.";
//           break;
//         case "jwt malformed":
//           errorMessage = "Malformed token. Please check your token format.";
//           break;
//         default:
//           errorMessage = "Token verification failed.";
//       }

//       return res.status(403).json({
//         error: "Forbidden - Invalid token",
//         message: err.message,        
//         details: errorMessage        
//       });
//     }

//     req.user = decoded;
//     // console.log("Authenticated user:", req.user);
//     next();
//   });
// };

const authenticateJWT = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.error('❌ No token provided');
    return res.status(401).json({ error: 'Unauthorized - Token missing' });
  }

  const token = authHeader.split(' ')[1];

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
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