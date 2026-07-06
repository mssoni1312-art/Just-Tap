const AppError = require('../utils/AppError');

const allowManagerOrSuperAdmin = (req, _res, next) => {
  const role = req.user?.role;
  if (role === 'manager' || role === 'super_admin') {
    return next();
  }
  return next(new AppError('Manager access required', 403));
};

module.exports = allowManagerOrSuperAdmin;
