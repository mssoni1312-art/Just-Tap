const AppError = require('../utils/AppError');

const requireSuperAdmin = (req, _res, next) => {
  if (!req.user || req.user.role !== 'super_admin') {
    return next(new AppError('Super Admin access required', 403));
  }
  next();
};

module.exports = requireSuperAdmin;
