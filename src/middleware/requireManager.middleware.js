const AppError = require('../utils/AppError');

const requireManager = (req, _res, next) => {
  if (!req.user || req.user.role !== 'manager') {
    return next(new AppError('Manager access required', 403));
  }
  next();
};

module.exports = requireManager;
