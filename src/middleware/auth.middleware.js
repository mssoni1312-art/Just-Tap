const { sendError } = require('../helpers/response');
const { verifyAccessToken } = require('../helpers/token');
const AppError = require('../utils/AppError');

const authenticate = (req, _res, next) => {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
      throw new AppError('Authentication required', 401);
    }
    const token = header.slice(7);
    const decoded = verifyAccessToken(token);
    req.user = { id: decoded.id, email: decoded.email, role: decoded.role };
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return sendError(_res, 'Token expired', [], 401);
    }
    if (err.name === 'JsonWebTokenError') {
      return sendError(_res, 'Invalid token', [], 401);
    }
    next(err);
  }
};

module.exports = authenticate;
