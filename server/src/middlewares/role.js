// 11-11-2025 - Changes by Priyanka
// Create new file authorizeRoles
// Middleware: Authorize based on user roles
// checks if a logged-in user has permission (specific role access).
// const authorizeRoles = (...roles) => {
//   return (req, res, next) => {
//     if (!roles.includes(req.user.role)) {
//       return res.status(403).json({ message: "Access denied" });
//     }
//     next();
//   };
// };

const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.role)) {
      return res.status(403).json({ message: 'Access denied - insufficient permissions' });
    }
    next();
  };
};

module.exports = authorizeRoles;
