import jwt from 'jsonwebtoken';

/**
 * Authentication Middleware
 * Verifies JWT token and extracts user information
 * 
 * Logic:
 * 1. Extract token from Authorization header (format: "Bearer <token>")
 * 2. Verify token using JWT_SECRET
 * 3. If valid, attach user data to request object
 * 4. If invalid or missing, return 401 unauthorized
 * 
 * Token payload contains: { id, email, role, expiresIn }
 * User data attached to request: req.user = { id, email, role }
 */
export const authenticate = (req, res, next) => {
  try {
    // Extract token from Authorization header
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ success: false, message: 'No token provided' });
    }

    // Verify token and decode payload
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach user data to request object for use in route handlers
    req.user = decoded;

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Token has expired' });
    }
    res.status(401).json({ success: false, message: 'Invalid token' });
  }
};

/**
 * Authorization Middleware
 * Verifies user has required role
 * 
 * Logic:
 * 1. Takes required role(s) as parameter
 * 2. Checks if user's role matches required role
 * 3. If role matches, proceed to next middleware
 * 4. If role doesn't match, return 403 forbidden
 * 
 * Usage: authorize('organizer') or authorize(['organizer', 'admin'])
 */
export const authorize = (requiredRole) => {
  return (req, res, next) => {
    // Handle both single role and array of roles
    const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Only ${roles.join(' or ')} can access this resource`,
      });
    }

    next();
  };
};
