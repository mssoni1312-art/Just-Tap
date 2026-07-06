const { sendError } = require('../helpers/response');
const { verifyAccessToken } = require('../helpers/token');
const userRepository = require('../repositories/user.repository');
const AppError = require('../utils/AppError');

const authenticate = async (req, res, next) => {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
      throw new AppError('Authentication required', 401);
    }
    const token = header.slice(7);
    const decoded = verifyAccessToken(token);
    req.user = { id: decoded.id, email: decoded.email, role: decoded.role };

    if (!req.user.role && req.user.id) {
      const user = await userRepository.findById(req.user.id);
      if (user?.role) req.user.role = user.role;
    }

    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return sendError(res, 'Token expired', [], 401);
    }
    if (err.name === 'JsonWebTokenError') {
      return sendError(res, 'Invalid token', [], 401);
    }
    next(err);
  }
};

module.exports = authenticate;
