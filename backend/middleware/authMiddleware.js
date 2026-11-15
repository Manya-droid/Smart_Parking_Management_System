import jwt from 'jsonwebtoken';

function authorize(allowedRoles) {
  return (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }
    try {
      const decoded = jwt.verify(authHeader.split(' ')[1], process.env.JWT_SECRET);
      if (!allowedRoles.includes(decoded.role)) {
        return res.status(403).json({ error: 'Access denied' });
      }
      req.admin = decoded; // purane code ke liye same naam
      next();
    } catch (err) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }
  };
}

export const requireAdmin = authorize(['admin']);
export const requireAdminOrOwner = authorize(['admin', 'vehicleOwner']);
export const requireOwner = authorize(['vehicleOwner']);
export const requireStaffOrAdmin = authorize(['admin', 'staff']);
export const requireAnyLogin = authorize(['admin', 'staff', 'vehicleOwner']);