// middleware/auth.js
// This middleware runs BEFORE route handlers that require authentication.
// It reads the JWT from the Authorization header, verifies it, and
// attaches the decoded user info to req.user so routes can use it.

const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
  // The token comes in the header like: Authorization: Bearer <token>
  const authHeader = req.headers['authorization'];

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No token provided. Access denied.' });
  }

  const token = authHeader.split(' ')[1]; // Extract just the token part

  try {
    // jwt.verify checks the signature AND expiry automatically
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { id, email, iat, exp }
    next();             // Pass control to the next middleware or route handler
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired. Please log in again.' });
    }
    return res.status(401).json({ message: 'Invalid token.' });
  }
};

module.exports = authMiddleware;
